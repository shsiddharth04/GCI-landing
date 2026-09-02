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
            <Lock size={20} className="text-[#6B40A8]" />
          </div>
          <h1 className="text-lg font-semibold text-center text-[#190F30] mb-1">Admin access</h1>
          <p className="text-sm text-[#8B73B3] text-center mb-7">Enter your admin password to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              placeholder="Password"
              autoFocus
              className={`w-full bg-[#F9F6FF] rounded-xl px-4 py-3 text-sm text-[#190F30] placeholder-[#C4B4E4] outline-none transition-colors ${
                error
                  ? 'border border-red-400'
                  : 'border border-[#D4C6EF] focus:border-[#9C7CE0]'
              }`}
            />
            {error && (
              <p className="text-xs text-red-500">Incorrect password. Try again.</p>
            )}
            <button
              type="submit"
              className="w-full bg-[#6B40A8] hover:bg-[#5C358A] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
