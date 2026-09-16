-- 018: Atomic payment tracking + cron backstop for no-payment-record stuck slots
--
-- Root cause addressed: create-razorpay-order could open the Razorpay modal even
-- when the masterclass_payments INSERT failed (pre-fix deployed version). The booking
-- stayed confirmed+pending with no payment record indefinitely because the existing
-- cron's EXISTS guard correctly protects pre-payment-era bookings (30+ live confirmed
-- bookings with no payment record) but also skips the stuck ones.
--
-- Fix:
--   payment_attempted_at — set by create-razorpay-order AFTER the Razorpay order is
--   created on Razorpay's side, BEFORE the INSERT. This column is the authoritative
--   signal that Razorpay was invoked for a given booking, even if the DB write failed.
--
--   New cron job — catches bookings where payment_attempted_at is set but no
--   masterclass_payments row ever appeared. Runs every 15 min, 30-min threshold.
--   Pre-payment-era bookings (payment_attempted_at IS NULL) are untouched.

ALTER TABLE masterclass_bookings
  ADD COLUMN IF NOT EXISTS payment_attempted_at TIMESTAMPTZ DEFAULT NULL;

-- Backstop: Razorpay was invoked but the payment record was never written.
-- Distinct from the existing job (which catches attempted→abandoned flows where
-- the payment record IS present). Both jobs are needed.
SELECT cron.schedule(
  'expire-no-payment-record-bookings',
  '*/15 * * * *',
  $$
    UPDATE masterclass_bookings b
    SET    status = 'cancelled'
    WHERE  b.status               = 'confirmed'
      AND  b.payment_status       = 'pending'
      AND  b.payment_attempted_at IS NOT NULL
      AND  b.payment_attempted_at < now() - interval '30 minutes'
      AND  NOT EXISTS (
             SELECT 1 FROM masterclass_payments p
             WHERE  p.masterclass_booking_id = b.id
           );
  $$
);
