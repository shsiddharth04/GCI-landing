-- Course deposit payment schema
-- Parallel to masterclass_bookings + masterclass_payments — intentionally isolated, no shared tables.

CREATE TABLE course_enrollments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  email                text NOT NULL,
  phone                text NOT NULL,
  is_masters_union     boolean NOT NULL DEFAULT false,
  deposit_amount       integer NOT NULL DEFAULT 200000,   -- paise (₹2,000)
  deposit_status       text NOT NULL DEFAULT 'pending'
    CHECK (deposit_status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_attempted_at timestamptz DEFAULT NULL,          -- stamped before Razorpay order creation; used by backstop cron
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
-- No public policies. All writes via service_role edge functions.

CREATE TABLE course_payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id        uuid NOT NULL REFERENCES course_enrollments(id),
  razorpay_order_id    text NOT NULL,
  razorpay_payment_id  text,                 -- set on capture
  status               text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed')),
  amount               integer NOT NULL,     -- paise
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX course_payments_order_id_idx ON course_payments (razorpay_order_id);

ALTER TABLE course_payments ENABLE ROW LEVEL SECURITY;
-- No public policies. Edge functions use service_role key (bypasses RLS).
