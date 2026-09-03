import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

function WaveformBars() {
  const heights = [0.3, 0.7, 1.0, 0.55, 0.85, 0.4, 0.9, 0.6, 0.75, 0.35, 0.95, 0.5, 0.8, 0.45, 0.65]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
      {heights.map((h, i) => (
        <div key={i} className="eq-bar" style={{
          width: 4, background: 'rgba(232,222,250,0.5)', borderRadius: 2,
          height: `${h * 100}%`,
          animationDelay: `${i * 0.08}s`,
          animationDuration: `${0.8 + (i % 3) * 0.25}s`,
        }} />
      ))}
    </div>
  )
}

type Mode = 'login' | 'forgot'
type LoginState = 'idle' | 'loading' | 'error'
type ForgotState = 'idle' | 'loading' | 'sent' | 'error'

export default function LoginPage({ accessError }: { accessError?: boolean }) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginState, setLoginState] = useState<LoginState>(accessError ? 'error' : 'idle')
  const [forgotState, setForgotState] = useState<ForgotState>('idle')
  const [errorMsg, setErrorMsg] = useState(
    accessError ? 'That account doesn\'t have portal access.' : ''
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoginState('loading')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      setErrorMsg(
        error.message?.toLowerCase().includes('invalid')
          ? 'Wrong email or password.'
          : 'Something went wrong. Try again.'
      )
      setLoginState('error')
    }
    // On success, onAuthStateChange in PortalRoot handles the transition
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setForgotState('loading')

    // Use the edge function so the reset email matches our brand
    const { error } = await supabase.functions.invoke('student-auth', {
      body: { email: email.trim().toLowerCase() },
    })

    if (error) {
      setForgotState('error')
    } else {
      setForgotState('sent')
    }
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', background: 'transparent', border: 'none',
    borderBottom: `1px solid ${hasError ? 'rgba(244,114,182,0.6)' : 'rgba(232,222,250,0.2)'}`,
    padding: '10px 0', fontSize: 16,
    color: '#E8DEFA', fontFamily: SANS, outline: 'none',
    transition: 'border-color 150ms',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', fontFamily: SANS }}>
      {/* Left — brand */}
      <div style={{
        flex: '0 0 55%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '56px 64px',
        borderRight: '1px solid rgba(232,222,250,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '-10%',
          width: 600, height: 600,
          background: 'radial-gradient(ellipse, rgba(232,222,250,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)', marginBottom: 8 }}>
            Gig Culture India
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Music <span style={{ color: '#E8DEFA' }}>Academy</span>
          </div>
        </div>
        <div>
          <WaveformBars />
          <div style={{ marginTop: 48 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)', marginBottom: 20 }}>
              Student Portal
            </div>
            <h1 style={{
              fontFamily: SANS, fontSize: 'clamp(36px, 4vw, 56px)',
              fontWeight: 700, color: '#E8DEFA',
              lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0,
            }}>
              Your DJ course.<br />Your schedule.<br />Your toolkit.
            </h1>
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)' }}>
          Gurugram · In-studio
        </div>
      </div>

      {/* Right — form */}
      <div style={{
        flex: '0 0 45%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '56px 64px',
      }}>
        <div style={{ maxWidth: 340 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)', marginBottom: 32 }}>
            [ Student Portal ]
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)', display: 'block', marginBottom: 10 }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setLoginState('idle') }}
                  placeholder="your@email.com"
                  required
                  style={inputStyle(loginState === 'error')}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = 'rgba(232,222,250,0.6)' }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = loginState === 'error' ? 'rgba(244,114,182,0.6)' : 'rgba(232,222,250,0.2)' }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)', display: 'block', marginBottom: 10 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginState('idle') }}
                    placeholder="Your password"
                    required
                    style={{ ...inputStyle(loginState === 'error'), paddingRight: 48 }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = 'rgba(232,222,250,0.6)' }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = loginState === 'error' ? 'rgba(244,114,182,0.6)' : 'rgba(232,222,250,0.2)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em',
                      color: 'rgba(232,222,250,0.3)', padding: 0,
                    }}
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {loginState === 'error' && (
                <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(244,114,182,0.85)', marginTop: 8, lineHeight: 1.5 }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loginState === 'loading' || !email.trim() || !password}
                style={{
                  marginTop: 32, width: '100%',
                  background: loginState === 'loading' ? 'rgba(232,222,250,0.7)' : '#E8DEFA',
                  color: '#0a0a0a', border: 'none', padding: '14px 24px',
                  fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: loginState === 'loading' ? 'default' : 'pointer',
                  opacity: (loginState === 'loading' || !email.trim() || !password) ? 0.7 : 1,
                  transition: 'opacity 100ms',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loginState === 'loading' ? (
                  <span style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 14 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} className="eq-bar" style={{
                        display: 'inline-block', width: 2, height: '100%',
                        background: '#0a0a0a', borderRadius: 1, animationDelay: `${i * 0.15}s`,
                      }} />
                    ))}
                  </span>
                ) : 'Log in →'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('forgot'); setForgotState('idle') }}
                style={{
                  marginTop: 20, background: 'none', border: 'none', padding: 0,
                  fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)',
                  cursor: 'pointer', transition: 'color 100ms', display: 'block',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,222,250,0.65)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,222,250,0.3)' }}
              >
                Forgot password?
              </button>
            </form>
          ) : (
            // Forgot password view
            forgotState === 'sent' ? (
              <div style={{ animation: 'fadeSlideIn 200ms ease both' }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E8DEFA', marginBottom: 16 }}>
                  ✓ Email sent
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#E8DEFA', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em' }}>
                  Check your inbox.
                </div>
                <div style={{ fontSize: 14, color: 'rgba(232,222,250,0.5)', lineHeight: 1.7 }}>
                  We've sent a password reset link to <span style={{ color: 'rgba(232,222,250,0.8)' }}>{email}</span>. It expires in 1 hour.
                </div>
                <button
                  onClick={() => { setMode('login'); setForgotState('idle') }}
                  style={{
                    marginTop: 32, background: 'none', border: 'none', padding: 0,
                    fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)',
                    cursor: 'pointer', display: 'block',
                  }}
                >
                  ← Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <div style={{ fontSize: 14, color: 'rgba(232,222,250,0.5)', lineHeight: 1.7, marginBottom: 28 }}>
                  Enter your enrolled email and we'll send a link to set a new password.
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)', display: 'block', marginBottom: 10 }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setForgotState('idle') }}
                    placeholder="your@email.com"
                    required
                    style={inputStyle(forgotState === 'error')}
                  />
                </div>

                {forgotState === 'error' && (
                  <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(244,114,182,0.85)', marginTop: 8, lineHeight: 1.5 }}>
                    That email isn't on the enrollment list.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotState === 'loading' || !email.trim()}
                  style={{
                    marginTop: 32, width: '100%',
                    background: forgotState === 'loading' ? 'rgba(232,222,250,0.7)' : '#E8DEFA',
                    color: '#0a0a0a', border: 'none', padding: '14px 24px',
                    fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', cursor: forgotState === 'loading' ? 'default' : 'pointer',
                    opacity: (forgotState === 'loading' || !email.trim()) ? 0.7 : 1,
                    transition: 'opacity 100ms',
                  }}
                >
                  {forgotState === 'loading' ? 'Sending…' : 'Send reset link →'}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    marginTop: 20, background: 'none', border: 'none', padding: 0,
                    fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)',
                    cursor: 'pointer', display: 'block',
                  }}
                >
                  ← Back to login
                </button>
              </form>
            )
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: rgba(232,222,250,0.2); }
      `}</style>
    </div>
  )
}
