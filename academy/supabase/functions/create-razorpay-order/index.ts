import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const MASTERCLASS_AMOUNT_PAISE = 17900 // ₹179

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { booking_id } = await req.json()
    if (!booking_id) return json({ error: 'booking_id required' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify booking exists, is confirmed, and not already paid
    const { data: booking, error: bookingErr } = await supabase
      .from('masterclass_bookings')
      .select('id, name, email, phone, status, payment_status')
      .eq('id', booking_id)
      .single()

    if (bookingErr || !booking) return json({ error: 'booking_not_found' }, 404)
    if (booking.status !== 'confirmed') return json({ error: 'booking_not_confirmed' }, 400)
    if (booking.payment_status === 'paid') return json({ error: 'already_paid' }, 400)

    // Check for an existing payment record
    const { data: existing } = await supabase
      .from('masterclass_payments')
      .select('id, razorpay_order_id, status')
      .eq('masterclass_booking_id', booking_id)
      .in('status', ['pending', 'paid'])
      .maybeSingle()

    if (existing?.status === 'paid') return json({ error: 'already_paid' }, 400)

    // Idempotent: return existing pending order rather than creating a duplicate
    if (existing?.status === 'pending') {
      return json({
        order_id: existing.razorpay_order_id,
        amount: MASTERCLASS_AMOUNT_PAISE,
        currency: 'INR',
        key_id: RAZORPAY_KEY_ID,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
      })
    }

    // Create Razorpay order
    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: MASTERCLASS_AMOUNT_PAISE,
        currency: 'INR',
        receipt: `mc_${(booking_id as string).slice(0, 8)}`,
        notes: { booking_id, name: booking.name, email: booking.email },
      }),
    })

    if (!rzpRes.ok) {
      const errBody = await rzpRes.json()
      console.error('Razorpay order creation failed:', errBody)
      return json({ error: 'razorpay_error', detail: errBody }, 502)
    }

    const order = await rzpRes.json()

    // Stamp the booking to record that Razorpay was invoked. This happens BEFORE
    // the payment record INSERT so the cron backstop (migration 018) can catch
    // this slot even if the INSERT below fails.
    await supabase
      .from('masterclass_bookings')
      .update({ payment_attempted_at: new Date().toISOString() })
      .eq('id', booking_id)

    const { error: insertErr } = await supabase
      .from('masterclass_payments')
      .insert({
        masterclass_booking_id: booking_id,
        razorpay_order_id: order.id,
        status: 'pending',
        amount: MASTERCLASS_AMOUNT_PAISE,
      })

    if (insertErr) {
      console.error('Failed to insert payment record:', insertErr)
      return json({ error: 'db_error' }, 500)
    }

    // Read back the inserted row before returning the order to the client.
    // The checkout modal must not open unless the payment record is confirmed
    // visible in the DB — this closes the phantom-write gap.
    const { data: verified } = await supabase
      .from('masterclass_payments')
      .select('id')
      .eq('masterclass_booking_id', booking_id)
      .eq('razorpay_order_id', order.id)
      .maybeSingle()

    if (!verified) {
      console.error('Payment record not visible after insert — aborting checkout')
      return json({ error: 'db_error' }, 500)
    }

    return json({
      order_id: order.id,
      amount: MASTERCLASS_AMOUNT_PAISE,
      currency: 'INR',
      key_id: RAZORPAY_KEY_ID,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'internal_error' }, 500)
  }
})
