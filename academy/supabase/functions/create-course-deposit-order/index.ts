import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Intentionally separate secrets from the masterclass flow — these are
// Razorpay test-mode keys and must never fall back to the live masterclass keys.
const RAZORPAY_COURSE_KEY_ID     = Deno.env.get('RAZORPAY_COURSE_KEY_ID')!
const RAZORPAY_COURSE_KEY_SECRET = Deno.env.get('RAZORPAY_COURSE_KEY_SECRET')!
const SUPABASE_URL               = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const COURSE_DEPOSIT_AMOUNT_PAISE = 200000 // ₹2,000

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
    const { name, email, phone, is_masters_union } = await req.json()
    if (!name || !email || !phone) return json({ error: 'name, email, phone required' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Idempotency — check if this email already has a paid enrollment
    const { data: existingPaid } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('email', email.trim())
      .eq('deposit_status', 'paid')
      .maybeSingle()

    if (existingPaid) return json({ error: 'already_paid' }, 400)

    // Idempotency — return existing pending order rather than creating a duplicate
    const { data: existingPending } = await supabase
      .from('course_enrollments')
      .select('id, course_payments!enrollment_id(id, razorpay_order_id, status)')
      .eq('email', email.trim())
      .eq('deposit_status', 'pending')
      .maybeSingle()

    if (existingPending) {
      const pendingPayment = (existingPending.course_payments as { id: string; razorpay_order_id: string; status: string }[])
        ?.find(p => p.status === 'pending')
      if (pendingPayment) {
        return json({
          order_id: pendingPayment.razorpay_order_id,
          enrollment_id: existingPending.id,
          amount: COURSE_DEPOSIT_AMOUNT_PAISE,
          currency: 'INR',
          key_id: RAZORPAY_COURSE_KEY_ID,
          name, email, phone,
        })
      }
    }

    // Insert enrollment row
    const { data: enrollment, error: enrollErr } = await supabase
      .from('course_enrollments')
      .insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        is_masters_union: !!is_masters_union,
        deposit_amount: COURSE_DEPOSIT_AMOUNT_PAISE,
      })
      .select('id')
      .single()

    if (enrollErr || !enrollment) {
      console.error('Failed to insert enrollment:', enrollErr)
      return json({ error: 'db_error' }, 500)
    }

    const enrollmentId: string = enrollment.id

    // Stamp payment_attempted_at BEFORE creating the Razorpay order.
    // This is the authoritative signal for the backstop cron (migration 021 Cron 2)
    // — if the payment INSERT below fails, the cron can still clean up the enrollment.
    await supabase
      .from('course_enrollments')
      .update({ payment_attempted_at: new Date().toISOString() })
      .eq('id', enrollmentId)

    // Create Razorpay order
    const credentials = btoa(`${RAZORPAY_COURSE_KEY_ID}:${RAZORPAY_COURSE_KEY_SECRET}`)
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: COURSE_DEPOSIT_AMOUNT_PAISE,
        currency: 'INR',
        receipt: `cd_${enrollmentId.slice(0, 8)}`,
        notes: { enrollment_id: enrollmentId, name: name.trim(), email: email.trim() },
      }),
    })

    if (!rzpRes.ok) {
      const errBody = await rzpRes.json()
      console.error('Razorpay order creation failed:', errBody)
      return json({ error: 'razorpay_error', detail: errBody }, 502)
    }

    const order = await rzpRes.json()

    const { error: insertErr } = await supabase
      .from('course_payments')
      .insert({
        enrollment_id: enrollmentId,
        razorpay_order_id: order.id,
        status: 'pending',
        amount: COURSE_DEPOSIT_AMOUNT_PAISE,
      })

    if (insertErr) {
      console.error('Failed to insert payment record:', insertErr)
      return json({ error: 'db_error' }, 500)
    }

    // Phantom-write guard: read back the inserted row before returning to the client.
    // The checkout modal must not open unless the payment record is confirmed visible in DB.
    const { data: verified } = await supabase
      .from('course_payments')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .eq('razorpay_order_id', order.id)
      .maybeSingle()

    if (!verified) {
      console.error('Payment record not visible after insert — aborting checkout')
      return json({ error: 'db_error' }, 500)
    }

    return json({
      order_id: order.id,
      enrollment_id: enrollmentId,
      amount: COURSE_DEPOSIT_AMOUNT_PAISE,
      currency: 'INR',
      key_id: RAZORPAY_COURSE_KEY_ID,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'internal_error' }, 500)
  }
})
