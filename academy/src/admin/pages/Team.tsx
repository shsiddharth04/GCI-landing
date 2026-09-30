import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { UserPlus, Trash2, ShieldCheck, UserX } from 'lucide-react'

interface AdminUser {
  email: string
  is_superadmin: boolean
}

export default function Team() {
  const [admins, setAdmins]         = useState<AdminUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting]       = useState(false)
  const [inviteMsg, setInviteMsg]     = useState<{ ok: boolean; text: string } | null>(null)

  const [removing, setRemoving]         = useState<string | null>(null)
  const [deleting, setDeleting]         = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    setCurrentEmail(session?.user?.email?.toLowerCase() ?? null)
    const { data } = await supabase
      .from('admin_users')
      .select('email, is_superadmin')
      .order('email')
    setAdmins(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const email = inviteEmail.trim().toLowerCase()
    if (!email) return
    setInviting(true)
    setInviteMsg(null)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setInviteMsg({ ok: false, text: 'Not authenticated.' }); setInviting(false); return }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-invite-admin`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'invite', email }),
      }
    )
    const body = await res.json()

    if (res.ok) {
      setInviteMsg({ ok: true, text: `Invite sent to ${email}. They'll receive a setup link.` })
      setInviteEmail('')
      await load()
    } else {
      const msg: Record<string, string> = {
        already_admin:  `${email} is already an admin.`,
        invalid_email:  'Enter a valid email address.',
        invite_failed:  `Invite failed: ${body.detail ?? 'unknown error'}`,
        forbidden:      'Only superadmins can invite admins.',
      }
      setInviteMsg({ ok: false, text: msg[body.error] ?? `Error: ${body.error}` })
    }
    setInviting(false)
  }

  async function callFn(action: string, email: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return null
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-invite-admin`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, email }),
      }
    )
    return res.ok ? await res.json() : null
  }

  async function handleRemove(email: string) {
    setRemoving(email)
    await callFn('remove', email)
    await load()
    setRemoving(null)
  }

  async function handleDeleteUser(email: string) {
    setDeleting(email)
    setConfirmDelete(null)
    const result = await callFn('delete_user', email)
    if (result?.reason === 'is_student') {
      setInviteMsg({
        ok: false,
        text: `${email} is also an enrolled student — admin access removed, but their login account was kept so they can still access the student portal.`,
      })
    } else if (result?.auth_deleted) {
      setInviteMsg({ ok: true, text: `${email} has been fully deleted.` })
    }
    await load()
    setDeleting(null)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-[#0E0918] mb-1">Team</h1>
      <p className="text-sm text-[#0E0918]/50 mb-8">Admins with access to this console.</p>

      {/* Current admins */}
      <div className="bg-white rounded-xl border border-[#E8DEFA]/60 overflow-hidden mb-8">
        {loading ? (
          <div className="px-5 py-6 text-sm text-[#0E0918]/40">Loading…</div>
        ) : admins.length === 0 ? (
          <div className="px-5 py-6 text-sm text-[#0E0918]/40">No admins found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8DEFA]/40">
                <th className="px-5 py-3 text-left font-medium text-[#0E0918]/40 text-xs uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 text-left font-medium text-[#0E0918]/40 text-xs uppercase tracking-wide">Role</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isSelf     = a.email === currentEmail
                const canRemove  = !a.is_superadmin && !isSelf
                return (
                  <tr key={a.email} className="border-b border-[#E8DEFA]/30 last:border-0">
                    <td className="px-5 py-3.5 font-mono text-xs text-[#0E0918]">
                      {a.email}
                      {isSelf && <span className="ml-2 text-[#b6a9d6] text-[10px] font-sans">(you)</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {a.is_superadmin ? (
                        <span className="inline-flex items-center gap-1 bg-[#E8DEFA] text-[#0E0918] text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          <ShieldCheck size={10} />
                          SUPER
                        </span>
                      ) : (
                        <span className="text-[#0E0918]/40 text-xs">Admin</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {canRemove && (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleRemove(a.email)}
                            disabled={removing === a.email || deleting === a.email}
                            className="text-[#0E0918]/30 hover:text-orange-500 disabled:opacity-40 transition-colors"
                            title="Remove admin access (keeps login account)"
                          >
                            {removing === a.email
                              ? <span className="text-xs text-[#0E0918]/30">Removing…</span>
                              : <Trash2 size={14} />
                            }
                          </button>
                          <button
                            onClick={() => setConfirmDelete(a.email)}
                            disabled={removing === a.email || deleting === a.email}
                            className="text-[#0E0918]/30 hover:text-red-600 disabled:opacity-40 transition-colors"
                            title="Delete user account entirely"
                          >
                            {deleting === a.email
                              ? <span className="text-xs text-[#0E0918]/30">Deleting…</span>
                              : <UserX size={14} />
                            }
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-[#E8DEFA]/60 p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-sm font-semibold text-[#0E0918] mb-2">Delete user account?</h3>
            <p className="text-xs text-[#0E0918]/50 mb-1">
              This removes <span className="font-mono text-[#0E0918]">{confirmDelete}</span> from admin_users and deletes their Supabase login account.
            </p>
            <p className="text-xs text-[#0E0918]/40 mb-5">
              If they're also an enrolled student, only admin access is removed — their login account is kept for the student portal.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 text-sm text-[#0E0918]/60 border border-[#E8DEFA] rounded-lg px-3 py-2 hover:bg-[#F9F6FF] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDelete)}
                className="flex-1 text-sm bg-red-600 text-white rounded-lg px-3 py-2 hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite form */}
      <div className="bg-white rounded-xl border border-[#E8DEFA]/60 p-5">
        <h2 className="text-sm font-semibold text-[#0E0918] mb-1">Invite an admin</h2>
        <p className="text-xs text-[#0E0918]/45 mb-4">
          They'll receive a setup email. Once they accept, they get full admin access.
        </p>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="flex-1 border border-[#E8DEFA] rounded-lg px-3 py-2 text-sm text-[#0E0918] placeholder:text-[#0E0918]/30 focus:outline-none focus:ring-2 focus:ring-[#E8DEFA]"
            required
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="flex items-center gap-2 bg-[#0E0918] text-[#E8DEFA] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1a1030] disabled:opacity-40 transition-colors"
          >
            <UserPlus size={14} />
            {inviting ? 'Sending…' : 'Invite'}
          </button>
        </form>
        {inviteMsg && (
          <p className={`mt-3 text-xs ${inviteMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
            {inviteMsg.text}
          </p>
        )}
      </div>
    </div>
  )
}
