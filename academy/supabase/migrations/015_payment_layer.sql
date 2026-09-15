-- 015: Add payment layer for masterclass ₹179 session fee
--
-- Additive only — no existing columns, RPCs, or booking behavior is altered.
-- The payment_status column is added to masterclass_bookings as a nullable
-- field with a default of 'pending' so existing rows are unaffected.
--
-- masterclass_payments tracks one Razorpay order per confirmed booking.
-- The webhook (razorpay-webhook Edge Function) is the only writer; it uses the
-- service_role key which bypasses RLS. No public policies are created — anon
-- clients have no direct access to payment records.

-- ── payment_status column on masterclass_bookings ────────────────────────────

ALTER TABLE masterclass_bookings
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'
    CONSTRAINT masterclass_bookings_payment_status_check
      CHECK (payment_status IN ('pending', 'paid', 'failed'));

-- ── masterclass_payments table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS masterclass_payments (
  id                     uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  masterclass_booking_id uuid        NOT NULL REFERENCES masterclass_bookings(id),
  razorpay_order_id      text        NOT NULL,
  razorpay_payment_id    text,                            -- set on capture
  status                 text        NOT NULL DEFAULT 'pending'
    CONSTRAINT masterclass_payments_status_check
      CHECK (status IN ('pending', 'paid', 'failed')),
  amount                 integer     NOT NULL,            -- in paise (₹179 = 17900)
  created_at             timestamptz DEFAULT now()
);

-- Index for fast webhook lookups by Razorpay order ID
CREATE INDEX IF NOT EXISTS masterclass_payments_order_id_idx
  ON masterclass_payments (razorpay_order_id);

-- RLS on — no public policies.
-- Edge Functions use service_role key which bypasses RLS entirely.
ALTER TABLE masterclass_payments ENABLE ROW LEVEL SECURITY;
