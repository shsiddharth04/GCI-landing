import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Intentionally separate keys from the masterclass reconcile function.
const RAZORPAY_COURSE_KEY_ID     = Deno.env.get('RAZORPAY_COURSE_KEY_ID')!
const RAZORPAY_COURSE_KEY_SECRET = Deno.env.get('RAZORPAY_COURSE_KEY_SECRET')!
const SUPABASE_URL               = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY             = Deno.env.get('RESEND_API_KEY')!

const FROM = 'GCI Music Academy <noreply@gigcultureindia.com>'

// ── Purpose ───────────────────────────────────────────────────────────────────
//
// Runs every 15 minutes (pg_cron → pg_net). Checks Razorpay directly for any
// course_payments row still 'pending' older than 10 minutes. Two scenarios:
//
//   A. Enrollment still pending — webhook delayed or failed delivery.
//      Mark payment as paid. Webhook will eventually retry and hit the
//      idempotency guard; confirmation email fires then.
//
//   B. Enrollment already cancelled — expiry cron won the race first.
//      Mark payment as paid, alert admin. Do NOT auto-revert cancellation.
//
// Safe to call multiple times (idempotent).

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const rzpCreds = btoa(`${RAZORPAY_COURSE_KEY_ID}:${RAZORPAY_COURSE_KEY_SECRET}`)

  // Check pending payments older than 10 min.
  // Running every 15 min means 2+ passes before the 30-min expiry cron fires.
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: stalePending, error: fetchErr } = await supabase
    .from('course_payments')
    .select('id, razorpay_order_id, enrollment_id, amount')
    .eq('status', 'pending')
    .lt('created_at', cutoff)

  if (fetchErr) {
    console.error('Failed to fetch pending course payments:', fetchErr)
    return new Response(JSON.stringify({ ok: false, error: fetchErr.message }), { status: 500 })
  }

  const actions: { payment_id: string; action: string }[] = []

  for (const payment of stalePending ?? []) {
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id, name, email, deposit_status')
      .eq('id', payment.enrollment_id)
      .single()

    if (!enrollment) {
      actions.push({ payment_id: payment.id, action: 'enrollment_not_found' })
      continue
    }

    const rzpRes = await fetch(
      `https://api.razorpay.com/v1/orders/${payment.razorpay_order_id}/payments`,
      { headers: { Authorization: `Basic ${rzpCreds}` } }
    )

    if (!rzpRes.ok) {
      console.error(`Razorpay API error for order ${payment.razorpay_order_id}:`, rzpRes.status)
      actions.push({ payment_id: payment.id, action: `razorpay_api_error_${rzpRes.status}` })
      continue
    }

    const rzpData = await rzpRes.json()
    const captured = (rzpData.items ?? []).find(
      (p: { status: string }) => p.status === 'captured'
    )

    if (!captured) {
      actions.push({ payment_id: payment.id, action: 'not_captured' })
      continue
    }

    // Payment is captured on Razorpay's side — reconcile the DB
    await supabase
      .from('course_payments')
      .update({ status: 'paid', razorpay_payment_id: captured.id })
      .eq('id', payment.id)

    await supabase
      .from('course_enrollments')
      .update({ deposit_status: 'paid' })
      .eq('id', payment.enrollment_id)

    if (enrollment.deposit_status === 'cancelled') {
      // Scenario B: expiry cron already cancelled the enrollment before this ran.
      // Do NOT auto-revert. Alert admin immediately.
      actions.push({ payment_id: payment.id, action: 'reconciled_cancelled_enrollment_NEEDS_ADMIN' })

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: ['finance@gigcultureindia.com'],
          subject: `ACTION REQUIRED — paid course deposit auto-cancelled: ${enrollment.name}`,
          html: `
            <p><strong>A course deposit payment was received AFTER the enrollment was auto-cancelled by the expiry cron (webhook delivery failure).</strong></p>
            <table style="font-family:monospace;font-size:13px;border-collapse:collapse">
              <tr><td style="padding:4px 12px 4px 0">Enrollment ID</td><td>${enrollment.id}</td></tr>
              <tr><td style="padding:4px 12px 4px 0">Student</td><td>${enrollment.name} (${enrollment.email})</td></tr>
              <tr><td style="padding:4px 12px 4px 0">Razorpay order</td><td>${payment.razorpay_order_id}</td></tr>
              <tr><td style="padding:4px 12px 4px 0">Payment ID</td><td>${captured.id}</td></tr>
              <tr><td style="padding:4px 12px 4px 0">Amount</td><td>₹${payment.amount / 100}</td></tr>
            </table>
            <p>Please contact the student and either confirm their batch enrollment or initiate a refund via the Razorpay dashboard.</p>
          `,
        }),
      }).catch(e => console.error('Admin alert email failed:', e))

    } else {
      // Scenario A: enrollment still pending, webhook was just late.
      // DB is now correct. Webhook will retry and hit idempotency guard.
      actions.push({ payment_id: payment.id, action: 'reconciled_active_enrollment' })
      console.log(`Reconciled course payment ${payment.id} for enrollment ${enrollment.id}`)
    }
  }

  return new Response(
    JSON.stringify({ ok: true, checked: (stalePending ?? []).length, actions }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
