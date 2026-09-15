import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM = 'GCI Music Academy <noreply@gigcultureindia.com>'
const STUDIO_ADDRESS = '11th Floor, Capital Tower, Next To CDS Tower, Sector 20, Gurugram'

function fmt24to12(t: string): string {
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr)
  const m = mStr
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m} ${period}`
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── "Request received" — sent when flag is off (pre-payment manual flow) ──────

function requestReceivedHtml(name: string, date: string, start: string, end: string): string {
  const dayLabel = fmtDate(date)
  const timeLabel = `${fmt24to12(start)} to ${fmt24to12(end)}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Booking received — GCI Masterclass</title></head>
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
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#d4bfff;">Request received</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">We've got you.</h1>
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Hi ${name}, we've received your booking request for the slot below. Our team will reach out to confirm your slot and share payment details for the ₹179 session fee.</p>
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
            <tr><td style="padding:20px 0;border-bottom:1px solid rgba(212,191,255,0.08);">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Location</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">${STUDIO_ADDRESS}</p>
            </td></tr>
            <tr><td style="padding:20px 0 0;">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Session fee</p>
              <p style="margin:0;font-size:14px;color:#d4bfff;font-weight:600;">₹179</p>
              <p style="margin:4px 0 0;font-family:monospace;font-size:8px;color:rgba(212,191,255,0.35);letter-spacing:0.1em;">Credited toward course fee on enrollment</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:40px 0 0;border-top:1px solid rgba(212,191,255,0.08);margin-top:40px;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">GCI Music Academy · Gurugram</p>
        </td></tr>
        <tr><td style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,191,255,0.2),transparent);margin-top:32px;"></td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── "Payment confirmed" — sent by webhook after successful Razorpay payment ───

function paymentConfirmedHtml(name: string, date: string, start: string, end: string): string {
  const dayLabel = fmtDate(date)
  const timeLabel = `${fmt24to12(start)} to ${fmt24to12(end)}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're booked — GCI Masterclass</title></head>
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
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#d4bfff;">Payment confirmed</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">See you there.</h1>
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Hi ${name}, your ₹179 payment is confirmed and your slot is locked in. Here are your details.</p>
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
            <tr><td style="padding:20px 0;border-bottom:1px solid rgba(212,191,255,0.08);">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Location</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">${STUDIO_ADDRESS}</p>
            </td></tr>
            <tr><td style="padding:20px 0 0;">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Amount paid</p>
              <p style="margin:0;font-size:14px;color:#d4bfff;font-weight:600;">₹179</p>
              <p style="margin:4px 0 0;font-family:monospace;font-size:8px;color:rgba(212,191,255,0.35);letter-spacing:0.1em;">Credited toward course fee if you enroll</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- What to bring strip -->
        <tr><td style="padding:28px 0 0;">
          <p style="margin:0 0 12px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">What to bring</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;">Just yourself. No equipment needed — the studio is fully set up. Arrive 5 minutes early.</p>
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

// ── Waitlisted ────────────────────────────────────────────────────────────────

function waitlistedHtml(name: string, date: string, start: string, end: string): string {
  const dayLabel = fmtDate(date)
  const timeLabel = `${fmt24to12(start)} to ${fmt24to12(end)}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Waitlist — GCI Masterclass</title></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <tr><td style="height:2px;background:linear-gradient(90deg,transparent,rgba(212,191,255,0.5),transparent);"></td></tr>

        <tr><td style="padding:32px 0 0;">
          <p style="margin:0 0 4px;font-family:monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.45);">Gig Culture India</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Music <span style="color:#d4bfff;">Academy</span></p>
        </td></tr>

        <tr><td style="padding:40px 0 8px;">
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(212,191,255,0.5);">Waitlisted</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">You're on the list.</h1>
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Hi ${name}, that slot just filled up as you registered. You're on the waitlist for the time below. We'll reach out directly if a spot opens.</p>
        </td></tr>

        <tr><td style="background:#0f0d18;border:1px solid rgba(212,191,255,0.14);padding:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:20px;border-bottom:1px solid rgba(212,191,255,0.08);">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Date</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">${dayLabel}</p>
            </td></tr>
            <tr><td style="padding:20px 0 0;">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Time (waitlisted)</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">${timeLabel}</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:32px 0 0;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7;">In the meantime, check if another slot works for you. Slots open daily from 10 AM to 10 PM.</p>
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

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const { name, email, date, startTime, endTime, status } = await req.json()

  // status: 'confirmed' → request-received (flag off, pre-payment flow)
  //         'paid'      → payment-confirmed (webhook after Razorpay capture)
  //         'waitlisted'→ waitlist
  let subject: string
  let html: string

  if (status === 'waitlisted') {
    subject = `You're on the waitlist — GCI Masterclass`
    html = waitlistedHtml(name, date, startTime, endTime)
  } else if (status === 'paid') {
    subject = `You're booked — GCI Masterclass, ${fmtDate(date)}`
    html = paymentConfirmedHtml(name, date, startTime, endTime)
  } else {
    subject = `Booking received — GCI Masterclass, ${fmtDate(date)}`
    html = requestReceivedHtml(name, date, startTime, endTime)
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [email], subject, html }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : res.status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
