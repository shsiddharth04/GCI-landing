import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const INVITE_REDIRECT = 'https://academy.gigcultureindia.com'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // ── Auth: must be a superadmin ────────────────────────────────────────────
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'unauthorized' }, 401)

  const { data: { user }, error: userErr } = await createClient(SUPABASE_URL, token).auth.getUser()
  if (userErr || !user?.email) return json({ error: 'forbidden' }, 403)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email, is_superadmin')
    .eq('email', user.email.toLowerCase())
    .maybeSingle()

  if (!adminRow?.is_superadmin) return json({ error: 'forbidden' }, 403)

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { email?: string; action?: string }
  try { body = await req.json() } catch { return json({ error: 'invalid_json' }, 400) }

  const action = body.action ?? 'invite'

  if (action === 'remove') {
    const target = body.email?.trim().toLowerCase()
    if (!target || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) {
      return json({ error: 'invalid_email' }, 400)
    }
    // Prevent superadmin from removing themselves
    if (target === user.email.toLowerCase()) {
      return json({ error: 'cannot_remove_self' }, 400)
    }
    // Cannot remove another superadmin
    const { data: targetRow } = await supabase
      .from('admin_users')
      .select('is_superadmin')
      .eq('email', target)
      .maybeSingle()
    if (targetRow?.is_superadmin) {
      return json({ error: 'cannot_remove_superadmin' }, 400)
    }
    const { error: delErr } = await supabase
      .from('admin_users')
      .delete()
      .eq('email', target)
    if (delErr) return json({ error: 'remove_failed', detail: delErr.message }, 500)
    return json({ ok: true, removed: target })
  }

  // ── Invite ────────────────────────────────────────────────────────────────
  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400)
  }

  // Check if already an admin
  const { data: existing } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (existing) return json({ error: 'already_admin' }, 409)

  // Pre-register in admin_users so the row exists before the invited user logs in
  const { error: upsertErr } = await supabase
    .from('admin_users')
    .insert({ email, is_superadmin: false })

  if (upsertErr) return json({ error: 'db_error', detail: upsertErr.message }, 500)

  // Send Supabase Auth invite (magic-link style; user sets password on first login)
  const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_REDIRECT,
  })

  if (inviteErr) {
    // Roll back the admin_users insert if the invite failed
    await supabase.from('admin_users').delete().eq('email', email)
    return json({ error: 'invite_failed', detail: inviteErr.message }, 500)
  }

  return json({ ok: true, invited: email })
})
