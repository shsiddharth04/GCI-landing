import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fetchUpcomingSessions, bookSeat } from '../lib/db'
import type { Session } from '../lib/db'

// ── Formatting ──────────────────────────────────────────────────────────────

function fmtTime(t: string) {
  const [h, m] = t.slice(0, 5).split(':')
  const d = new Date(); d.setHours(+h, +m)
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function monthKey(dateStr: string) { return dateStr.slice(0, 7) } // "2026-08"

function fmtMonthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function fmtDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase(),
    day: d.getDate(),
  }
}

function fmtFullDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Group sessions ──────────────────────────────────────────────────────────

function groupByMonth(sessions: Session[]): Map<string, Map<string, Session[]>> {
  const result = new Map<string, Map<string, Session[]>>()
  for (const s of sessions) {
    const mk = monthKey(s.session_date)
    if (!result.has(mk)) result.set(mk, new Map())
    const byDate = result.get(mk)!
    if (!byDate.has(s.session_date)) byDate.set(s.session_date, [])
    byDate.get(s.session_date)!.push(s)
  }
  return result
}

// ── Shared input style ──────────────────────────────────────────────────────

const field: React.CSSProperties = {
  width: '100%',
  background: 'rgba(5,5,5,0.7)',
  border: '1px solid rgba(212,191,255,0.15)',
  color: 'white',
  padding: '12px 14px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

// ── Input with focus highlight ──────────────────────────────────────────────

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{ ...field, borderColor: focused ? 'rgba(212,191,255,0.5)' : 'rgba(212,191,255,0.15)' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

// ── Seat indicator ──────────────────────────────────────────────────────────

function seatColor(left: number, full: boolean) {
  if (full) return 'rgba(255,255,255,0.2)'
  if (left <= 1) return '#ffcc80'
  return '#d4bfff'
}

function seatLabel(left: number, full: boolean) {
  if (full) return 'Full'
  if (left === 1) return '1 seat'
  return `${left} seats`
}

// ── Main component ──────────────────────────────────────────────────────────

type Stage = 'pick-date' | 'pick-time' | 'fill-form' | 'success' | 'waitlisted'

export default function SessionPicker() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Selection state
  const [activeMonth, setActiveMonth] = useState<string | null>(null)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('pick-date')

  // Form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUpcomingSessions('masterclass')
      .then(data => {
        setSessions(data)
        if (data.length > 0) {
          setActiveMonth(monthKey(data[0].session_date))
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const grouped = groupByMonth(sessions)
  const months = [...grouped.keys()]

  const datesForMonth = activeMonth ? [...(grouped.get(activeMonth)?.keys() ?? [])] : []
  const sessionsForDate = activeDate ? (grouped.get(activeMonth ?? '')?.get(activeDate) ?? []) : []

  function pickDate(date: string) {
    setActiveDate(date)
    setSelectedId(null)
    setFormError(null)
    const daySessions = grouped.get(activeMonth ?? '')?.get(date) ?? []
    if (daySessions.length === 1) {
      // Only one slot for this date — auto-select and go straight to form
      setSelectedId(daySessions[0].id)
      setStage('fill-form')
    } else {
      // Multiple times for same date — show time picker
      setStage('pick-time')
    }
    // Scroll form into view after paint
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }

  function pickTime(id: string) {
    setSelectedId(id)
    setStage('fill-form')
  }

  function reset() {
    setActiveDate(null)
    setSelectedId(null)
    setStage('pick-date')
    setFormError(null)
    setName(''); setEmail(''); setPhone('')
  }

  function validate() {
    if (!name.trim()) return 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
    const digits = phone.replace(/[\s\-+]/g, '')
    if (!/^\d{10,12}$/.test(digits)) return 'Enter a valid phone number.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    const err = validate()
    if (err) { setFormError(err); return }
    setFormError(null)
    setSubmitting(true)
    try {
      const result = await bookSeat(selectedId, name.trim(), email.trim(), phone.replace(/\s/g, ''))
      if (result.error) { setFormError('This slot is no longer available. Pick another date.'); setSubmitting(false); return }
      setStage(result.status === 'waitlisted' ? 'waitlisted' : 'success')
      fetchUpcomingSessions('masterclass').then(setSessions).catch(() => null)
    } catch {
      setFormError('Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  const selectedSession = sessions.find(s => s.id === selectedId)

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '3px', height: '12px', background: '#d4bfff', opacity: 0.4, borderRadius: '1px',
              animation: 'eqbar 0.8s ease-in-out infinite alternate',
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Loading sessions
        </span>
      </div>
    )
  }

  // ── No sessions ────────────────────────────────────────────────────────────

  if (loadError || sessions.length === 0) {
    return (
      <div style={{ marginTop: '24px', background: 'rgba(5,5,5,0.5)', border: '1px solid rgba(212,191,255,0.12)', padding: '24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.35), transparent)' }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '8px' }}>Next session</p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          No sessions scheduled yet — check back soon.
        </p>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────

  if (stage === 'success' || stage === 'waitlisted') {
    const isWait = stage === 'waitlisted'
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginTop: '24px', background: 'rgba(5,5,5,0.7)', border: '1px solid rgba(212,191,255,0.25)', padding: '28px 24px', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.7), transparent)' }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#d4bfff', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '10px' }}>
          {isWait ? "You're on the waitlist" : "You're in"}
        </p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginBottom: '4px' }}>
          {isWait
            ? "The session is full. We'll contact you if a seat opens."
            : `Confirmed for ${selectedSession ? fmtFullDate(selectedSession.session_date) : 'your session'}. Check your email for details.`
          }
        </p>
        {!isWait && selectedSession && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.45)', letterSpacing: '0.14em' }}>
            {fmtTime(selectedSession.start_time)} – {fmtTime(selectedSession.end_time)}
          </p>
        )}
      </motion.div>
    )
  }

  // ── Main flow ──────────────────────────────────────────────────────────────

  return (
    <div style={{ marginTop: '24px' }}>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        {(['pick-date', 'fill-form'] as const).map((s, i) => {
          const active = stage === s || (s === 'pick-date' && stage === 'pick-time') || (s === 'fill-form' && stage === 'fill-form')
          const done = (i === 0 && (stage === 'fill-form' || stage === 'pick-time'))
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#d4bfff' : active ? 'rgba(212,191,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: done ? 'none' : active ? '1px solid rgba(212,191,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
              }}>
                {done
                  ? <span style={{ fontSize: '9px', color: '#050505', fontWeight: 700 }}>✓</span>
                  : <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: active ? '#d4bfff' : 'rgba(255,255,255,0.2)' }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: active || done ? 'rgba(212,191,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
                {i === 0 ? 'Pick a date' : 'Register'}
              </span>
              {i === 0 && <div style={{ width: '24px', height: '1px', background: stage === 'fill-form' ? 'rgba(212,191,255,0.4)' : 'rgba(255,255,255,0.08)' }} />}
            </div>
          )
        })}
      </div>

      {/* Month tabs — only show if more than 1 month */}
      {months.length > 1 && (
        <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '2px' }}>
          {months.map(mk => (
            <button
              key={mk}
              onClick={() => { setActiveMonth(mk); reset() }}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '9px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '7px 14px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s, color 0.15s',
                background: activeMonth === mk ? '#d4bfff' : 'rgba(255,255,255,0.05)',
                color: activeMonth === mk ? '#050505' : 'rgba(255,255,255,0.35)',
              }}
            >
              {fmtMonthLabel(mk)}
            </button>
          ))}
        </div>
      )}

      {/* Date grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMonth}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}
        >
          {datesForMonth.map(date => {
            const daySessions = grouped.get(activeMonth ?? '')?.get(date) ?? []
            const totalLeft = daySessions.reduce((acc, s) => acc + Math.max(0, s.capacity - s.seats_booked), 0)
            const allFull = daySessions.every(s => s.status === 'full' || s.capacity - s.seats_booked <= 0)
            const isActive = activeDate === date
            const { weekday, day } = fmtDayLabel(date)

            return (
              <button
                key={date}
                onClick={() => pickDate(date)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 14px',
                  minWidth: '56px',
                  background: isActive ? '#d4bfff' : 'rgba(5,5,5,0.6)',
                  border: isActive ? '1px solid #d4bfff' : allFull ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(212,191,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  opacity: allFull && !isActive ? 0.5 : 1,
                }}
              >
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '7px',
                  letterSpacing: '0.18em',
                  color: isActive ? 'rgba(5,5,5,0.6)' : 'rgba(212,191,255,0.5)',
                  marginBottom: '3px',
                }}>
                  {weekday}
                </span>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: isActive ? '#050505' : allFull ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                  marginBottom: '4px',
                }}>
                  {day}
                </span>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '7px',
                  letterSpacing: '0.1em',
                  color: isActive ? 'rgba(5,5,5,0.5)' : seatColor(totalLeft, allFull),
                }}>
                  {allFull ? 'Full' : totalLeft <= 3 ? `${totalLeft} left` : ''}
                </span>
              </button>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Time picker (only when a date has multiple slots) */}
      <AnimatePresence>
        {stage === 'pick-time' && sessionsForDate.length > 1 && (
          <motion.div
            ref={formRef}
            key="time-picker"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden', marginTop: '12px' }}
          >
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Pick a time
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {sessionsForDate.map(s => {
                const left = Math.max(0, s.capacity - s.seats_booked)
                const full = s.status === 'full' || left === 0
                return (
                  <button
                    key={s.id}
                    onClick={() => pickTime(s.id)}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(5,5,5,0.6)',
                      border: '1px solid rgba(212,191,255,0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px',
                      opacity: full ? 0.5 : 1,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => { if (!full) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,191,255,0.5)' }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,191,255,0.2)'}
                  >
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                      {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                    </span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: seatColor(left, full) }}>
                      {seatLabel(left, full)}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration form */}
      <AnimatePresence>
        {stage === 'fill-form' && selectedSession && (
          <motion.div
            ref={formRef}
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden', marginTop: '12px' }}
          >
            <div style={{ background: 'rgba(5,5,5,0.7)', border: '1px solid rgba(212,191,255,0.18)', padding: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.5), transparent)' }} />

              {/* Slot summary + back */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>
                    {fmtFullDate(selectedSession.session_date)}
                  </p>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.5)', letterSpacing: '0.14em' }}>
                    {fmtTime(selectedSession.start_time)} – {fmtTime(selectedSession.end_time)}
                    {selectedSession.location && (
                      <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: '8px' }}>· {selectedSession.location.split(',')[0]}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={reset}
                  style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.35)')}
                >
                  ← Change
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Field
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
                <Field
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Field
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                />

                {formError && (
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(255,100,80,0.8)', letterSpacing: '0.08em' }}>
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '4px',
                    background: selectedSession.status === 'full' ? 'transparent' : '#d4bfff',
                    color: selectedSession.status === 'full' ? '#d4bfff' : '#050505',
                    border: selectedSession.status === 'full' ? '1px solid rgba(212,191,255,0.4)' : 'none',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    padding: '14px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {submitting
                    ? 'Registering…'
                    : selectedSession.status === 'full'
                      ? 'Join waitlist'
                      : 'Register — it\'s free'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
