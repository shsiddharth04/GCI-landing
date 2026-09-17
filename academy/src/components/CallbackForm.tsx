import { useState } from 'react'
import { supabase } from '../lib/supabase'

type State = 'idle' | 'submitting' | 'success' | 'error'

function validate(name: string, phone: string): string | null {
  if (!name.trim()) return 'Enter your full name.'
  if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) return 'Enter a valid 10-digit phone number.'
  return null
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: focused ? 'rgba(18,12,32,0.9)' : 'rgba(5,5,5,0.65)',
        border: `1px solid ${focused ? 'rgba(212,191,255,0.55)' : 'rgba(212,191,255,0.13)'}`,
        color: 'rgba(255,255,255,0.9)',
        padding: '17px 20px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.18s, background 0.18s',
        borderRadius: '0',
        letterSpacing: '0.01em',
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

interface Props {
  onClose?: () => void
}

export default function CallbackForm({ onClose }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isMU, setIsMU] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate(name, phone)
    if (validationError) { setError(validationError); return }
    setError(null)
    setState('submitting')

    const { error: dbError } = await supabase
      .from('course_callbacks')
      .insert({ name: name.trim(), phone: phone.replace(/\s/g, ''), is_masters_union: isMU })

    if (dbError) {
      setState('error')
      setError(dbError.code === '23505'
        ? "We already have your details. We'll be in touch soon."
        : 'Something went wrong. Please try again.')
      setState('idle')
      return
    }
    setState('success')
  }

  // ── Success ───────────────────────────────────────────────────────────────

  if (state === 'success') {
    return (
      <div style={{ padding: 'clamp(40px, 7vw, 72px) 0' }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: '9px',
          color: '#d4bfff', letterSpacing: '0.28em', textTransform: 'uppercase',
          marginBottom: '20px',
        }}>
          Callback requested
        </div>
        <h2 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.2rem)', fontWeight: 800, color: 'white',
          letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif",
          lineHeight: 1.05, marginBottom: '20px',
        }}>
          We'll call you<br />
          <span style={{ color: '#d4bfff' }}>within 24 hours.</span>
        </h2>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px',
          color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: '480px',
          marginBottom: '32px',
        }}>
          Someone from the GCI team will reach out to walk you through the course, batch dates, and anything else you need before deciding.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: '8px',
              color: 'rgba(212,191,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.65)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.3)')}
          >
            ← Back to course details
          </button>
        )}
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16" style={{ alignItems: 'flex-start' }}>

        {/* ── Left column: copy + fields ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: '8px',
                color: 'rgba(212,191,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 0 28px 0', display: 'block',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.3)')}
            >
              ← Back to course details
            </button>
          )}

          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            color: 'rgba(212,191,255,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Not ready to commit?
          </div>

          <h2 style={{
            fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: 800, color: 'white',
            letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.08, marginBottom: '14px',
          }}>
            Leave your number.
          </h2>

          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px',
            color: 'rgba(255,255,255,0.36)', lineHeight: 1.68,
            marginBottom: '36px', maxWidth: '420px',
          }}>
            We'll call you back within 24 hours — walk you through the curriculum, batch availability, and answer anything before you decide.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Field
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
            <Field
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
            />

            {/* MU toggle */}
            <div style={{ display: 'flex' }}>
              {([
                { label: "Masters' Union student", value: true },
                { label: 'Not a MU student', value: false },
              ] as const).map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setIsMU(opt.value)}
                  style={{
                    flex: 1, padding: '15px 12px',
                    fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '0.06em',
                    border: '1px solid rgba(212,191,255,0.18)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: isMU === opt.value ? '#d4bfff' : 'rgba(5,5,5,0.65)',
                    color: isMU === opt.value ? '#050505' : 'rgba(255,255,255,0.32)',
                    fontWeight: isMU === opt.value ? 700 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {error && (
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: '9px',
                color: 'rgba(255,85,65,0.9)', letterSpacing: '0.06em',
                padding: '13px 16px',
                border: '1px solid rgba(255,85,65,0.18)',
                background: 'rgba(255,85,65,0.04)',
              }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: course summary + submit ── */}
        <div style={{
          width: '100%', maxWidth: '380px', flexShrink: 0,
          background: '#0f0d18',
          border: '1px solid rgba(212,191,255,0.14)',
          padding: '36px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.7), transparent)',
          }} />

          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '8px',
            color: 'rgba(212,191,255,0.38)', letterSpacing: '0.25em', textTransform: 'uppercase',
            marginBottom: '20px',
          }}>
            The DJ Course
          </div>

          {/* Course detail rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
            {[
              { label: 'Duration', value: '2 months' },
              { label: 'Format', value: 'In-studio, Gurugram' },
              { label: 'Batch size', value: '3 students (by design)' },
              { label: 'Equipment', value: 'Pioneer XDJ-RX3' },
              { label: 'After graduation', value: 'Listed on GCI marketplace' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '8px',
                  color: 'rgba(212,191,255,0.35)', letterSpacing: '0.22em', textTransform: 'uppercase',
                  marginBottom: '4px',
                }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px',
                  color: 'rgba(255,255,255,0.65)',
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: 'rgba(212,191,255,0.07)', marginBottom: '24px' }} />

          {/* Submit */}
          <button
            type="submit"
            disabled={state === 'submitting'}
            style={{
              width: '100%',
              background: '#d4bfff', color: '#050505',
              border: 'none',
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
              padding: '19px 20px',
              cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
              opacity: state === 'submitting' ? 0.6 : 1,
              transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: state === 'submitting' ? 'none' : '0 0 52px rgba(212,191,255,0.38)',
            }}
            onMouseEnter={e => {
              if (state !== 'submitting') {
                (e.currentTarget as HTMLElement).style.background = '#e0d4ff'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 70px rgba(212,191,255,0.6)'
              }
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.background = '#d4bfff'
              ;(e.currentTarget as HTMLElement).style.boxShadow = state === 'submitting' ? 'none' : '0 0 52px rgba(212,191,255,0.38)'
            }}
          >
            {state === 'submitting' ? 'Sending...' : 'Request a callback →'}
          </button>

          <p style={{
            marginTop: '14px', textAlign: 'center',
            fontFamily: "'Space Mono', monospace", fontSize: '7px',
            color: 'rgba(212,191,255,0.18)', letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            No commitment · Just a conversation
          </p>
        </div>
      </div>
    </form>
  )
}
