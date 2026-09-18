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

function scheduledHtml(name: string, date: string, start: string, end: string): string {
  const dayLabel = fmtDate(date)
  const timeLabel = `${fmt24to12(start)} to ${fmt24to12(end)}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Class scheduled — GCI Academy</title></head>
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
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#d4bfff;">Class scheduled</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">Your next class is locked in.</h1>
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Hi ${name}, a class has been scheduled for your cohort. See the details below and mark your calendar.</p>
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
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Class cancelled — GCI Academy</title></head>
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
          <p style="margin:0 0 6px;font-family:monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,180,100,0.8);">Class cancelled</p>
          <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.025em;line-height:1.1;">Class removed.</h1>
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">Hi ${name}, the class scheduled for your cohort on the date below has been removed. We'll let you know when a new date is confirmed.</p>
        </td></tr>

        <tr><td style="background:#0f0d18;border:1px solid rgba(212,191,255,0.14);padding:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:20px;border-bottom:1px solid rgba(212,191,255,0.08);">
              <p style="margin:0 0 3px;font-family:monospace;font-size:8px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(212,191,255,0.4);">Cancelled class</p>
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

  let body: {
    block_id?: string
    cohort: string
    block_date: string
    start_time: string
    end_time: string
    action: 'created' | 'deleted'
  }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const { block_id, cohort, block_date, start_time, end_time, action } = body

  if (!cohort || !block_date || !start_time || !end_time || !action) {
    return new Response(JSON.stringify({ error: 'missing_fields' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Idempotency: if this block has already had a 'created' email sent, skip
  if (action === 'created' && block_id) {
    const { data: block } = await db
      .from('course_class_blocks')
      .select('email_sent')
      .eq('id', block_id)
      .single()

    if (block?.email_sent) {
      return new Response(JSON.stringify({ skipped: true, reason: 'already_sent' }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
  }

  // Fetch active students in this cohort
  const { data: students, error: studentsErr } = await db
    .from('enrolled_students')
    .select('name, email')
    .eq('cohort', cohort)
    .eq('status', 'active')

  if (studentsErr) {
    return new Response(JSON.stringify({ error: studentsErr.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  if (!students || students.length === 0) {
    return new Response(JSON.stringify({ sent: 0, skipped: true, reason: 'no_active_students' }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const isTest = cohort === 'C0'
  const subjectCreated = isTest
    ? `[TEST] Class scheduled — ${fmtDate(block_date)}`
    : `Class scheduled — ${fmtDate(block_date)}`
  const subjectCancelled = isTest
    ? `[TEST] Class cancelled — ${fmtDate(block_date)}`
    : `Class cancelled — ${fmtDate(block_date)}`

  const subject = action === 'created' ? subjectCreated : subjectCancelled

  let sent = 0
  const failedEmails: string[] = []

  for (const student of students) {
    const html = action === 'created'
      ? scheduledHtml(student.name, block_date, start_time, end_time)
      : cancelledHtml(student.name, block_date, start_time, end_time)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [student.email], subject, html }),
    })

    if (res.ok) {
      sent++
    } else {
      failedEmails.push(student.email)
    }
  }

  // Mark block as notified
  if (action === 'created' && block_id && sent > 0) {
    await db
      .from('course_class_blocks')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        email_sent_count: sent,
      })
      .eq('id', block_id)
  }

  return new Response(
    JSON.stringify({ sent, failed: failedEmails.length, failedEmails }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    },
  )
})
