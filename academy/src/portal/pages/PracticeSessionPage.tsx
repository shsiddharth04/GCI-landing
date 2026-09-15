import { useState, useEffect, useCallback } from 'react'
import type { EnrolledStudent, Session, PracticeBooking, CourseClassBlock } from '../../lib/db'
import {
  fetchSessionsForCalendar, fetchCourseBlocksForRange,
  fetchMyPracticeBookings, bookPracticeSlot, cancelPracticeBooking,
  computePracticeVacancies,
  type VacantSlot,
} from '../../lib/db'
import { supabase } from '../../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'

interface Props { student: EnrolledStudent }

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"
const STUDIO = '11th Floor, The Capital, Next to CDS, Gurugram'

// ── Utilities ─────────────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt12(t: string): string {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function fmtCompact(t: string): string {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
}

function fmtDateShort(d: string): string {
  const date = new Date(d + 'T00:00:00')
  const wd  = date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()
  const day = date.getDate().toString().padStart(2, '0')
  const mon = date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()
  return `${wd} ${day} ${mon}`
}

function fmtBlockedUntil(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function isBlockActive(t: string | null): boolean {
  return !!t && new Date(t) > new Date()
}

function canCancel(sessionDate: string | undefined, startTime: string | undefined): boolean {
  if (!sessionDate || !startTime) return false
  const slotStart = new Date(`${sessionDate}T${startTime}`)
  return slotStart.getTime() - Date.now() > 24 * 60 * 60 * 1000
}

function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function calendarWindow(): { from: string; to: string } {
  const thisMonday = getWeekMonday(new Date())
  const nextSunday = new Date(thisMonday)
  nextSunday.setDate(nextSunday.getDate() + 13)
  return {
    from: localDateStr(new Date()),
    to:   localDateStr(nextSunday),
  }
}

function allDatesInWindow(from: string, to: string): string[] {
  const dates: string[] = []
  const cur = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (cur <= end) {
    dates.push(localDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

// ── Calendar types ─────────────────────────────────────────────────────────────

type CalEntry =
  | { kind: 'course';      date: string; start: string; end: string; label: string | null }
  | { kind: 'masterclass'; date: string; start: string; end: string; sessionId: string }
  | { kind: 'practice';    date: string; start: string; end: string; session: Session; myBooking: PracticeBooking }
  | { kind: 'vacant';      date: string; start: string; end: string }

function buildCalendar(
  allSessions: Session[],
  courseBlocks: CourseClassBlock[],
  myBookings: PracticeBooking[],
  from: string,
  to: string,
  studentCohort: string,
): Map<string, CalEntry[]> {
  const myBookingBySessionId = new Map<string, PracticeBooking>()
  for (const b of myBookings) myBookingBySessionId.set(b.session_id, b)

  const sessionsByDate = new Map<string, Session[]>()
  for (const s of allSessions) {
    sessionsByDate.set(s.session_date, [...(sessionsByDate.get(s.session_date) ?? []), s])
  }
  const blocksByDate = new Map<string, CourseClassBlock[]>()
  for (const b of courseBlocks) {
    blocksByDate.set(b.block_date, [...(blocksByDate.get(b.block_date) ?? []), b])
  }

  const result = new Map<string, CalEntry[]>()
  const cur = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')

  while (cur <= end) {
    const date = localDateStr(cur)
    const daySessions = sessionsByDate.get(date) ?? []
    const dayBlocks   = blocksByDate.get(date) ?? []
    const entries: CalEntry[] = []

    for (const s of daySessions) {
      if (s.session_type === 'course_class') {
        entries.push({ kind: 'course', date, start: s.start_time, end: s.end_time, label: null })
      } else if (s.session_type === 'masterclass') {
        entries.push({ kind: 'masterclass', date, start: s.start_time, end: s.end_time, sessionId: s.id })
      } else if (s.session_type === 'practice_session') {
        const myBooking = myBookingBySessionId.get(s.id)
        if (myBooking) {
          entries.push({ kind: 'practice', date, start: s.start_time, end: s.end_time, session: s, myBooking })
        }
      }
    }

    for (const b of dayBlocks) {
      if (b.cohort === studentCohort) {
        entries.push({ kind: 'course', date, start: b.start_time, end: b.end_time, label: b.label })
      }
    }

    // Vacant slots: studio hours minus ALL cohorts' blocks (studio is one space)
    const vacancies = computePracticeVacancies(date, daySessions, dayBlocks)
    for (const v of vacancies) {
      entries.push({ kind: 'vacant', date, start: v.start, end: v.end })
    }

    if (entries.length > 0) {
      entries.sort((a, b) => a.start.localeCompare(b.start))
      result.set(date, entries)
    }

    cur.setDate(cur.getDate() + 1)
  }

  return result
}

// ── WaveformBars ───────────────────────────────────────────────────────────────

function WaveformBars({ dim = false }: { dim?: boolean }) {
  const heights = [0.2, 0.6, 1.0, 0.45, 0.8, 0.35, 0.9, 0.5, 0.7, 0.3, 0.85, 0.55, 0.75, 0.4, 0.65]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 36 }}>
      {heights.map((h, i) => (
        <div key={i} className="practice-wave-bar" style={{
          width: 3,
          background: dim ? 'rgba(232,222,250,0.07)' : 'rgba(232,222,250,0.2)',
          borderRadius: 2, height: `${h * 100}%`,
          animationDelay: `${i * 0.1}s`,
          animationDuration: `${0.9 + (i % 3) * 0.3}s`,
        }} />
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PracticeSessionPage({ student }: Props) {
  const isMobile = useIsMobile()

  const [calendar, setCalendar] = useState<Map<string, CalEntry[]>>(new Map())
  const [myBookings, setMyBookings] = useState<PracticeBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => localDateStr(new Date()))

  const [confirmingVacantKey, setConfirmingVacantKey] = useState<string | null>(null)
  const [bookingVacantKey, setBookingVacantKey]       = useState<string | null>(null)
  const [bookedVacantKey, setBookedVacantKey]         = useState<string | null>(null)
  const [bookingError, setBookingError]               = useState<string | null>(null)

  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId]               = useState<string | null>(null)
  const [cancelError, setCancelError]                 = useState<string | null>(null)

  const isLocked  = student.practice_access_mode !== 'unlocked'
  const isBlocked = isBlockActive(student.blocked_until)

  const { from, to } = calendarWindow()
  const windowDates = allDatesInWindow(from, to)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const { from, to } = calendarWindow()
      const [sessions, courseBlocks, bookings] = await Promise.all([
        fetchSessionsForCalendar(from, to),
        fetchCourseBlocksForRange(from, to),
        fetchMyPracticeBookings(),
      ])
      setCalendar(buildCalendar(sessions, courseBlocks, bookings, from, to, student.cohort))
      setMyBookings(bookings)
    } catch {
      setLoadError('Failed to load. Refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [student.cohort])

  useEffect(() => {
    if (!isLocked && !isBlocked) load()
    else setLoading(false)
  }, [isLocked, isBlocked, load])

  function selectDate(date: string) {
    setSelectedDate(date)
    setConfirmingVacantKey(null)
    setCancellingBookingId(null)
    setBookingError(null)
    setCancelError(null)
  }

  async function handleBook(slot: VacantSlot) {
    const key = `${slot.date}|${slot.start}`
    setBookingVacantKey(key)
    setBookingError(null)
    try {
      const result = await bookPracticeSlot(student.id, slot.date, slot.start, slot.end)
      if (result.error) {
        const MSGS: Record<string, string> = {
          slot_no_longer_available: 'This slot was just taken — someone booked it first.',
          invalid_slot:             'Invalid slot. Please refresh and try again.',
          daily_cap_reached:        "You've already booked 2 sessions on this day.",
          access_locked:            "Practice booking isn't unlocked for your account.",
          noshowblock:              'Your practice access is blocked. Contact your instructor.',
          student_not_found:        'Account error. Refresh and try again.',
          no_instructor_found:      'Studio configuration error. Contact your instructor.',
        }
        setBookingError(MSGS[result.error] ?? `Booking failed (${result.error}).`)
        setConfirmingVacantKey(null)
        return
      }
      supabase.functions.invoke('send-practice-email', {
        body: {
          booking_id: result.booking_id, type: 'confirmed',
          student_name: student.name, student_email: student.email,
          slot_date: slot.date, slot_start: slot.start, slot_end: slot.end,
        },
      }).catch(() => {})
      setConfirmingVacantKey(null)
      setBookedVacantKey(key)
      await load()
      setTimeout(() => setBookedVacantKey(null), 4000)
    } catch {
      setBookingError('Something went wrong. Try again.')
      setConfirmingVacantKey(null)
    } finally {
      setBookingVacantKey(null)
    }
  }

  async function handleCancel(booking: PracticeBooking) {
    setCancellingId(booking.id)
    setCancelError(null)
    try {
      const result = await cancelPracticeBooking(booking.cancellation_token)
      if (result.error) {
        const MSGS: Record<string, string> = {
          inside_24h_window:            'This slot starts within 24 hours. Cancellation window is closed.',
          invalid_or_already_cancelled: 'This booking is already cancelled.',
        }
        setCancelError(MSGS[result.error] ?? `Cancellation failed (${result.error}).`)
        setCancellingBookingId(null)
        return
      }
      supabase.functions.invoke('send-practice-email', {
        body: {
          booking_id: booking.id, type: 'cancelled',
          student_name: student.name, student_email: student.email,
          slot_date:  booking.session?.session_date ?? '',
          slot_start: booking.session?.start_time?.slice(0, 5) ?? '',
          slot_end:   booking.session?.end_time?.slice(0, 5) ?? '',
        },
      }).catch(() => {})
      setCancellingBookingId(null)
      await load()
    } catch {
      setCancelError('Something went wrong. Try again.')
      setCancellingBookingId(null)
    } finally {
      setCancellingId(null)
    }
  }

  const bookedPerDate = new Map<string, number>()
  for (const b of myBookings) {
    const d = b.session?.session_date
    if (d) bookedPerDate.set(d, (bookedPerDate.get(d) ?? 0) + 1)
  }

  const pad: React.CSSProperties = {
    padding: isMobile ? '24px 20px 60px' : '48px 56px',
    fontFamily: SANS, minHeight: '100vh',
  }

  // ── Locked ───────────────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div style={pad}>
        <WaveformBars dim />
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)', marginTop: 24, marginBottom: 16 }}>
          Practice · Locked
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: isMobile ? 24 : 36, fontWeight: 700, color: '#E8DEFA', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 16px' }}>
          Keep showing up.
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(232,222,250,0.5)', lineHeight: 1.75, margin: 0, maxWidth: 420 }}>
          Practice booking opens after your 6th class.
        </p>
        <WaveformStyle />
      </div>
    )
  }

  // ── Blocked ──────────────────────────────────────────────────────────────────
  if (isBlocked) {
    return (
      <div style={pad}>
        <WaveformBars dim />
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)', marginTop: 24, marginBottom: 16 }}>
          Practice · Blocked
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: isMobile ? 24 : 36, fontWeight: 700, color: '#E8DEFA', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 16px' }}>
          Access blocked.
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(232,222,250,0.5)', lineHeight: 1.75, margin: '0 0 12px', maxWidth: 420 }}>
          You missed a session without cancelling in advance. Booking access is blocked until:
        </p>
        <p style={{ fontFamily: MONO, fontSize: 13, color: '#E8DEFA', letterSpacing: '0.04em', margin: '0 0 32px' }}>
          {fmtBlockedUntil(student.blocked_until!)}
        </p>
        <p style={{ fontSize: 13, color: 'rgba(232,222,250,0.3)', lineHeight: 1.7, margin: 0, maxWidth: 380 }}>
          Access restores automatically once the block expires. Contact your instructor if you think this was an error.
        </p>
        <WaveformStyle />
      </div>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={pad}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)' }}>
          Loading…
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={pad}>
        <p style={{ fontSize: 14, color: 'rgba(255,120,100,0.8)' }}>{loadError}</p>
      </div>
    )
  }

  // ── Unlocked: derive day data ─────────────────────────────────────────────────
  const todayStr    = localDateStr(new Date())
  const dayEntries  = calendar.get(selectedDate) ?? []
  const dayBooked   = bookedPerDate.get(selectedDate) ?? 0
  const dayFull     = dayBooked >= 2

  const dayBlockNotices = dayEntries.filter(
    (e): e is Extract<CalEntry, { kind: 'course' | 'masterclass' }> =>
      e.kind === 'course' || e.kind === 'masterclass'
  )
  // All bookable chips in chronological order (mine + vacant together)
  const chipSlots = dayEntries.filter(
    (e): e is Extract<CalEntry, { kind: 'practice' | 'vacant' }> =>
      e.kind === 'practice' || e.kind === 'vacant'
  )

  // Slot being confirm-booked
  const confirmingSlot: Extract<CalEntry, { kind: 'vacant' }> | null = (() => {
    if (!confirmingVacantKey) return null
    const [d, s] = confirmingVacantKey.split('|')
    const found = dayEntries.find(e => e.kind === 'vacant' && e.date === d && e.start === s)
    return found?.kind === 'vacant' ? found : null
  })()

  // Slot being confirm-cancelled
  const cancellingEntry = cancellingBookingId
    ? dayEntries.find(e => e.kind === 'practice' && e.myBooking.id === cancellingBookingId)
    : undefined
  const cancellingBooking = cancellingEntry?.kind === 'practice' ? cancellingEntry.myBooking : null

  // Upcoming bookings (future, sorted)
  const now = new Date()
  const upcomingBookings = myBookings
    .filter(b => b.session && new Date(`${b.session.session_date}T${b.session.start_time}`) > now)
    .sort((a, b) => {
      const at = `${a.session?.session_date}T${a.session?.start_time}`
      const bt = `${b.session?.session_date}T${b.session?.start_time}`
      return at.localeCompare(bt)
    })

  // ── Unlocked: render ──────────────────────────────────────────────────────────
  return (
    <div style={pad}>

      {/* Header */}
      <div style={{ marginBottom: isMobile ? 28 : 36 }}>
        <WaveformBars />
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.5)', margin: '20px 0 10px' }}>
          Practice
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: isMobile ? 22 : 32, fontWeight: 700, color: '#E8DEFA', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 8px' }}>
          Book a session.
        </h1>
        <p style={{ fontSize: 12, color: 'rgba(232,222,250,0.35)', margin: 0, fontFamily: MONO, letterSpacing: '0.03em' }}>
          Max 2 / day · Cancel 24h before · {STUDIO}
        </p>
      </div>

      {/* Error banners */}
      {bookingError && <ErrorBanner msg={bookingError} onDismiss={() => setBookingError(null)} />}
      {cancelError  && <ErrorBanner msg={cancelError}  onDismiss={() => setCancelError(null)} />}

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)', marginBottom: 10 }}>
            Upcoming
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {upcomingBookings.map(b => (
              <div
                key={b.id}
                onClick={() => selectDate(b.session!.session_date)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(232,222,250,0.04)',
                  border: '1px solid rgba(232,222,250,0.1)',
                  cursor: 'pointer',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', color: 'rgba(232,222,250,0.5)' }}>
                    {fmtDateShort(b.session!.session_date)}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: '#E8DEFA', letterSpacing: '0.03em' }}>
                    {fmtCompact(b.session!.start_time)} – {fmtCompact(b.session!.end_time)}
                  </span>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.25)', flexShrink: 0 }}>
                  tap to cancel →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date strip */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)', marginBottom: 10 }}>
          Select a date
        </div>
        {/* Two rows: this week + next week */}
        {[windowDates.slice(0, 7), windowDates.slice(7)].map((week, wi) => (
          <div
            key={wi}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${week.length}, 1fr)`,
              gap: 4,
              marginBottom: wi === 0 ? 4 : 0,
            }}
          >
            {week.map(date => {
              const entries    = calendar.get(date) ?? []
              const hasVacant  = entries.some(e => e.kind === 'vacant')
              const hasMine    = entries.some(e => e.kind === 'practice')
              const isSelected = date === selectedDate
              const isToday    = date === todayStr
              const d          = new Date(date + 'T00:00:00')
              const dayName    = d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()
              const dayNum     = d.getDate()
              const active     = hasVacant || hasMine

              return (
                <button
                  key={date}
                  onClick={() => selectDate(date)}
                  style={{
                    padding: '9px 4px 8px',
                    background: isSelected ? '#E8DEFA' : 'transparent',
                    border: isSelected
                      ? 'none'
                      : hasMine
                        ? '1px solid rgba(232,222,250,0.22)'
                        : hasVacant
                          ? '1px solid rgba(232,222,250,0.12)'
                          : '1px solid rgba(232,222,250,0.06)',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    position: 'relative',
                    transition: 'background 0.12s',
                    outline: 'none',
                    minWidth: 0,
                  }}
                >
                  <span style={{
                    fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em',
                    color: isSelected ? '#141414' : active ? 'rgba(232,222,250,0.45)' : 'rgba(232,222,250,0.18)',
                  }}>
                    {dayName}
                  </span>
                  <span style={{
                    fontFamily: SANS, fontSize: isMobile ? 13 : 15,
                    fontWeight: isSelected ? 700 : active ? 600 : 400,
                    lineHeight: 1,
                    color: isSelected ? '#0a0a0a' : active ? 'rgba(232,222,250,0.8)' : 'rgba(232,222,250,0.2)',
                  }}>
                    {dayNum}
                  </span>
                  {/* Today dot */}
                  {isToday && !isSelected && (
                    <div style={{
                      width: 3, height: 3, borderRadius: '50%',
                      background: active ? 'rgba(232,222,250,0.5)' : 'rgba(232,222,250,0.15)',
                    }} />
                  )}
                  {/* Booking indicator */}
                  {hasMine && !isSelected && (
                    <div style={{
                      position: 'absolute', top: 5, right: 6,
                      width: 4, height: 4, borderRadius: '50%',
                      background: '#E8DEFA',
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Selected day view */}
      <div style={{ maxWidth: 600 }}>

        {/* Day heading */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.65)' }}>
            {fmtDateShort(selectedDate)}
          </span>
          {dayFull && chipSlots.some(e => e.kind === 'vacant') && (
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)' }}>
              · 2/2 booked
            </span>
          )}
          {chipSlots.length === 0 && dayEntries.length === 0 && (
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)' }}>
              · Studio closed
            </span>
          )}
        </div>

        {/* Block notices */}
        {dayBlockNotices.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {dayBlockNotices.map((b, i) => (
              <span
                key={i}
                style={{
                  fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em',
                  color: 'rgba(232,222,250,0.3)',
                  border: '1px solid rgba(232,222,250,0.08)',
                  padding: '4px 10px',
                }}
              >
                {b.kind === 'masterclass' ? 'Masterclass' : 'Class'} · {fmt12(b.start)} – {fmt12(b.end)}
              </span>
            ))}
          </div>
        )}

        {/* Time chips */}
        {chipSlots.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: 6,
            marginBottom: 16,
          }}>
            {chipSlots.map(entry => {
              if (entry.kind === 'practice') {
                const { myBooking, session } = entry
                const isCancelConfirming = cancellingBookingId === myBooking.id
                const isCancelling       = cancellingId === myBooking.id
                const within24h          = !canCancel(session.session_date, session.start_time)
                return (
                  <button
                    key={`mine-${myBooking.id}`}
                    onClick={() => {
                      if (within24h) return
                      if (isCancelConfirming) {
                        setCancellingBookingId(null)
                      } else {
                        setCancellingBookingId(myBooking.id)
                        setConfirmingVacantKey(null)
                      }
                    }}
                    title={within24h ? 'Inside 24h cancellation window' : 'Click to cancel'}
                    style={{
                      background: isCancelConfirming ? 'rgba(220,60,60,0.1)' : 'rgba(232,222,250,0.08)',
                      border: `1px solid ${isCancelConfirming ? 'rgba(220,60,60,0.35)' : '#E8DEFA'}`,
                      padding: '11px 6px 9px',
                      fontFamily: MONO, fontSize: 12, letterSpacing: '0.02em',
                      color: isCancelConfirming ? 'rgba(255,120,100,0.75)' : '#E8DEFA',
                      cursor: within24h ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      outline: 'none',
                      transition: 'background 0.12s, border-color 0.12s',
                    }}
                  >
                    <span>{fmtCompact(entry.start)}</span>
                    <span style={{
                      fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: isCancelConfirming
                        ? 'rgba(255,120,100,0.5)'
                        : within24h
                          ? 'rgba(232,222,250,0.25)'
                          : 'rgba(232,222,250,0.4)',
                    }}>
                      {isCancelling ? '…' : within24h ? 'yours' : 'yours ×'}
                    </span>
                  </button>
                )
              }

              // kind === 'vacant'
              const key          = `${entry.date}|${entry.start}`
              const isConfirming = confirmingVacantKey === key
              const isBooking    = bookingVacantKey === key
              const wasBooked    = bookedVacantKey === key
              return (
                <button
                  key={`vacant-${key}`}
                  onClick={() => {
                    if (dayFull || isBooking || wasBooked) return
                    if (isConfirming) {
                      setConfirmingVacantKey(null)
                    } else {
                      setConfirmingVacantKey(key)
                      setCancellingBookingId(null)
                      setBookingError(null)
                    }
                  }}
                  disabled={dayFull || isBooking}
                  style={{
                    background: wasBooked
                      ? 'rgba(232,222,250,0.08)'
                      : isConfirming
                        ? 'rgba(232,222,250,0.05)'
                        : 'transparent',
                    border: `1px solid ${
                      wasBooked || isConfirming
                        ? '#E8DEFA'
                        : dayFull
                          ? 'rgba(232,222,250,0.07)'
                          : 'rgba(232,222,250,0.16)'
                    }`,
                    padding: '11px 6px 9px',
                    fontFamily: MONO, fontSize: 12, letterSpacing: '0.02em',
                    color: wasBooked || isConfirming
                      ? '#E8DEFA'
                      : dayFull
                        ? 'rgba(232,222,250,0.18)'
                        : 'rgba(232,222,250,0.65)',
                    cursor: dayFull || isBooking || wasBooked ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    outline: 'none',
                    transition: 'background 0.12s, border-color 0.12s',
                  }}
                >
                  <span>{isBooking ? '…' : wasBooked ? '✓' : fmtCompact(entry.start)}</span>
                  {wasBooked && (
                    <span style={{ fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)' }}>
                      booked
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ) : dayEntries.length > 0 ? (
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)', paddingTop: 4, marginBottom: 16 }}>
            No available slots this day
          </div>
        ) : (
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.15)', paddingTop: 4, marginBottom: 16 }}>
            Studio closes at 8 PM
          </div>
        )}

        {/* Book confirmation panel */}
        {confirmingSlot && (
          <div style={{
            padding: '14px 16px',
            border: '1px solid rgba(232,222,250,0.2)',
            background: 'rgba(232,222,250,0.03)',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 14, color: 'rgba(232,222,250,0.8)', marginBottom: 14, fontFamily: SANS }}>
              Book{' '}
              <strong style={{ color: '#E8DEFA' }}>
                {fmt12(confirmingSlot.start)} – {fmt12(confirmingSlot.end)}
              </strong>
              {' '}on {fmtDateShort(selectedDate)}?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmingVacantKey(null)}
                style={{
                  background: 'none', border: '1px solid rgba(232,222,250,0.12)',
                  padding: '7px 14px', fontFamily: MONO, fontSize: 9,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(232,222,250,0.35)', cursor: 'pointer',
                }}
              >
                Nevermind
              </button>
              <button
                onClick={() => handleBook({ date: confirmingSlot.date, start: confirmingSlot.start, end: confirmingSlot.end })}
                disabled={!!bookingVacantKey}
                style={{
                  background: '#E8DEFA', border: 'none', padding: '7px 20px',
                  fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#0a0a0a', fontWeight: 700,
                  cursor: bookingVacantKey ? 'wait' : 'pointer',
                  opacity: bookingVacantKey ? 0.6 : 1,
                }}
              >
                {bookingVacantKey ? '…' : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {/* Cancel confirmation panel */}
        {cancellingBookingId && cancellingBooking && (
          <div style={{
            padding: '14px 16px',
            border: '1px solid rgba(220,60,60,0.2)',
            background: 'rgba(220,60,60,0.04)',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 14, color: 'rgba(232,222,250,0.8)', marginBottom: 14, fontFamily: SANS }}>
              Cancel{' '}
              <strong style={{ color: '#E8DEFA' }}>
                {fmt12(cancellingBooking.session?.start_time ?? '')} – {fmt12(cancellingBooking.session?.end_time ?? '')}
              </strong>
              {' '}on {fmtDateShort(selectedDate)}?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setCancellingBookingId(null)}
                style={{
                  background: 'none', border: '1px solid rgba(232,222,250,0.12)',
                  padding: '7px 14px', fontFamily: MONO, fontSize: 9,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(232,222,250,0.35)', cursor: 'pointer',
                }}
              >
                Keep it
              </button>
              <button
                onClick={() => handleCancel(cancellingBooking)}
                disabled={!!cancellingId}
                style={{
                  background: 'rgba(220,60,60,0.15)', border: '1px solid rgba(220,60,60,0.3)',
                  padding: '7px 20px', fontFamily: MONO, fontSize: 9,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(255,120,100,0.8)',
                  cursor: cancellingId ? 'wait' : 'pointer',
                  opacity: cancellingId ? 0.6 : 1,
                }}
              >
                {cancellingId ? '…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        )}

      </div>

      <WaveformStyle />
    </div>
  )
}

function ErrorBanner({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  return (
    <div style={{
      background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.22)',
      padding: '12px 16px', marginBottom: 24, maxWidth: 640,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,120,100,0.6)', paddingTop: 2 }}>Error</span>
      <span style={{ fontSize: 13, color: 'rgba(255,120,100,0.85)', lineHeight: 1.6, flex: 1 }}>{msg}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,120,100,0.4)', fontFamily: MONO, fontSize: 10, padding: 0, paddingTop: 1 }}>✕</button>
    </div>
  )
}

function WaveformStyle() {
  return (
    <style>{`
      @keyframes practice-wave-pulse {
        0%, 100% { transform: scaleY(0.4); }
        50%       { transform: scaleY(1); }
      }
      .practice-wave-bar { animation: practice-wave-pulse 1s ease-in-out infinite; transform-origin: bottom; }
    `}</style>
  )
}
