-- 016: Expire abandoned Razorpay checkouts after 30 minutes
--
-- When VITE_RAZORPAY_ENABLED=true, bookMasterclassSlot() reserves the slot
-- before the payment screen opens. If the user abandons Razorpay without
-- paying, the slot stays confirmed with payment_status='pending' indefinitely.
-- This cron job releases those slots every 15 minutes.
--
-- Predicate design:
--   The EXISTS clause on masterclass_payments is intentional — it ensures only
--   bookings where create-razorpay-order was actually called (i.e. the user
--   reached the checkout and abandoned it) are expired. Bookings made when the
--   flag is off have payment_status='pending' by default but no payment record,
--   and must NOT be cancelled. Pre-existing bookings (Karan etc.) are safe.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'expire-pending-masterclass-bookings',  -- job name (unique)
  '*/15 * * * *',                         -- every 15 minutes
  $$
    UPDATE masterclass_bookings b
    SET status = 'cancelled'
    WHERE b.status          = 'confirmed'
      AND b.payment_status  = 'pending'
      AND b.created_at      < now() - interval '30 minutes'
      AND EXISTS (
        SELECT 1 FROM masterclass_payments p
        WHERE p.masterclass_booking_id = b.id
          AND p.status = 'pending'
      );
  $$
);
