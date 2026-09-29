import { useState } from 'react'
import { Lock, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Props {
  onAuth: () => void
}

export default function AdminLogin({ onAuth }: Props) {
  const [mode, setMode]           = useState<'login' | 'forgot'>('login')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authErr) {
      setError('Invalid email or password.')
      setPassword('')
    } else {
      onAuth()
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const redirectTo = `${window.location.origin}/admin`
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
    if (resetErr) { setError(resetErr.message) } else { setResetSent(true) }
  }

  function switchToForgot() { setMode('forgot'); setError(''); setPassword('') }
  function switchToLogin()  { setMode('login');  setError(''); setResetSent(false) }

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

          {mode === 'login' ? (
            <>
              <h1 className="text-lg font-semibold text-center text-[#190F30] mb-1">Admin access</h1>
              <p className="text-sm text-[#8B73B3] text-center mb-7">Sign in with your admin credentials.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="Email"
                  autoFocus
                  required
                  className="w-full bg-[#F9F6FF] rounded-xl px-4 py-3 text-sm text-[#190F30] placeholder-[#C4B4E4] outline-none border border-[#D4C6EF] focus:border-[#9C7CE0] transition-colors"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Password"
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
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button onClick={switchToForgot} className="text-xs text-[#9C7CE0] hover:text-[#6B40A8] transition-colors">
                  Forgot password?
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-center text-[#190F30] mb-1">Reset password</h1>
              <p className="text-sm text-[#8B73B3] text-center mb-7">
                We'll send a reset link that comes back to this admin panel.
              </p>

              {resetSent ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-green-700 font-medium">Reset link sent.</p>
                  <p className="text-xs text-[#8B73B3]">
                    Check your inbox — clicking the link brings you back here to set a new password.
                  </p>
                  <button onClick={switchToLogin} className="flex items-center gap-1.5 text-xs text-[#9C7CE0] hover:text-[#6B40A8] transition-colors mx-auto">
                    <ArrowLeft size={12} /> Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="Admin email"
                    autoFocus
                    required
                    className="w-full bg-[#F9F6FF] rounded-xl px-4 py-3 text-sm text-[#190F30] placeholder-[#C4B4E4] outline-none border border-[#D4C6EF] focus:border-[#9C7CE0] transition-colors"
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#6B40A8] hover:bg-[#5C358A] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                  <button type="button" onClick={switchToLogin} className="flex items-center gap-1.5 text-xs text-[#9C7CE0] hover:text-[#6B40A8] transition-colors mx-auto">
                    <ArrowLeft size={12} /> Back to sign in
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
