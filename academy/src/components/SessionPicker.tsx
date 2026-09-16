import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fetchMasterclassSlotData, bookMasterclassSlot } from '../lib/db'
import type { SlotCounts, BlockedWindow, SlotOverride } from '../lib/db'
import { loadSettings } from '../admin/settings'
import { supabase } from '../lib/supabase'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

const RAZORPAY_ENABLED = import.meta.env.VITE_RAZORPAY_ENABLED === 'true'

// ── Razorpay helpers ─────────────────────────────────────────────────────────

let razorpayScriptPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (razorpayScriptPromise) return razorpayScriptPromise
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve()
    s.onerror = () => {
      razorpayScriptPromise = null
      reject(new Error('Failed to load Razorpay checkout'))
    }
    document.head.appendChild(s)
  })
  return razorpayScriptPromise
}

async function pollPaymentStatus(
  bookingId: string,
  maxAttempts = 10,
): Promise<'paid' | 'failed' | 'timeout'> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const { data } = await supabase
      .from('masterclass_bookings')
      .select('payment_status')
      .eq('id', bookingId)
      .single()
    if (data?.payment_status === 'paid') return 'paid'
    if (data?.payment_status === 'failed') return 'failed'
  }
  return 'timeout'
}

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

// ── Spinner bar component ────────────────────────────────────────────────────

