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
  // dateStr is YYYY-MM-DD; append T00:00:00 to parse as local midnight
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function confirmedHtml(name: string, date: string, start: string, end: string): string {
  const dayLabel = fmtDate(date)
  const timeLabel = `${fmt24to12(start)} to ${fmt24to12(end)}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're in — GCI Masterclass</title></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <!-- Header rule -->
        <tr><td style="height:2px;background:linear-gradient(90deg,transparent,#d4bfff,transparent);"></td></tr>

        <!-- Logo row -->
        <tr><td style="padding:32px 0 0;">
          <p style="margin:0 0 4px;font-family:monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.45);">Gig Culture India</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Music <span style="color:#d4bfff;">Academy</span></p>
        </td></tr>

        <!-- Headline -->
        <tr><td style="padding:40px 0 8px;">
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#d4bfff;">Confirmed</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">You're in.</h1>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Hi ${name}, your masterclass slot is confirmed. See the details below.</p>
        </td></tr>

        <!-- Details card -->
        <tr><td style="background:#0f0d18;border:1px solid rgba(212,191,255,0.14);padding:28px;position:relative;">
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
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Cost</p>
              <p style="margin:0;font-size:14px;color:#d4bfff;font-weight:600;">Free</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- What to bring -->
        <tr><td style="padding:32px 0 0;">
          <p style="margin:0 0 12px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">What to bring</p>
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7;">Nothing. Just show up. We have the gear, the space, and the plan. Wear something you can move in.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:40px 0 0;border-top:1px solid rgba(212,191,255,0.08);margin-top:40px;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">GCI Music Academy · Gurugram</p>
        </td></tr>

        <!-- Bottom rule -->
        <tr><td style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,191,255,0.2),transparent);margin-top:32px;"></td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

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
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7;">In the meantime, check if another slot works for you at the link below. Slots open daily from 10 AM to 10 PM.</p>
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
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const { name, email, date, startTime, endTime, status } = await req.json()

  const isWaitlisted = status === 'waitlisted'
  const subject = isWaitlisted
    ? `You're on the waitlist — GCI Masterclass`
    : `You're in — GCI Masterclass, ${fmtDate(date)}`
  const html = isWaitlisted
    ? waitlistedHtml(name, date, startTime, endTime)
    : confirmedHtml(name, date, startTime, endTime)

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
