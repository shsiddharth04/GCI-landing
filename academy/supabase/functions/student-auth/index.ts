import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM = 'GCI Music Academy <noreply@gigcultureindia.com>'
const PORTAL_URL = Deno.env.get('PORTAL_URL') ?? 'http://localhost:5174'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function inviteEmailHtml(name: string, setupUrl: string, isReset: boolean): string {
  const headline = isReset ? 'Set a new password.' : 'Set up your password.'
  const body = isReset
    ? `Hi ${name}, click below to set a new password for your GCI Academy portal.`
    : `Hi ${name}, you've been enrolled in the GCI DJ Course. Click below to set your password and access your portal — your schedule, resources, and class announcements are waiting.`
  const cta = isReset ? 'Set new password →' : 'Set up account →'

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GCI Academy — ${headline}</title></head>
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
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#d4bfff;">Student Portal</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">${headline}</h1>
        </td></tr>

        <tr><td style="padding-bottom:36px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">${body} The link expires in 1 hour.</p>
        </td></tr>

        <tr><td style="padding-bottom:40px;">
          <a href="${setupUrl}" style="display:inline-block;background:#d4bfff;color:#050505;font-size:13px;font-weight:700;letter-spacing:0.04em;padding:14px 32px;text-decoration:none;">
            ${cta}
          </a>
        </td></tr>

        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;">If you didn't expect this email, ignore it. If the button doesn't work, paste this URL into your browser:</p>
          <p style="margin:8px 0 0;font-family:monospace;font-size:10px;color:rgba(212,191,255,0.35);word-break:break-all;">${setupUrl}</p>
        </td></tr>

        <tr><td style="padding:32px 0 0;border-top:1px solid rgba(212,191,255,0.08);">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">GCI Music Academy · Gurugram</p>
        </td></tr>

        <tr><td style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,191,255,0.2),transparent);margin-top:32px;"></td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { email } = await req.json()
  if (!email) {
    return new Response(JSON.stringify({ error: 'email_required' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify enrollment
  const { data: student, error: studentErr } = await admin
    .from('enrolled_students')
    .select('id, name, user_id, invited_at')
    .eq('email', email.toLowerCase())
    .eq('status', 'active')
    .maybeSingle()

  if (studentErr || !student) {
    return new Response(JSON.stringify({ error: 'not_enrolled' }), {
      status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const isFirstTime = !student.user_id

  // Ensure auth user exists. createUser is idempotent — ignore "already registered" errors.
  if (isFirstTime) {
    await admin.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
    })
  }

  // Magic links always work regardless of project invite settings.
  // The portal detects the token_hash and routes to SetPasswordPage on first use.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: email.toLowerCase(),
    options: { redirectTo: PORTAL_URL },
  })

  if (linkErr || !linkData?.properties?.action_link) {
    return new Response(JSON.stringify({ error: 'link_generation_failed', detail: linkErr?.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const setupUrl = linkData.properties.action_link
  const isReset = !isFirstTime

  // Send via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [email.toLowerCase()],
      subject: isReset ? 'Reset your GCI Academy password' : 'Set up your GCI Academy account',
      html: inviteEmailHtml(student.name, setupUrl, isReset),
    }),
  })

  if (!emailRes.ok) {
    const errBody = await emailRes.text()
    return new Response(JSON.stringify({ error: 'email_send_failed', detail: errBody }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // Record first invite timestamp
  if (!student.invited_at) {
    await admin.from('enrolled_students').update({ invited_at: new Date().toISOString() }).eq('id', student.id)
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