function SpinnerBars() {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
      {[0.6, 1, 0.7].map((h, i) => (
        <div key={i} style={{
          width: '3px', height: `${h * 14}px`,
          background: '#d4bfff', opacity: 0.5, borderRadius: '1px',
          animation: 'eqbar 0.8s ease-in-out infinite alternate',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

type Stage = 'pick' | 'form' | 'processing' | 'success' | 'waitlisted' | 'payment_abandoned'

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

  const today = new Date()
  const dates = Array.from({ length: scheduleDaysAhead }, (_, i) => dateStr(addDays(today, i)))
  const allSlots = generateSlots(scheduleOpenTime, scheduleCloseTime, slotMinutes)

  const [counts, setCounts] = useState<SlotCounts>({})
  const [blocked, setBlocked] = useState<BlockedWindow[]>([])
  const [overrides, setOverrides] = useState<SlotOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState(false)

  const [activeDate, setActiveDate] = useState(dates[0])
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)
  const [stage, setStage] = useState<Stage>('pick')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const from = dates[0]
    const to = dates[dates.length - 1]
    fetchMasterclassSlotData(from, to)
      .then(({ counts, blocked, overrides }) => { setCounts(counts); setBlocked(blocked); setOverrides(overrides) })
      .catch(() => setLoadErr(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (RAZORPAY_ENABLED && stage === 'form') {
      loadRazorpayScript().catch(() => {})
    }
  }, [stage])

  function refreshCounts() {
    const from = dates[0]; const to = dates[dates.length - 1]
    fetchMasterclassSlotData(from, to)
      .then(({ counts, blocked, overrides }) => { setCounts(counts); setBlocked(blocked); setOverrides(overrides) })
      .catch(() => null)
  }

  function slotKey(date: string, start: string) { return `${date}|${start}` }

  function slotStatus(date: string, slot: { start: string; end: string }) {
    if (isPast(date, slot.start)) return 'past'
    const ov = getOverride(date, slot.start, overrides)
    if (ov?.override === 'blocked') return 'blocked'
    if (!ov) {
      const w = getBlockingWindow(slot.start, slot.end, blocked, date)
      if (w) {
        if (w.cohort) return `blocked-${w.cohort.toLowerCase()}`
        return 'blocked'
      }
    }
    const booked = counts[slotKey(date, slot.start)] ?? 0
    if (booked >= (slotCapacity || 3)) return 'full'
    return 'available'
  }

  const daySlots = allSlots.map(s => ({ ...s, status: slotStatus(activeDate, s) }))
  const visibleSlots = daySlots.filter(s => s.status !== 'past')

  function dayHasSlots(date: string) {
    return allSlots.some(s => slotStatus(date, s) === 'available')
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

  // ── Razorpay checkout flow ───────────────────────────────────────────────────

  async function openRazorpayCheckout(bid: string) {
    setSubmitting(true)
    try {
      const [orderResult] = await Promise.all([
        supabase.functions.invoke('create-razorpay-order', { body: { booking_id: bid } }),
        loadRazorpayScript(),
      ])
      const { data, error: fnErr } = orderResult
      if (fnErr || data?.error) throw new Error(data?.error ?? 'Order creation failed')

      let handlerFired = false

      const rzp = new window.Razorpay({
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        name: 'GCI Music Academy',
        description: 'Masterclass Session Fee',
        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: phone.replace(/[\s\-+]/g, ''),
        },
        theme: { color: '#d4bfff' },
        handler: async () => {
          handlerFired = true
          setStage('processing')
          setSubmitting(false)
          // Poll until webhook confirms payment_status = 'paid'
          // If timeout (20s), still show success — webhook fires asynchronously
          await pollPaymentStatus(bid)
          setStage('success')
          refreshCounts()
        },
        modal: {
          ondismiss: () => {
            if (!handlerFired) {
              setStage('payment_abandoned')
              setSubmitting(false)
            }
          },
        },
      })
      rzp.open()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment could not be opened'
      setFormError(msg)
      setStage('form')
      setSubmitting(false)
    }
  }

  // ── Form submit ──────────────────────────────────────────────────────────────

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
        refreshCounts()
        setSubmitting(false)
        return
      }
      if (result.error === 'already_registered') {
        setFormError('You already have a booking for this slot.')
        setSubmitting(false)
        return
      }

      if (result.status === 'waitlisted') {
        setStage('waitlisted')
        supabase.functions.invoke('send-masterclass-confirmation', {
          body: { name: name.trim(), email: email.trim(), date: activeDate, startTime: selectedSlot.start, endTime: selectedSlot.end, status: 'waitlisted' },
        }).catch(() => {})
        refreshCounts()
        setSubmitting(false)
        return
      }

      // Confirmed slot
      const bid = result.id!
      setBookingId(bid)
      refreshCounts()

      if (!RAZORPAY_ENABLED) {
        // Feature flag off — pre-payment flow, behavior unchanged
        setStage('success')
        supabase.functions.invoke('send-masterclass-confirmation', {
          body: { name: name.trim(), email: email.trim(), date: activeDate, startTime: selectedSlot.start, endTime: selectedSlot.end, status: 'confirmed' },
        }).catch(() => {})
        setSubmitting(false)
        return
      }

      await openRazorpayCheckout(bid)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setFormError(`Booking failed: ${msg}`)
      setSubmitting(false)
    }
  }

  // ── Processing screen (polling after Razorpay handler fires) ─────────────────

  if (stage === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginTop: '24px', background: 'rgba(5,5,5,0.7)', border: '1px solid rgba(212,191,255,0.2)', padding: '28px 24px', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.55), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SpinnerBars />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Confirming payment
          </span>
        </div>
      </motion.div>
    )
  }

  // ── Payment abandoned screen ──────────────────────────────────────────────────

  if (stage === 'payment_abandoned') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginTop: '24px', background: 'rgba(5,5,5,0.7)', border: '1px solid rgba(212,191,255,0.15)', padding: '28px 24px', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.35), transparent)' }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.5)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Payment not completed
        </p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
          {fmtFullDate(activeDate)}
        </p>
        {selectedSlot && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(212,191,255,0.55)', letterSpacing: '0.14em', marginBottom: '16px' }}>
            {fmtTime12(selectedSlot.start)} – {fmtTime12(selectedSlot.end)}
          </p>
        )}
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: '20px' }}>
          Your slot is still reserved. Complete payment to confirm it.
        </p>
        <button
          onClick={() => bookingId && openRazorpayCheckout(bookingId)}
          disabled={submitting}
          style={{
            background: '#d4bfff',
            color: '#050505',
            border: 'none',
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '14px 20px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            transition: 'opacity 0.15s',
            width: '100%',
          }}
        >
          {submitting ? 'Opening payment...' : `Complete payment · ₹${fee}`}
        </button>
      </motion.div>
    )
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
            : RAZORPAY_ENABLED
              ? "Payment confirmed. Check your email for the booking details."
              : "We've received your request. Our team will reach out to confirm your slot and share payment details."}
        </p>
        {!isWait && !RAZORPAY_ENABLED && (
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
        <SpinnerBars />
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
                background: isActive ? '#050505' : 'rgba(5,5,5,0.6)',
                border: isActive ? '1.5px solid rgba(212,191,255,0.5)' : hasSlots ? '1px solid rgba(212,191,255,0.18)' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                opacity: !hasSlots && !isActive ? 0.4 : 1,
                transition: 'all 0.15s',
                gap: '2px',
              }}
            >
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '7px', letterSpacing: '0.14em', color: isActive ? 'rgba(212,191,255,0.6)' : 'rgba(212,191,255,0.5)', textTransform: 'uppercase' }}>
                {top}
              </span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: isActive ? '#d4bfff' : hasSlots ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', lineHeight: 1.1 }}>
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
                const isClassBlock = slot.status.startsWith('blocked-c')
                const blockCohort = isClassBlock ? slot.status.replace('blocked-', '').toUpperCase() : null
                const COHORT_RGBA: Record<string, string> = {
                  C0: '100,116,139', C1: '236,72,153', C2: '99,102,241', C3: '245,158,11', C4: '16,185,129', C5: '14,165,233',
                }
                const cohortRgb = blockCohort ? (COHORT_RGBA[blockCohort] ?? '99,102,241') : null

                let slotBg = 'rgba(5,5,5,0.62)'
                let slotBorder = '1px solid rgba(212,191,255,0.28)'
                let slotCursor = 'pointer'
                let slotOpacity = 1

                if (isSelected) { slotBg = '#050505'; slotBorder = '1.5px solid rgba(212,191,255,0.65)' }
                else if (isManualBlock) { slotBg = 'rgba(5,5,5,0.25)'; slotBorder = '1px solid rgba(5,5,5,0.12)'; slotOpacity = 0.4; slotCursor = 'default' }
                else if (isClassBlock && cohortRgb) { slotBg = `rgba(${cohortRgb},0.1)`; slotBorder = `2px solid rgba(${cohortRgb},0.8)`; slotCursor = 'default' }
                else if (isFull) { slotBg = 'rgba(5,5,5,0.5)'; slotBorder = '1px solid rgba(255,80,80,0.25)'; slotCursor = 'default' }

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
                    onMouseEnter={e => { if (isAvailable && !isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,191,255,0.7)' }}
                    onMouseLeave={e => { if (isAvailable && !isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,191,255,0.28)' }}
                  >
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: isSelected
                        ? '#d4bfff'
                        : isClassBlock && cohortRgb ? `rgba(${cohortRgb},1)`
                        : isFull ? 'rgba(255,255,255,0.4)'
                        : 'rgba(255,255,255,0.9)',
                    }}>
                      {fmtTime12(slot.start)}
                    </span>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '7px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: isSelected
                        ? 'rgba(212,191,255,0.55)'
                        : isClassBlock && cohortRgb ? `rgba(${cohortRgb},0.85)`
                        : isFull ? 'rgba(255,80,80,0.85)'
                        : left <= 1 ? '#ffcc80'
                        : 'rgba(212,191,255,0.65)',
                    }}>
                      {isClassBlock && blockCohort ? `${blockCohort} · class`
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
                  {submitting
                    ? RAZORPAY_ENABLED ? 'Preparing payment...' : 'Booking…'
                    : `Confirm booking · ₹${fee}`}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
