import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fetchMasterclassSlotData, bookMasterclassSlot } from '../lib/db'
import type { SlotCounts, BlockedWindow, SlotOverride } from '../lib/db'
import { loadSettings } from '../admin/settings'
import { supabase } from '../lib/supabase'

// ── Slot generation ──────────────────────────────────────────────────────────

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function generateSlots(openTime: string, closeTime: string, slotMinutes: number) {
  const slots: { start: string; end: string }[] = []
  let cur = toMinutes(openTime)
  const close = toMinutes(closeTime)
  while (cur + slotMinutes <= close) {
    slots.push({ start: fromMinutes(cur), end: fromMinutes(cur + slotMinutes) })
    cur += slotMinutes
  }
  return slots
}

function getBlockingWindow(start: string, end: string, windows: BlockedWindow[], date: string) {
  return windows.find(w =>
    w.session_date === date && w.start_time.slice(0, 5) < end && w.end_time.slice(0, 5) > start
  ) ?? null
}

function getOverride(date: string, start: string, overrides: SlotOverride[]) {
  return overrides.find(o => o.slot_date === date && o.slot_start.slice(0, 5) === start)
}

function isPast(date: string, slotStart: string) {
  const now = new Date()
  const slot = new Date(`${date}T${slotStart}:00`)
  // Add a small buffer — if slot starts within 15 min, treat as past
  return slot.getTime() - now.getTime() < 15 * 60 * 1000
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(base: Date, n: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function fmtDayTab(dateS: string) {
  const d = new Date(dateS + 'T00:00:00')
  const today = dateStr(new Date())
  if (dateS === today) return { top: 'Today', bottom: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
  return {
    top: d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase(),
    bottom: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }
}

function fmtTime12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function fmtFullDate(dateS: string) {
  return new Date(dateS + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
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

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{ ...fieldStyle, borderColor: focused ? 'rgba(212,191,255,0.5)' : 'rgba(212,191,255,0.15)' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

// ── Main component ───────────────────────────────────────────────────────────

type Stage = 'pick' | 'form' | 'success' | 'waitlisted'

export default function SessionPicker() {
  const { masterclass } = loadSettings()
  const {
    fee = '179',
    scheduleOpenTime = '10:00',
    scheduleCloseTime = '22:00',
    slotMinutes = 30,
    slotCapacity = 3,
    scheduleDaysAhead = 14,
  } = masterclass

  // Build date list
  const today = new Date()
  const dates = Array.from({ length: scheduleDaysAhead }, (_, i) => dateStr(addDays(today, i)))
  const allSlots = generateSlots(scheduleOpenTime, scheduleCloseTime, slotMinutes)

  // Data
  const [counts, setCounts] = useState<SlotCounts>({})
  const [blocked, setBlocked] = useState<BlockedWindow[]>([])
  const [overrides, setOverrides] = useState<SlotOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState(false)

  // Selection
  const [activeDate, setActiveDate] = useState(dates[0])
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)
  const [stage, setStage] = useState<Stage>('pick')

  // Form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)
  const dayScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const from = dates[0]
    const to = dates[dates.length - 1]
    fetchMasterclassSlotData(from, to)
      .then(({ counts, blocked, overrides }) => { setCounts(counts); setBlocked(blocked); setOverrides(overrides) })
      .catch(() => setLoadErr(true))
      .finally(() => setLoading(false))
  }, [])

  function slotKey(date: string, start: string) { return `${date}|${start}` }

  function slotStatus(date: string, slot: { start: string; end: string }) {
    if (isPast(date, slot.start)) return 'past'
    const ov = getOverride(date, slot.start, overrides)
    if (ov?.override === 'blocked') return 'blocked'
    // 'open' override bypasses course-class blocking; no override → check class blocks
    if (!ov) {
      const w = getBlockingWindow(slot.start, slot.end, blocked, date)
      if (w) {
        if (w.cohort === 'C1') return 'blocked-c1'
        if (w.cohort === 'C2') return 'blocked-c2'
        return 'blocked' // session-table block, no cohort
      }
    }
    const booked = counts[slotKey(date, slot.start)] ?? 0
    if (booked >= (slotCapacity || 3)) return 'full'
    return 'available'
  }

  // Slots for the active day, excluding past
  const daySlots = allSlots.map(s => ({ ...s, status: slotStatus(activeDate, s) }))
  const visibleSlots = daySlots.filter(s => s.status !== 'past')

  // Whether a day has any bookable slots
  function dayHasSlots(date: string) {
    return allSlots.some(s => {
      const st = slotStatus(date, s)
      return st === 'available'
    })
  }

  function pickSlot(slot: { start: string; end: string }) {
    setSelectedSlot(slot)
    setStage('form')
    setFormError(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
  }

  function changeDate(date: string) {
    setActiveDate(date)
    setSelectedSlot(null)
    setStage('pick')
    setFormError(null)
  }

  function validate() {
    if (!name.trim()) return 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
    if (!/^\d{10,12}$/.test(phone.replace(/[\s\-+]/g, ''))) return 'Enter a valid phone number.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return
    const err = validate()
    if (err) { setFormError(err); return }
    setFormError(null)
    setSubmitting(true)
    try {
      const result = await bookMasterclassSlot(
        activeDate, selectedSlot.start, selectedSlot.end,
        name.trim(), email.trim(), phone.replace(/[\s\-+]/g, ''),
        slotCapacity,
      )
      if (result.error === 'slot_blocked') {
        setFormError('This slot was just blocked by a class. Pick another time.')
        // Refresh slot data
        const from = dates[0]; const to = dates[dates.length - 1]
        fetchMasterclassSlotData(from, to).then(({ counts, blocked, overrides }) => { setCounts(counts); setBlocked(blocked); setOverrides(overrides) }).catch(() => null)
        setSubmitting(false)
        return
      }
      setStage(result.status === 'waitlisted' ? 'waitlisted' : 'success')
      // Send confirmation email — fire-and-forget, never block the UX
      supabase.functions.invoke('send-masterclass-confirmation', {
        body: { name: name.trim(), email: email.trim(), date: activeDate, startTime: selectedSlot.start, endTime: selectedSlot.end, status: result.status ?? 'confirmed' },
      }).catch(() => {})
      // Refresh counts
      const from = dates[0]; const to = dates[dates.length - 1]
      fetchMasterclassSlotData(from, to).then(({ counts, blocked }) => { setCounts(counts); setBlocked(blocked) }).catch(() => null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setFormError(`Booking failed: ${msg}`)
      setSubmitting(false)
    }
  }

  // ── Success / waitlist screens ──────────────────────────────────────────────

  if (stage === 'success' || stage === 'waitlisted') {
    const isWait = stage === 'waitlisted'
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginTop: '24px', background: 'rgba(5,5,5,0.7)', border: '1px solid rgba(212,191,255,0.25)', padding: '28px 24px', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.8), transparent)' }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#d4bfff', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '10px' }}>
          {isWait ? "You're on the waitlist" : "You're booked"}
        </p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
          {fmtFullDate(activeDate)}
        </p>
        {selectedSlot && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(212,191,255,0.55)', letterSpacing: '0.14em', marginBottom: '12px' }}>
            {fmtTime12(selectedSlot.start)} – {fmtTime12(selectedSlot.end)}
          </p>
        )}
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
          {isWait
            ? "This slot just filled up. You're on the waitlist. We'll reach out if a spot opens."
            : "We've received your request. Our team will reach out to confirm your slot and share payment details."}
        </p>
        {!isWait && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.12em', marginTop: '10px' }}>
            ₹{fee} is credited toward the course fee if you enroll.
          </p>
        )}
      </motion.div>
    )
  }

  // ── Loading / error ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
          {[0.6, 1, 0.7].map((h, i) => (
            <div key={i} style={{ width: '3px', height: `${h * 14}px`, background: '#d4bfff', opacity: 0.35, borderRadius: '1px', animation: 'eqbar 0.8s ease-in-out infinite alternate', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Loading</span>
      </div>
    )
  }

  if (loadErr) {
    return (
      <div style={{ marginTop: '24px', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(255,100,80,0.6)' }}>
        Could not load schedule. Refresh the page.
      </div>
    )
  }

  // ── Main picker ─────────────────────────────────────────────────────────────

  return (
    <div style={{ marginTop: '24px' }}>

      {/* Day scroll */}
      <div
        ref={dayScrollRef}
        style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '16px', scrollbarWidth: 'none' }}
        className="hide-scrollbar"
      >
        {dates.map(d => {
          const isActive = d === activeDate
          const hasSlots = dayHasSlots(d)
          const { top, bottom } = fmtDayTab(d)
          return (
            <button
              key={d}
              onClick={() => changeDate(d)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 12px',
                minWidth: '52px',
                flexShrink: 0,
                background: isActive ? '#d4bfff' : 'rgba(5,5,5,0.6)',
                border: isActive ? 'none' : hasSlots ? '1px solid rgba(212,191,255,0.18)' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                opacity: !hasSlots && !isActive ? 0.4 : 1,
                transition: 'all 0.15s',
                gap: '2px',
              }}
            >
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '7px', letterSpacing: '0.14em', color: isActive ? 'rgba(5,5,5,0.55)' : 'rgba(212,191,255,0.5)', textTransform: 'uppercase' }}>
                {top}
              </span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: isActive ? '#050505' : hasSlots ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', lineHeight: 1.1 }}>
                {bottom}
              </span>
            </button>
          )
        })}
      </div>

      {/* Time slot grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDate}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {visibleSlots.length === 0 ? (
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '16px 0' }}>
              No available slots today
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '6px' }}>
              {visibleSlots.map(slot => {
                const isSelected = selectedSlot?.start === slot.start && stage === 'form'
                const booked = counts[slotKey(activeDate, slot.start)] ?? 0
                const cap = slotCapacity || 3
                const left = cap - booked
                const isAvailable = slot.status === 'available'
                const isFull = slot.status === 'full'
                const isManualBlock = slot.status === 'blocked'
                const isC1 = slot.status === 'blocked-c1'
                const isC2 = slot.status === 'blocked-c2'
                const isClassBlock = isC1 || isC2

                // Slot style by state
                let slotBg = 'rgba(5,5,5,0.6)'
                let slotBorder = '1px solid rgba(212,191,255,0.18)'
                let slotCursor = 'pointer'
                let slotOpacity = 1

                if (isSelected) { slotBg = '#d4bfff'; slotBorder = 'none' }
                else if (isManualBlock) { slotBg = 'rgba(255,255,255,0.01)'; slotBorder = '1px solid rgba(255,255,255,0.04)'; slotOpacity = 0.25; slotCursor = 'default' }
                else if (isC1) { slotBg = 'rgba(255,165,40,0.06)'; slotBorder = '1px solid rgba(255,165,40,0.2)'; slotCursor = 'default' }
                else if (isC2) { slotBg = 'rgba(45,212,191,0.06)'; slotBorder = '1px solid rgba(45,212,191,0.2)'; slotCursor = 'default' }
                else if (isFull) { slotBg = 'rgba(5,5,5,0.4)'; slotBorder = '1px solid rgba(255,255,255,0.07)'; slotCursor = 'default' }

                return (
                  <button
                    key={slot.start}
                    onClick={() => { if (isAvailable) pickSlot(slot) }}
                    disabled={!isAvailable}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: isClassBlock ? '8px 6px' : '10px 8px',
                      background: slotBg,
                      border: slotBorder,
                      cursor: slotCursor,
                      opacity: slotOpacity,
                      transition: 'all 0.12s',
                      gap: '3px',
                    }}
                    onMouseEnter={e => { if (isAvailable && !isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,191,255,0.45)' }}
                    onMouseLeave={e => { if (isAvailable && !isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,191,255,0.18)' }}
                  >
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: isSelected
                        ? '#050505'
                        : isC1 ? 'rgba(255,165,40,0.7)'
                        : isC2 ? 'rgba(45,212,191,0.7)'
                        : isFull ? 'rgba(255,255,255,0.25)'
                        : 'rgba(255,255,255,0.85)',
                    }}>
                      {fmtTime12(slot.start)}
                    </span>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '7px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: isSelected
                        ? 'rgba(5,5,5,0.5)'
                        : isC1 ? 'rgba(255,165,40,0.55)'
                        : isC2 ? 'rgba(45,212,191,0.55)'
                        : isFull ? 'rgba(255,80,80,0.5)'
                        : left <= 1 ? '#ffcc80'
                        : 'rgba(212,191,255,0.4)',
                    }}>
                      {isC1 ? 'C1 · class'
                        : isC2 ? 'C2 · class'
                        : isFull ? 'Full'
                        : left === 1 ? '1 left'
                        : `${left} free`}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Registration form */}
      <AnimatePresence>
        {stage === 'form' && selectedSlot && (
          <motion.div
            ref={formRef}
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden', marginTop: '12px' }}
          >
            <div style={{ background: 'rgba(5,5,5,0.8)', border: '1px solid rgba(212,191,255,0.2)', padding: '18px 20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.55), transparent)' }} />

              {/* Slot summary */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>
                    {fmtFullDate(activeDate)}
                  </p>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.5)', letterSpacing: '0.14em' }}>
                    {fmtTime12(selectedSlot.start)} – {fmtTime12(selectedSlot.end)} · 30 min
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedSlot(null); setStage('pick') }}
                  style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '2px 0' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.35)')}
                >
                  ← Change
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Field type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                <Field type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                <Field type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />

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
                    background: '#d4bfff',
                    color: '#050505',
                    border: 'none',
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
                  {submitting ? 'Booking…' : `Confirm booking · ₹${fee}`}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
