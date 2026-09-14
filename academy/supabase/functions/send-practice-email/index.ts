import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM = 'GCI Music Academy <noreply@gigcultureindia.com>'
const STUDIO_ADDRESS = '11th Floor, Capital Tower, Next To CDS Tower, Sector 20, Gurugram'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function fmt24to12(t: string): string {
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mStr} ${period}`
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function confirmedHtml(name: string, date: string, start: string, end: string): string {
  const dayLabel = fmtDate(date)
  const timeLabel = `${fmt24to12(start)} to ${fmt24to12(end)}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Practice slot confirmed — GCI Academy</title></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <tr><td style="height:2px;background:linear-gradient(90deg,transparent,#d4bfff,transparent);"></td></tr>

        <tr><td style="padding:32px 0 0;">
          <p style="margin:0 0 4px;font-family:monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.45);">Gig Culture India</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Music <span style="color:#d4bfff;">Academy</span></p>
        </td></tr>

        <tr><td style="padding:40px 0 8px;">
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#d4bfff;">Practice slot confirmed</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">Studio's yours.</h1>
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Hi ${name}, your practice slot is confirmed. Show up on time and come ready to work.</p>
        </td></tr>

        <tr><td style="background:#0f0d18;border:1px solid rgba(212,191,255,0.14);padding:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:20px;border-bottom:1px solid rgba(212,191,255,0.08);">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Date</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">${dayLabel}</p>
            </td></tr>
            <tr><td style="padding:20px 0;border-bottom:1px solid rgba(212,191,255,0.08);">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Time</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">${timeLabel}</p>
            </td></tr>
            <tr><td style="padding:20px 0 0;">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Location</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">${STUDIO_ADDRESS}</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a0a0a;border:1px solid rgba(255,100,80,0.25);padding:20px 24px;">
            <tr><td>
              <p style="margin:0 0 4px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,150,130,0.6);">No-show policy</p>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;">If you don't show up without cancelling at least 24 hours in advance, your practice booking access will be blocked for 7 days. Cancellations inside the 24-hour window are not accepted.</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:40px 0 0;border-top:1px solid rgba(212,191,255,0.08);margin-top:40px;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">GCI Music Academy · Gurugram</p>
        </td></tr>

        <tr><td style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,191,255,0.2),transparent);"></td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function cancelledHtml(name: string, date: string, start: string, end: string): string {
  const dayLabel = fmtDate(date)
  const timeLabel = `${fmt24to12(start)} to ${fmt24to12(end)}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Practice slot cancelled — GCI Academy</title></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <tr><td style="height:2px;background:linear-gradient(90deg,transparent,rgba(212,191,255,0.4),transparent);"></td></tr>

        <tr><td style="padding:32px 0 0;">
          <p style="margin:0 0 4px;font-family:monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.45);">Gig Culture India</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Music <span style="color:#d4bfff;">Academy</span></p>
        </td></tr>

        <tr><td style="padding:40px 0 8px;">
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(212,191,255,0.5);">Cancellation confirmed</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">Slot released.</h1>
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Hi ${name}, your cancellation is confirmed. The slot below is now open for others. You can book again from the student portal.</p>
        </td></tr>

        <tr><td style="background:#0f0d18;border:1px solid rgba(212,191,255,0.14);padding:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:20px;border-bottom:1px solid rgba(212,191,255,0.08);">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Cancelled slot</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">${dayLabel}</p>
            </td></tr>
            <tr><td style="padding:20px 0 0;">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Time</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">${timeLabel}</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:40px 0 0;border-top:1px solid rgba(212,191,255,0.08);margin-top:40px;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">GCI Music Academy · Gurugram</p>
        </td></tr>

        <tr><td style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,191,255,0.2),transparent);"></td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const { booking_id, type, student_name, student_email, slot_date, slot_start, slot_end } = await req.json()

  if (!booking_id || !type || !student_name || !student_email || !slot_date || !slot_start || !slot_end) {
    return new Response(JSON.stringify({ error: 'missing_fields' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Idempotency guard for confirmation emails only:
  // If email_sent is already true, skip — don't double-send.
  if (type === 'confirmed') {
    const { data: booking } = await db
      .from('practice_bookings')
      .select('email_sent')
      .eq('id', booking_id)
      .single()

    if (booking?.email_sent) {
      return new Response(JSON.stringify({ skipped: true, reason: 'already_sent' }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
  }

  const subject = type === 'confirmed'
    ? `Practice slot confirmed — ${fmtDate(slot_date)}`
    : `Practice slot cancelled — GCI Academy`

  const html = type === 'confirmed'
    ? confirmedHtml(student_name, slot_date, slot_start, slot_end)
    : cancelledHtml(student_name, slot_date, slot_start, slot_end)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [student_email], subject, html }),
  })

  const resData = await res.json()

  if (res.ok && type === 'confirmed') {
    await db
      .from('practice_bookings')
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq('id', booking_id)
  }

  return new Response(JSON.stringify(resData), {
    status: res.ok ? 200 : res.status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
