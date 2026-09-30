import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')!
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

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) return json({ error: 'unauthorized' }, 401)

  const { data: { user }, error: userErr } = await createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  }).auth.getUser()
  if (userErr || !user?.email) return json({ error: 'forbidden' }, 403)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email, is_superadmin')
    .eq('email', user.email.toLowerCase())
    .maybeSingle()

  if (!adminRow?.is_superadmin) return json({ error: 'forbidden' }, 403)

  let body: { email?: string; action?: string }
  try { body = await req.json() } catch { return json({ error: 'invalid_json' }, 400) }

  const action = body.action ?? 'invite'

  // ── Remove admin access (keeps auth account) ──────────────────────────────
  if (action === 'remove') {
    const target = body.email?.trim().toLowerCase()
    if (!target || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) {
      return json({ error: 'invalid_email' }, 400)
    }
    if (target === user.email.toLowerCase()) return json({ error: 'cannot_remove_self' }, 400)
    const { data: targetRow } = await supabase
      .from('admin_users').select('is_superadmin').eq('email', target).maybeSingle()
    if (targetRow?.is_superadmin) return json({ error: 'cannot_remove_superadmin' }, 400)
    const { error: delErr } = await supabase.from('admin_users').delete().eq('email', target)
    if (delErr) return json({ error: 'remove_failed', detail: delErr.message }, 500)
    return json({ ok: true, removed: target })
  }

  // ── Delete user (removes admin access + deletes auth account) ─────────────
  if (action === 'delete_user') {
    const target = body.email?.trim().toLowerCase()
    if (!target || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) {
      return json({ error: 'invalid_email' }, 400)
    }
    if (target === user.email.toLowerCase()) return json({ error: 'cannot_remove_self' }, 400)
    const { data: targetRow } = await supabase
      .from('admin_users').select('is_superadmin').eq('email', target).maybeSingle()
    if (targetRow?.is_superadmin) return json({ error: 'cannot_remove_superadmin' }, 400)

    // Check if this person is also an enrolled student — deleting their auth
    // account would break their student portal access.
    const { data: studentRow } = await supabase
      .from('enrolled_students').select('id').eq('email', target).maybeSingle()

    // Always remove admin access
    await supabase.from('admin_users').delete().eq('email', target)

    if (studentRow) {
      // Cannot delete auth account — they still need it for student portal
      return json({ ok: true, admin_removed: true, auth_deleted: false, reason: 'is_student' })
    }

    // Find and delete the Supabase auth account
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const authUser = users?.find(u => u.email?.toLowerCase() === target)
    if (authUser) {
      const { error: authDelErr } = await supabase.auth.admin.deleteUser(authUser.id)
      if (authDelErr) return json({ error: 'auth_delete_failed', detail: authDelErr.message }, 500)
    }

    return json({ ok: true, admin_removed: true, auth_deleted: !!authUser })
  }

  // ── Invite ────────────────────────────────────────────────────────────────
  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400)
  }

  const { data: existing } = await supabase
    .from('admin_users').select('email').eq('email', email).maybeSingle()
  if (existing) return json({ error: 'already_admin' }, 409)

  // Check if this email already has a Supabase auth account (e.g. a student).
  // If so, skip the invite email entirely — sending it would let them set a new
  // password which would also change their student portal password (same account).
  // Just grant admin_users access; they log in with their existing credentials.
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const hasExistingAccount = authUsers?.some(u => u.email?.toLowerCase() === email)

  const { error: upsertErr } = await supabase
    .from('admin_users').insert({ email, is_superadmin: false })
  if (upsertErr) return json({ error: 'db_error', detail: upsertErr.message }, 500)

  if (hasExistingAccount) {
    return json({ ok: true, existing_user: true, email })
  }

  const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_REDIRECT,
  })
  if (inviteErr) {
    await supabase.from('admin_users').delete().eq('email', email)
    return json({ error: 'invite_failed', detail: inviteErr.message }, 500)
  }

  return json({ ok: true, invited: email })
})
