import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RAZORPAY_KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID')!
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY       = Deno.env.get('RESEND_API_KEY')!

const FROM = 'GCI Music Academy <noreply@gigcultureindia.com>'

// ── Purpose ───────────────────────────────────────────────────────────────────
//
// Runs every 15 minutes (pg_cron → pg_net). Checks Razorpay's API directly for
// any masterclass_payments row still in 'pending' status that is older than 10
// minutes. Two scenarios:
//
//   A. Booking still confirmed — webhook is just delayed or delivery failed.
//      Mark payment as paid before the 30-min expiry cron fires. The webhook
//      will eventually arrive (idempotent) and send the confirmation email.
//
//   B. Booking already cancelled — the expiry cron won the race before this
//      ran. The slot may have been re-assigned. Mark payment as paid, alert
//      admin to reschedule or refund. Do NOT auto-revert booking status.
//
// The function is safe to call multiple times (idempotent — checks Razorpay
// status before writing, and the payment.captured webhook checks for
// status='paid' before re-processing).

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const rzpCreds = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)

  // Window: check any pending payment older than 10 min.
  // Running every 15 min means we get 2+ passes before the 30-min expiry fires.
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: stalePending, error: fetchErr } = await supabase
    .from('masterclass_payments')
    .select('id, razorpay_order_id, masterclass_booking_id, amount')
    .eq('status', 'pending')
    .lt('created_at', cutoff)

  if (fetchErr) {
    console.error('Failed to fetch pending payments:', fetchErr)
    return new Response(JSON.stringify({ ok: false, error: fetchErr.message }), { status: 500 })
  }

  const actions: { payment_id: string; action: string }[] = []

  for (const payment of stalePending ?? []) {
    // Fetch booking details
    const { data: booking } = await supabase
      .from('masterclass_bookings')
      .select('id, name, email, status, payment_status, slot_date, slot_start_time, slot_end_time')
      .eq('id', payment.masterclass_booking_id)
      .single()

    if (!booking) {
      actions.push({ payment_id: payment.id, action: 'booking_not_found' })
      continue
    }

    // Check Razorpay for the actual payment state on this order
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
      // Not captured — genuine abandonment or in-flight; leave it for the expiry cron
      actions.push({ payment_id: payment.id, action: 'not_captured' })
      continue
    }

    // Payment is captured on Razorpay's side — reconcile the DB
    await supabase
      .from('masterclass_payments')
      .update({ status: 'paid', razorpay_payment_id: captured.id })
      .eq('id', payment.id)

    await supabase
      .from('masterclass_bookings')
      .update({ payment_status: 'paid' })
      .eq('id', payment.masterclass_booking_id)

    if (booking.status === 'cancelled') {
      // Scenario B: expiry cron already cancelled the booking before this ran.
      // Slot may be taken — don't auto-revert. Alert admin immediately.
      actions.push({ payment_id: payment.id, action: 'reconciled_cancelled_booking_NEEDS_ADMIN' })

      const fmt = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        const s = h >= 12 ? 'PM' : 'AM'
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
        return `${h12}:${String(m).padStart(2, '0')} ${s}`
      }
      const slotLine = booking.slot_date
        ? `${booking.slot_date} ${fmt((booking.slot_start_time as string).slice(0, 5))} – ${fmt((booking.slot_end_time as string).slice(0, 5))}`
        : '(slot unknown)'

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: ['finance@gigcultureindia.com'],
          subject: `ACTION REQUIRED — paid booking auto-cancelled: ${booking.name}`,
          html: `
            <p><strong>A real payment was received AFTER the slot was auto-cancelled by the expiry cron (webhook delivery failure).</strong></p>
            <table style="font-family:monospace;font-size:13px;border-collapse:collapse">
              <tr><td style="padding:4px 12px 4px 0">Booking ID</td><td>${booking.id}</td></tr>
              <tr><td style="padding:4px 12px 4px 0">Student</td><td>${booking.name} (${booking.email})</td></tr>
              <tr><td style="padding:4px 12px 4px 0">Slot</td><td>${slotLine}</td></tr>
              <tr><td style="padding:4px 12px 4px 0">Razorpay order</td><td>${payment.razorpay_order_id}</td></tr>
              <tr><td style="padding:4px 12px 4px 0">Payment ID</td><td>${captured.id}</td></tr>
              <tr><td style="padding:4px 12px 4px 0">Amount</td><td>₹${payment.amount / 100}</td></tr>
            </table>
            <p>The slot may have been re-assigned. Please contact the student and either reschedule or initiate a refund via the Razorpay dashboard.</p>
          `,
        }),
      }).catch(e => console.error('Admin alert email failed:', e))

    } else {
      // Scenario A: booking still confirmed, just the webhook was late.
      // DB is now correct. The webhook will eventually retry and hit the
      // idempotency guard (status='paid'), sending the confirmation email then.
      // No duplicate email needed here.
      actions.push({ payment_id: payment.id, action: 'reconciled_active_booking' })
      console.log(`Reconciled payment ${payment.id} for active booking ${booking.id}`)
    }
  }

  return new Response(
    JSON.stringify({ ok: true, checked: (stalePending ?? []).length, actions }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
