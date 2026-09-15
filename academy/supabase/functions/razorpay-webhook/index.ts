import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// verify_jwt = false in config.toml — Razorpay doesn't send a Supabase JWT.
// Authenticity is verified via HMAC-SHA256 signature on the raw body instead.

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function verifySignature(rawBody: string, receivedSig: string): Promise<boolean> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(RAZORPAY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody))
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  return expected === receivedSig
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const rawBody = await req.text()
  const receivedSig = req.headers.get('x-razorpay-signature') ?? ''

  if (!receivedSig || !(await verifySignature(rawBody, receivedSig))) {
    return new Response('Signature mismatch', { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const orderId: string = payment.order_id
    const paymentId: string = payment.id

    const { data: paymentRec } = await supabase
      .from('masterclass_payments')
      .select('id, masterclass_booking_id, status')
      .eq('razorpay_order_id', orderId)
      .maybeSingle()

    if (!paymentRec) {
      console.error('No payment record found for order:', orderId)
      return new Response(JSON.stringify({ ok: false, reason: 'order_not_found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Idempotency: already processed — return 200 so Razorpay doesn't retry
    if (paymentRec.status === 'paid') {
      return new Response(JSON.stringify({ ok: true, note: 'already_processed' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })
    }

    await supabase
      .from('masterclass_payments')
      .update({ status: 'paid', razorpay_payment_id: paymentId })
      .eq('id', paymentRec.id)

    await supabase
      .from('masterclass_bookings')
      .update({ payment_status: 'paid' })
      .eq('id', paymentRec.masterclass_booking_id)

    // Fetch booking for confirmation email
    const { data: booking } = await supabase
      .from('masterclass_bookings')
      .select('name, email, slot_date, slot_start_time, slot_end_time')
      .eq('id', paymentRec.masterclass_booking_id)
      .single()

    if (booking) {
      fetch(`${SUPABASE_URL}/functions/v1/send-masterclass-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          name: booking.name,
          email: booking.email,
          date: booking.slot_date,
          startTime: (booking.slot_start_time as string).slice(0, 5),
          endTime: (booking.slot_end_time as string).slice(0, 5),
          status: 'paid',
        }),
      }).catch(err => console.error('Failed to send confirmation email:', err))
    }

  } else if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity
    const orderId: string = payment.order_id

    const { data: paymentRec } = await supabase
      .from('masterclass_payments')
      .select('id, masterclass_booking_id')
      .eq('razorpay_order_id', orderId)
      .maybeSingle()

    if (paymentRec) {
      await supabase
        .from('masterclass_payments')
        .update({ status: 'failed' })
        .eq('id', paymentRec.id)
        .eq('status', 'pending')

      // Only flip booking status if it hasn't already been marked paid
      await supabase
        .from('masterclass_bookings')
        .update({ payment_status: 'failed' })
        .eq('id', paymentRec.masterclass_booking_id)
        .eq('payment_status', 'pending')
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
})
