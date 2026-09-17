import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM = 'GCI Music Academy <noreply@gigcultureindia.com>'

// ── Email body ────────────────────────────────────────────────────────────────

function depositConfirmedHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Deposit confirmed — GCI DJ Course</title></head>
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
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#d4bfff;">Deposit confirmed</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">Your seat is in.</h1>
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Hi ${name}, your ₹2,000 deposit is confirmed and your seat in the DJ Course is held. Our team will reach out within 24 hours to lock in your batch start date and schedule your first session.</p>
        </td></tr>

        <tr><td style="background:#0f0d18;border:1px solid rgba(212,191,255,0.14);padding:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:20px;border-bottom:1px solid rgba(212,191,255,0.08);">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Deposit paid</p>
              <p style="margin:0;font-size:14px;color:#d4bfff;font-weight:600;">₹2,000</p>
              <p style="margin:4px 0 0;font-family:monospace;font-size:8px;color:rgba(212,191,255,0.35);letter-spacing:0.1em;">Non-refundable · Credited toward total course fee</p>
            </td></tr>
            <tr><td style="padding:20px 0 0;">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">What happens next</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.7;">We'll contact you within 24 hours with your batch start date, schedule, and balance payment details.</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:32px 0 0;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.7;">Questions? Reply to this email or reach us at <a href="mailto:enquiries@gigcultureindia.com" style="color:#d4bfff;text-decoration:none;">enquiries@gigcultureindia.com</a></p>
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

  const { name, email, pdfBase64, enrollmentId } = await req.json()

  const subject = `Deposit confirmed — GCI DJ Course`
  const html = depositConfirmedHtml(name)

  const payload: Record<string, unknown> = {
    from: FROM,
    to: [email],
    subject,
    html,
    bcc: ['finance@gigcultureindia.com'],
  }

  if (pdfBase64 && enrollmentId) {
    payload.attachments = [{
      filename: `course-deposit-${(enrollmentId as string).slice(0, 8).toUpperCase()}.pdf`,
      content: pdfBase64,
    }]
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : res.status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
