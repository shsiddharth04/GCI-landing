-- 023: Sequential invoice numbering
--
-- Problems with the previous approach:
--   - Invoice numbers were derived on-the-fly from UUID prefixes (INV-09F7D712)
--     and never written to any DB column — not queryable, not auditable.
--   - UUID-derived numbers are not sequential and do not satisfy standard
--     bookkeeping / Indian GST record-keeping expectations.
--
-- This migration introduces:
--   invoice_sequences     — atomic per-series counter table
--   next_invoice_number() — increments the counter and returns a formatted
--                           number like GCI/MC/26-27/0001 (Indian FY-aware)
--   invoice_number column — added to masterclass_payments and course_payments
--
-- Existing paid rows are backfilled with their legacy UUID-derived numbers so
-- the column is fully populated and PDFs in storage remain reconcilable.
-- Going forward every payment capture writes a sequential number via the RPC.

-- ── Sequences table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoice_sequences (
  series      text    PRIMARY KEY,       -- e.g. 'MC-26-27', 'CD-26-27'
  last_number integer NOT NULL DEFAULT 0
);

ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
-- No public policies. Edge Functions use service_role which bypasses RLS.

-- ── next_invoice_number() ────────────────────────────────────────────────────
-- Atomically increments the counter for the given prefix + current Indian FY
-- and returns a formatted invoice number string.
--
-- Indian financial year runs 1 April → 31 March.
-- p_prefix 'MC' → masterclass, 'CD' → course deposit.
-- Example return value: 'GCI/MC/26-27/0001'

CREATE OR REPLACE FUNCTION next_invoice_number(p_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now      timestamptz := now() AT TIME ZONE 'Asia/Kolkata';
  v_month    int         := EXTRACT(MONTH FROM v_now)::int;
  v_year     int         := EXTRACT(YEAR  FROM v_now)::int;
  v_fy_start int;
  v_fy_end   int;
  v_series   text;
  v_next     int;
BEGIN
  IF v_month >= 4 THEN
    v_fy_start := v_year;
    v_fy_end   := v_year + 1;
  ELSE
    v_fy_start := v_year - 1;
    v_fy_end   := v_year;
  END IF;

  v_series := p_prefix
    || '-' || lpad((v_fy_start % 100)::text, 2, '0')
    || '-' || lpad((v_fy_end   % 100)::text, 2, '0');

  INSERT INTO invoice_sequences (series, last_number)
  VALUES (v_series, 1)
  ON CONFLICT (series) DO UPDATE
    SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'GCI/'
    || p_prefix || '/'
    || lpad((v_fy_start % 100)::text, 2, '0')
    || '-'
    || lpad((v_fy_end   % 100)::text, 2, '0')
    || '/'
    || lpad(v_next::text, 4, '0');
END;
$$;

-- ── invoice_number column — masterclass_payments ─────────────────────────────

ALTER TABLE masterclass_payments
  ADD COLUMN IF NOT EXISTS invoice_number text;

-- Partial unique index: NULL is allowed (pre-migration rows not yet backfilled
-- during a race), but any two non-NULL values must be distinct.
CREATE UNIQUE INDEX IF NOT EXISTS masterclass_payments_invoice_number_idx
  ON masterclass_payments (invoice_number)
  WHERE invoice_number IS NOT NULL;

-- ── invoice_number column — course_payments ──────────────────────────────────

ALTER TABLE course_payments
  ADD COLUMN IF NOT EXISTS invoice_number text;

CREATE UNIQUE INDEX IF NOT EXISTS course_payments_invoice_number_idx
  ON course_payments (invoice_number)
  WHERE invoice_number IS NOT NULL;

-- ── Backfill existing paid records ───────────────────────────────────────────
-- These rows already have PDFs in storage printed with these exact numbers.
-- Storing them here makes the audit trail queryable without re-opening PDFs.

UPDATE masterclass_payments
SET invoice_number = 'INV-' || upper(substring(masterclass_booking_id::text, 1, 8))
WHERE status = 'paid'
  AND invoice_number IS NULL;

UPDATE course_payments
SET invoice_number = 'CE-' || upper(substring(enrollment_id::text, 1, 8))
WHERE status = 'paid'
  AND invoice_number IS NULL;

-- ── Restrict next_invoice_number to service_role only ────────────────────────

REVOKE ALL     ON FUNCTION public.next_invoice_number(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_invoice_number(text) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.next_invoice_number(text) TO   service_role;

-- ── Live bug fix: deposit poll silently returns nothing for paying users ──────
-- course_enrollments has RLS enabled with zero policies → anon SELECT = empty.
-- EnrollmentForm.tsx polls this after Razorpay checkout. Fix: SECURITY DEFINER
-- RPC callable by anon/authenticated.

CREATE OR REPLACE FUNCTION public.get_course_enrollment_status(p_enrollment_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT deposit_status FROM course_enrollments WHERE id = p_enrollment_id;
$$;

REVOKE ALL     ON FUNCTION public.get_course_enrollment_status(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_course_enrollment_status(uuid) TO anon, authenticated;

-- ── finance_alerts: deduplication table for order_not_found email alerts ──────

CREATE TABLE IF NOT EXISTS finance_alerts (
  payment_id text        PRIMARY KEY,
  order_id   text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE finance_alerts ENABLE ROW LEVEL SECURITY;
-- No public policies. Edge Functions use service_role client which bypasses RLS.
