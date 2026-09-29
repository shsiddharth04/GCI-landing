import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminSetPassword() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    const { error: updateErr } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateErr) { setError(updateErr.message); return }
    setDone(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F3EEFF' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <span className="text-lg font-bold tracking-tight text-[#190F30]">
            GCI <span className="text-[#6B40A8]">Academy</span>
          </span>
          <span className="text-xs text-[#B5A3D4] font-mono ml-1">/ admin</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #E3D9F7' }}>
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#EDE6FF] mb-6 mx-auto">
            <KeyRound size={20} className="text-[#6B40A8]" />
          </div>
          <h1 className="text-lg font-semibold text-center text-[#190F30] mb-1">Set new password</h1>
          <p className="text-sm text-[#8B73B3] text-center mb-7">Choose a strong password for your admin account.</p>

          {done ? (
            <div className="text-center">
              <p className="text-sm text-green-700 font-medium mb-1">Password updated.</p>
              <p className="text-xs text-[#8B73B3]">You're now signed in — loading the admin console…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="New password"
                autoFocus
                required
                className="w-full bg-[#F9F6FF] rounded-xl px-4 py-3 text-sm text-[#190F30] placeholder-[#C4B4E4] outline-none border border-[#D4C6EF] focus:border-[#9C7CE0] transition-colors"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError('') }}
                placeholder="Confirm new password"
                required
                className={`w-full bg-[#F9F6FF] rounded-xl px-4 py-3 text-sm text-[#190F30] placeholder-[#C4B4E4] outline-none transition-colors ${
                  error ? 'border border-red-400' : 'border border-[#D4C6EF] focus:border-[#9C7CE0]'
                }`}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6B40A8] hover:bg-[#5C358A] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {loading ? 'Updating…' : 'Set password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
