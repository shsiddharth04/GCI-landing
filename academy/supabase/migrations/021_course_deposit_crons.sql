-- 021: Reliability crons for the DJ course deposit payment flow
--
-- Mirrors the masterclass cron set (016, 018, 019) exactly, adapted for
-- course_enrollments + course_payments. All four jobs run every 15 minutes.
--
-- Cron 1 (mirrors 016): Expire abandoned checkouts.
--   create-course-deposit-order reserves the enrollment row before Razorpay opens.
--   If the user abandons without paying, deposit_status stays 'pending' with an
--   orphaned course_payments row. The EXISTS guard ensures only enrollments where
--   Razorpay was actually reached are expired — not enrollments that just never
--   got to the payment step.
--
-- Cron 2 (mirrors 018): Backstop for no-payment-record enrollments.
--   payment_attempted_at is stamped by create-course-deposit-order BEFORE the
--   Razorpay order is created, so it is set even if the course_payments INSERT
--   fails. Catches enrollments where Razorpay was invoked but no payment record
--   ever appeared. NOT EXISTS distinguishes these from Cron 1 cases.
--
-- Cron 3 (mirrors 019 Gap 1): Expire confirmed+failed-payment enrollments.
--   payment.failed webhook flips deposit_status to 'failed'. Crons 1 and 2
--   check for 'pending' and never see it. NOT EXISTS(pending payment) guards
--   against cancelling an enrollment mid-retry.
--
-- Cron 4 (mirrors 019 Gap 2): Schedule reconcile-course-payments via pg_net.
--   Runs every 15 min, giving ≥2 reconciliation passes before the 30-min expiry
--   fires. Catches genuine captures where Razorpay's webhook failed delivery.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Cron 1: Expire abandoned checkouts ───────────────────────────────────────

SELECT cron.schedule(
  'expire-pending-course-enrollments',
  '*/15 * * * *',
  $$
    UPDATE course_enrollments e
    SET    deposit_status = 'cancelled'
    WHERE  e.deposit_status = 'pending'
      AND  e.created_at     < now() - interval '30 minutes'
      AND  EXISTS (
             SELECT 1 FROM course_payments p
             WHERE  p.enrollment_id = e.id
               AND  p.status = 'pending'
           );
  $$
);

-- ── Cron 2: Backstop for no-payment-record enrollments ───────────────────────

SELECT cron.schedule(
  'expire-no-payment-record-enrollments',
  '*/15 * * * *',
  $$
    UPDATE course_enrollments e
    SET    deposit_status = 'cancelled'
    WHERE  e.deposit_status        = 'pending'
      AND  e.payment_attempted_at  IS NOT NULL
      AND  e.payment_attempted_at  < now() - interval '30 minutes'
      AND  NOT EXISTS (
             SELECT 1 FROM course_payments p
             WHERE  p.enrollment_id = e.id
           );
  $$
);

-- ── Cron 3: Expire failed-payment enrollments ─────────────────────────────────

SELECT cron.schedule(
  'expire-failed-payment-enrollments',
  '*/15 * * * *',
  $$
    UPDATE course_enrollments e
    SET    deposit_status = 'cancelled'
    WHERE  e.deposit_status = 'failed'
      -- No active retry in flight
      AND  NOT EXISTS (
             SELECT 1 FROM course_payments p
             WHERE  p.enrollment_id = e.id
               AND  p.status = 'pending'
           )
      -- The failed attempt is at least 30 min old
      AND  EXISTS (
             SELECT 1 FROM course_payments p
             WHERE  p.enrollment_id = e.id
               AND  p.status = 'failed'
               AND  p.created_at < now() - interval '30 minutes'
           );
  $$
);

-- ── Cron 4: Schedule reconcile-course-payments via pg_net ─────────────────────

SELECT cron.schedule(
  'reconcile-captured-course-payments',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://tyxioxfmkflzokzvfaxc.supabase.co/functions/v1/reconcile-course-payments',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);
