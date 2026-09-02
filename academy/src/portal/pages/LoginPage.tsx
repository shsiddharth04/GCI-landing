import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

function WaveformBars() {
  const heights = [0.3, 0.7, 1.0, 0.55, 0.85, 0.4, 0.9, 0.6, 0.75, 0.35, 0.95, 0.5, 0.8, 0.45, 0.65]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="eq-bar"
          style={{
            width: 4, background: 'rgba(232,222,250,0.5)', borderRadius: 2,
            height: `${h * 100}%`,
            animationDelay: `${i * 0.08}s`,
            animationDuration: `${0.8 + (i % 3) * 0.25}s`,
          }}
        />
      ))}
    </div>
  )
}

type State = 'idle' | 'loading' | 'success' | 'error'

export default function LoginPage({ accessError }: { accessError?: boolean }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>(accessError ? 'error' : 'idle')
  const [errorMsg, setErrorMsg] = useState(
    accessError ? 'That account doesn\'t have portal access.' : ''
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')

    try {
      const { error } = await supabase.functions.invoke('student-auth', {
        body: { email: email.trim().toLowerCase() },
      })

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (msg.includes('not_enrolled') || msg.includes('403')) {
          setErrorMsg('That email isn\'t on the enrollment list. Contact your instructor.')
        } else {
          setErrorMsg('Something went wrong. Try again in a moment.')
        }
        setState('error')
      } else {
        setState('success')
      }
    } catch {
      setErrorMsg('Something went wrong. Try again in a moment.')
      setState('error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      fontFamily: SANS,
    }}>
      {/* Left — brand */}
      <div style={{
        flex: '0 0 55%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
        background: '#0a0a0a',
        borderRight: '1px solid rgba(232,222,250,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '-10%',
          width: 600, height: 600,
          background: 'radial-gradient(ellipse, rgba(232,222,250,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Wordmark */}
        <div>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)', marginBottom: 8 }}>
            Gig Culture India
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Music <span style={{ color: '#E8DEFA' }}>Academy</span>
          </div>
        </div>

        {/* Main content */}
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

        {/* Bottom label */}
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)' }}>
          Gurugram · In-studio
        </div>
      </div>

      {/* Right — form */}
      <div style={{
        flex: '0 0 45%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '56px 64px',
        background: '#0a0a0a',
      }}>
        <div style={{ maxWidth: 340 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)', marginBottom: 32 }}>
            [ Student Portal ]
          </div>

          {state === 'success' ? (
            <div style={{ animation: 'fadeSlideIn 200ms ease both' }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E8DEFA', marginBottom: 16 }}>
                ✓ Link sent
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#E8DEFA', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em' }}>
                Check your inbox.
              </div>
              <div style={{ fontSize: 14, color: 'rgba(232,222,250,0.5)', lineHeight: 1.7 }}>
                We've sent a login link to <span style={{ color: 'rgba(232,222,250,0.8)' }}>{email}</span>. It expires in 1 hour.
              </div>
              <button
                onClick={() => { setState('idle'); setEmail('') }}
                style={{
                  marginTop: 32, background: 'none', border: 'none', padding: 0,
                  fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)',
                  cursor: 'pointer', transition: 'color 100ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#E8DEFA' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,222,250,0.35)' }}
              >
                Use a different email →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)', display: 'block', marginBottom: 10 }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    borderBottom: `1px solid ${state === 'error' ? 'rgba(244,114,182,0.6)' : 'rgba(232,222,250,0.2)'}`,
                    padding: '10px 0', fontSize: 16,
                    color: '#E8DEFA', fontFamily: SANS, outline: 'none',
                    transition: 'border-color 150ms',
                  }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = 'rgba(232,222,250,0.6)' }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = state === 'error' ? 'rgba(244,114,182,0.6)' : 'rgba(232,222,250,0.2)' }}
                />
              </div>

              {state === 'error' && (
                <div style={{
                  fontFamily: MONO, fontSize: 11, color: 'rgba(244,114,182,0.85)',
                  marginTop: 8, lineHeight: 1.5,
                }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={state === 'loading' || !email.trim()}
                style={{
                  marginTop: 32, width: '100%',
                  background: state === 'loading' ? 'rgba(232,222,250,0.7)' : '#E8DEFA',
                  color: '#0a0a0a', border: 'none',
                  padding: '14px 24px',
                  fontFamily: MONO, fontSize: 11,
                  fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: state === 'loading' ? 'default' : 'pointer',
                  transition: 'opacity 100ms',
                  opacity: state === 'loading' ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {state === 'loading' ? (
                  <span style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 14 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} className="eq-bar" style={{
                        display: 'inline-block', width: 2, height: '100%',
                        background: '#0a0a0a', borderRadius: 1,
                        animationDelay: `${i * 0.15}s`,
                      }} />
                    ))}
                  </span>
                ) : 'Get access →'}
              </button>
            </form>
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
