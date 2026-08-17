import { useState } from 'react'
import { Lock } from 'lucide-react'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'gci-admin-2026'

interface Props {
  onAuth: () => void
}

export default function AdminLogin({ onAuth }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', '1')
      onAuth()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <span className="text-lg font-bold tracking-tight">
            GCI <span className="text-[#E8DEFA]">Academy</span>
          </span>
          <span className="text-xs text-white/30 font-mono ml-1">/ admin</span>
        </div>

        <div className="bg-[#141414] border border-white/8 rounded-2xl p-8">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#E8DEFA]/10 mb-6 mx-auto">
            <Lock size={20} className="text-[#E8DEFA]" />
          </div>
          <h1 className="text-lg font-semibold text-center mb-1">Admin access</h1>
          <p className="text-sm text-white/40 text-center mb-7">Enter your admin password to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              placeholder="Password"
              autoFocus
              className={`w-full bg-[#0a0a0a] border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors ${
                error ? 'border-red-500/60' : 'border-white/10 focus:border-[#E8DEFA]/40'
              }`}
            />
            {error && (
              <p className="text-xs text-red-400">Incorrect password. Try again.</p>
            )}
            <button
              type="submit"
              className="w-full bg-[#E8DEFA] hover:bg-[#d4c8f0] text-[#0a0a0a] font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
