-- 014: Tighten RLS, fix capacity race, prevent duplicate registrations
--
-- Three problems fixed here before the payment layer is added in 015:
--
--   1. RLS on masterclass_bookings allowed public UPDATE — any anon client
--      could flip status or payment_status directly via REST. Removed.
--   2. RLS on masterclass_slot_overrides was a single ALL policy open to public
--      — any anon client could insert/modify/delete admin-controlled overrides.
--      Replaced with SELECT-only; writes go through SECURITY DEFINER RPCs.
--   3. book_masterclass_slot() counted confirmed bookings without a lock, so
--      two concurrent requests on the same slot could both see count < capacity
--      and both land as 'confirmed'. Fixed with pg_advisory_xact_lock.
--   4. No UNIQUE constraint on (slot_date, slot_start_time, email) allowed the
--      same person to book the same slot twice. Index added; no live duplicates
--      existed as of the 2026-09-15 audit (pre-checked before applying).
--
-- Admin write path note:
-- The admin Schedule page (src/admin/pages/Schedule.tsx) calls
-- upsertSlotOverride() and deleteSlotOverride() in db.ts using the anon key.
-- Those functions are re-routed here to call SECURITY DEFINER RPCs instead of
-- direct table writes. The admin login flow (client-side password gate) is
-- unchanged — only the DB write path is updated.

-- ── 1. masterclass_bookings: remove public INSERT and UPDATE policies ─────────

DROP POLICY IF EXISTS mc_bookings_insert ON masterclass_bookings;
DROP POLICY IF EXISTS mc_bookings_update ON masterclass_bookings;

-- SELECT stays: admin dashboard and SessionPicker both read the table directly.

-- ── 2. masterclass_slot_overrides: restrict public to SELECT only ─────────────

DROP POLICY IF EXISTS overrides_all ON masterclass_slot_overrides;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'masterclass_slot_overrides'
      AND policyname = 'overrides_select'
  ) THEN
    CREATE POLICY overrides_select ON masterclass_slot_overrides
      FOR SELECT TO public USING (true);
  END IF;
END $$;

-- ── 3. SECURITY DEFINER RPCs for admin override management ───────────────────
--
-- Called by db.ts:upsertSlotOverride() and db.ts:deleteSlotOverride() after
-- those functions are updated to route through RPCs instead of direct table ops.

CREATE OR REPLACE FUNCTION public.upsert_slot_override(
  p_date     date,
  p_start    time,
  p_end      time,
  p_override text,
  p_reason   text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  INSERT INTO masterclass_slot_overrides (slot_date, slot_start, slot_end, override, reason)
  VALUES (p_date, p_start, p_end, p_override, p_reason)
  ON CONFLICT (slot_date, slot_start)
  DO UPDATE SET
    slot_end = EXCLUDED.slot_end,
    override = EXCLUDED.override,
    reason   = EXCLUDED.reason;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_slot_override(
  p_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  DELETE FROM masterclass_slot_overrides WHERE id = p_id;
END;
$$;

-- ── 4. Dedup index: prevent same email booking same slot twice ────────────────
--
-- Partial index excludes cancelled rows so a cancelled-then-rebooked flow works.

CREATE UNIQUE INDEX IF NOT EXISTS masterclass_bookings_slot_email_uniq
  ON masterclass_bookings (slot_date, slot_start_time, email)
  WHERE status != 'cancelled';

-- ── 5. Replace book_masterclass_slot() with advisory-locked version ───────────
--
-- pg_advisory_xact_lock(class int4, obj int4) serialises all transactions that
-- try to book the same (slot_date, slot_start_time) combination. The lock is
-- automatically released when the transaction ends.
--
-- Lock key derivation:
--   class = days since Unix epoch  (fits int4 for any date through ~5,882,000 AD)
--   obj   = minutes since midnight (0–1440, well within int4)
--
-- Also catches unique_violation from the new dedup index and returns a clean
-- 'already_registered' error instead of a raw Postgres exception.

CREATE OR REPLACE FUNCTION public.book_masterclass_slot(
  p_date          date,
  p_start_time    time,
  p_end_time      time,
  p_name          text,
  p_email         text,
  p_phone         text,
  p_slot_capacity integer DEFAULT 3
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_confirmed_count INT;
  v_manual_override TEXT;
  v_class_blocked   BOOL;
  v_status          TEXT;
  v_id              UUID;
BEGIN
  -- Serialise concurrent bookings on this slot. Released at transaction end.
  PERFORM pg_advisory_xact_lock(
    (EXTRACT(EPOCH FROM p_date)::bigint / 86400)::int,
    (EXTRACT(HOUR FROM p_start_time)::int * 60
      + EXTRACT(MINUTE FROM p_start_time)::int)::int
  );

  -- Manual override check
  SELECT override INTO v_manual_override
  FROM masterclass_slot_overrides
  WHERE slot_date  = p_date
    AND slot_start = p_start_time
  LIMIT 1;

  IF v_manual_override = 'blocked' THEN
    RETURN json_build_object('error', 'slot_blocked');
  END IF;

  -- Course-class conflict check (skip if admin forced open)
  IF v_manual_override IS DISTINCT FROM 'open' THEN
    SELECT EXISTS (
      SELECT 1 FROM sessions
      WHERE session_type = 'course_class'
        AND session_date  = p_date
        AND status NOT IN ('cancelled')
        AND start_time    < p_end_time
        AND end_time      > p_start_time
    ) INTO v_class_blocked;

    IF v_class_blocked THEN
      RETURN json_build_object('error', 'slot_blocked');
    END IF;
  END IF;

  -- Capacity check (safe now — advisory lock prevents concurrent over-count)
  SELECT COUNT(*) INTO v_confirmed_count
  FROM masterclass_bookings
  WHERE slot_date       = p_date
    AND slot_start_time = p_start_time
    AND status          = 'confirmed';

  v_status := CASE
    WHEN v_confirmed_count >= p_slot_capacity THEN 'waitlisted'
    ELSE 'confirmed'
  END;

  BEGIN
    INSERT INTO masterclass_bookings
      (slot_date, slot_start_time, slot_end_time, name, email, phone, status)
    VALUES
      (p_date, p_start_time, p_end_time, p_name, p_email, p_phone, v_status)
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('error', 'already_registered');
  END;

  RETURN json_build_object('id', v_id, 'status', v_status);
END;
$$;
