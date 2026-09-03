import { useState, useEffect } from 'react'
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

export default function SetPasswordPage({
  tokenHash,
  tokenType,
  onComplete,
}: {
  tokenHash: string
  tokenType: 'invite' | 'recovery'
  onComplete: () => void
}) {
  const [verifying, setVerifying] = useState(true)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    async function verify() {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: tokenType === 'invite' ? 'invite' : 'recovery',
      })
      if (error) {
        setVerifyError('This link has expired or already been used. Request a new one from the login page.')
      } else {
        // Link the user_id to enrolled_students now that auth session exists
        await supabase.rpc('link_my_enrollment')
      }
      setVerifying(false)
    }
    verify()
  }, [tokenHash, tokenType])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setSaveError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setSaveError('Passwords don\'t match.'); return }
    setSaving(true); setSaveError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setSaveError(error.message ?? 'Failed to set password. Try again.')
      setSaving(false)
    } else {
      onComplete()
    }
  }

  const isNewAccount = tokenType === 'invite'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', fontFamily: SANS }}>
      {/* Left */}
      <div style={{
        flex: '0 0 55%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '56px 64px',
        borderRight: '1px solid rgba(232,222,250,0.06)', position: 'relative', overflow: 'hidden',
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
              {isNewAccount ? 'One step to get in.' : 'Set a new password.'}
            </h1>
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)' }}>
          Gurugram · In-studio
        </div>
      </div>

      {/* Right */}
      <div style={{
        flex: '0 0 45%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '56px 64px',
      }}>
        <div style={{ maxWidth: 340 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)', marginBottom: 32 }}>
            {isNewAccount ? '[ Create account ]' : '[ Reset password ]'}
          </div>

          {verifying ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 28 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="eq-bar" style={{
                  width: 3, height: '100%', background: '#E8DEFA', borderRadius: 1,
                  animationDelay: `${i * 0.12}s`,
                }} />
              ))}
            </div>
          ) : verifyError ? (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(244,114,182,0.85)', lineHeight: 1.7, marginBottom: 24 }}>
                {verifyError}
              </div>
              <a
                href="/"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)', textDecoration: 'none' }}
              >
                ← Back to login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)', display: 'block', marginBottom: 10 }}>
                  {isNewAccount ? 'Choose a password' : 'New password'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setSaveError(null) }}
                    placeholder="At least 8 characters"
                    required
                    style={{
                      width: '100%', background: 'transparent', border: 'none',
                      borderBottom: '1px solid rgba(232,222,250,0.2)',
                      padding: '10px 32px 10px 0', fontSize: 16,
                      color: '#E8DEFA', fontFamily: SANS, outline: 'none',
                    }}
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

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)', display: 'block', marginBottom: 10 }}>
                  Confirm password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setSaveError(null) }}
                  placeholder="Same password again"
                  required
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    borderBottom: `1px solid ${saveError ? 'rgba(244,114,182,0.6)' : 'rgba(232,222,250,0.2)'}`,
                    padding: '10px 0', fontSize: 16,
                    color: '#E8DEFA', fontFamily: SANS, outline: 'none',
                  }}
                />
              </div>

              {saveError && (
                <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(244,114,182,0.85)', marginTop: 8, lineHeight: 1.5 }}>
                  {saveError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !password || !confirm}
                style={{
                  marginTop: 32, width: '100%',
                  background: saving ? 'rgba(232,222,250,0.7)' : '#E8DEFA',
                  color: '#0a0a0a', border: 'none', padding: '14px 24px',
                  fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', cursor: saving ? 'default' : 'pointer',
                  opacity: (saving || !password || !confirm) ? 0.6 : 1,
                  transition: 'opacity 100ms',
                }}
              >
                {saving ? 'Setting up…' : isNewAccount ? 'Create account →' : 'Set password →'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        input::placeholder { color: rgba(232,222,250,0.2); }
      `}</style>
    </div>
  )
}
