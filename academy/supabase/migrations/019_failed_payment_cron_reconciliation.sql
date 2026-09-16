-- 019: Close two expiry gaps
--
-- Gap 1 (Scenario 1): payment.failed webhook fires → masterclass_bookings.payment_status
--   flips to 'failed'. Both existing crons check payment_status = 'pending' and never see
--   it. A confirmed+failed slot is invisible to both crons indefinitely.
--
--   Fix: new cron cancels confirmed+failed bookings after 30 min, but ONLY if there is no
--   active pending retry in flight (user may have re-opened Razorpay and is re-trying).
--   The guard `NOT EXISTS(pending payment record)` ensures we don't cancel a booking
--   mid-retry.
--
-- Gap 2 (Scenario 2): If Razorpay's webhook fails all delivery attempts, payment_status
--   stays 'pending' while the payment was genuinely captured. The existing 30-min cron
--   would incorrectly cancel a paid booking.
--
--   Fix: reconcile-payments Edge Function checks Razorpay's API directly for any pending
--   payment record older than 10 min. Runs every 15 min via pg_cron → pg_net, guaranteeing
--   ≥2 reconciliation passes before the 30-min expiry cron fires. If the booking was
--   already cancelled before reconciliation ran, admin gets an alert email.

-- ── Gap 1: expire confirmed+failed-payment bookings ───────────────────────────

SELECT cron.schedule(
  'expire-failed-payment-bookings',
  '*/15 * * * *',
  $$
    UPDATE masterclass_bookings b
    SET    status = 'cancelled'
    WHERE  b.status         = 'confirmed'
      AND  b.payment_status = 'failed'
      -- No active retry in progress — user is no longer in a payment flow
      AND  NOT EXISTS (
             SELECT 1 FROM masterclass_payments p
             WHERE  p.masterclass_booking_id = b.id
               AND  p.status = 'pending'
           )
      -- The failed attempt itself is at least 30 min old (payment_record.created_at
      -- is when the order was opened, not when it failed — close enough for this guard)
      AND  EXISTS (
             SELECT 1 FROM masterclass_payments p
             WHERE  p.masterclass_booking_id = b.id
               AND  p.status = 'failed'
               AND  p.created_at < now() - interval '30 minutes'
           );
  $$
);

-- ── Gap 2: reconcile-payments Edge Function scheduled via pg_net ──────────────

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Call the reconcile-payments Edge Function every 15 min.
-- verify_jwt = false for this function (set in config.toml) — the function is
-- idempotent and safe to call without auth (only marks what Razorpay confirms).
SELECT cron.schedule(
  'reconcile-captured-payments',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://tyxioxfmkflzokzvfaxc.supabase.co/functions/v1/reconcile-payments',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);
