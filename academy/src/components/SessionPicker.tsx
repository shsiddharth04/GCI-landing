import { useState, useEffect } from 'react'
import { fetchUpcomingSessions, bookSeat } from '../lib/db'
import type { Session } from '../lib/db'

type FormState = 'idle' | 'submitting' | 'confirmed' | 'waitlisted' | 'error'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtTime(t: string) {
  const [h, m] = t.split(':')
  const date = new Date()
  date.setHours(+h, +m)
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0608',
  border: '1px solid rgba(212,191,255,0.2)',
  color: 'white',
  padding: '11px 14px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function SessionPicker() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchUpcomingSessions('masterclass')
      .then(setSessions)
      .catch(() => setLoadError('Failed to load sessions.'))
      .finally(() => setLoading(false))
  }, [])

  function validate() {
    if (!name.trim()) return 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) return 'Enter a valid 10-digit phone number.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    const err = validate()
    if (err) { setFormError(err); return }
    setFormError(null)
    setFormState('submitting')
    try {
      const result = await bookSeat(selected, name.trim(), email.trim(), phone.replace(/\s/g, ''))
      if (result.error) {
        setFormState('error')
        setFormError('Session not found or no longer available.')
        return
      }
      setFormState(result.status === 'waitlisted' ? 'waitlisted' : 'confirmed')
      // Refresh seat counts
      fetchUpcomingSessions('masterclass').then(setSessions).catch(() => null)
    } catch {
      setFormState('error')
      setFormError('Something went wrong. Please try again.')
    }
  }

  const seatsLeft = (s: Session) => Math.max(0, s.capacity - s.seats_booked)

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ marginTop: '28px', fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.35)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
        Loading sessions…
      </div>
    )
  }

  if (loadError || sessions.length === 0) {
    return (
      <div style={{ marginTop: '28px' }}>
        <div style={{
          background: '#050505',
          border: '1px solid rgba(212,191,255,0.15)',
          padding: '24px',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.4), transparent)' }} />
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Next session
          </p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            No sessions scheduled yet. Check back soon — or leave your phone number and we'll notify you when the next slot opens.
          </p>
        </div>
      </div>
    )
  }

  // ── Post-submission state ──────────────────────────────────────────────────

  if (formState === 'confirmed' || formState === 'waitlisted') {
    const isWait = formState === 'waitlisted'
    return (
      <div style={{ marginTop: '28px', background: '#050505', border: '1px solid rgba(212,191,255,0.2)', padding: '28px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.7), transparent)' }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#d4bfff', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '10px' }}>
          {isWait ? "You're on the waitlist" : "You're registered"}
        </p>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {isWait
            ? "The session is full. You're on the waitlist — we'll contact you if a seat opens up."
            : 'Check your email for confirmation details. See you in the studio.'
          }
        </p>
      </div>
    )
  }

  // ── Session list + form ────────────────────────────────────────────────────

  const selectedSession = sessions.find(s => s.id === selected)

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Value framing */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        marginBottom: '16px',
        background: '#050505', border: '1px solid rgba(212,191,255,0.18)',
        padding: '8px 14px',
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textDecoration: 'line-through' }}>₹2,500</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#d4bfff', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Free of cost</span>
      </div>

      {/* Session list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
        {sessions.map(s => {
          const left = seatsLeft(s)
          const isFull = s.status === 'full' || left === 0
          const isActive = selected === s.id
          return (
            <button
              key={s.id}
              onClick={() => { setSelected(isActive ? null : s.id); setFormState('idle'); setFormError(null) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: isActive ? 'rgba(212,191,255,0.08)' : '#050505',
                border: isActive ? '1px solid rgba(212,191,255,0.45)' : '1px solid rgba(212,191,255,0.15)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: isFull ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>
                  {fmtDate(s.session_date)}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.18em' }}>
                  {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '8px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: isFull ? 'rgba(255,100,80,0.7)' : left === 1 ? '#ffcc80' : '#d4bfff',
                }}>
                  {isFull ? 'Full' : `${left} seat${left !== 1 ? 's' : ''} left`}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Registration form — shown when a session is selected */}
      {selectedSession && (
        <form onSubmit={handleSubmit} noValidate>
          <div style={{
            background: '#050505',
            border: '1px solid rgba(212,191,255,0.2)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.5), transparent)' }} />

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="tel"
              placeholder="Phone number (10 digits)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              style={inputStyle}
            />

            {formError && (
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(255,100,80,0.8)', letterSpacing: '0.08em' }}>
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={formState === 'submitting'}
              style={{
                background: '#d4bfff',
                color: '#050505',
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '13px',
                border: 'none',
                cursor: formState === 'submitting' ? 'not-allowed' : 'pointer',
                opacity: formState === 'submitting' ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {formState === 'submitting'
                ? 'Registering…'
                : selectedSession.status === 'full'
                  ? 'Join waitlist'
                  : 'Register — free'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
