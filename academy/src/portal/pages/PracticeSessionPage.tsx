import { useState, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import type { EnrolledStudent, Session, PracticeBooking, CourseClassBlock } from '../../lib/db'
import {
  fetchSessionsForCalendar, fetchCourseBlocksForRange,
  fetchMyPracticeBookings, bookPracticeSlot, cancelPracticeBooking,
  ensurePracticeSlots,
} from '../../lib/db'
import { supabase } from '../../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'

interface Props { student: EnrolledStudent }

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"
const STUDIO = '11th Floor, Capital Tower, Sector 20, Gurugram'

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmt12(t: string): string {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function fmtDateHeading(d: string): string {
  const date = new Date(d + 'T00:00:00')
  const day   = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()
  const wd    = date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()
  return `${wd} ${day} ${month}`
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
  const day = d.getDay() // 0=Sun, 1=Mon...
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function calendarWeekStarts(): string[] {
  const thisMonday = getWeekMonday(new Date())
  const nextMonday = new Date(thisMonday)
  nextMonday.setDate(nextMonday.getDate() + 7)
  return [thisMonday.toISOString().slice(0, 10), nextMonday.toISOString().slice(0, 10)]
}

function calendarWindow(): { from: string; to: string } {
  const thisMonday = getWeekMonday(new Date())
  const nextSunday = new Date(thisMonday)
  nextSunday.setDate(nextSunday.getDate() + 13) // Mon + 13 = Sunday of next week
  return {
    from: new Date().toISOString().slice(0, 10),
    to:   nextSunday.toISOString().slice(0, 10),
  }
}

// ── Calendar entry types ───────────────────────────────────────────────────────

type CalEntry =
  | { kind: 'course';     date: string; start: string; end: string; label: string | null }
  | { kind: 'masterclass'; date: string; start: string; end: string; sessionId: string }
  | { kind: 'practice';   date: string; start: string; end: string; session: Session; myBooking: PracticeBooking | null }

function buildCalendar(
  sessions: Session[],
  courseBlocks: CourseClassBlock[],
  myBookings: PracticeBooking[],
): Map<string, CalEntry[]> {
  const byBookingSession = new Map<string, PracticeBooking>()
  for (const b of myBookings) byBookingSession.set(b.session_id, b)

  const entries: CalEntry[] = []

  for (const s of sessions) {
    if (s.session_type === 'masterclass') {
      entries.push({ kind: 'masterclass', date: s.session_date, start: s.start_time, end: s.end_time, sessionId: s.id })
    } else if (s.session_type === 'practice_session') {
      entries.push({ kind: 'practice', date: s.session_date, start: s.start_time, end: s.end_time, session: s, myBooking: byBookingSession.get(s.id) ?? null })
    }
  }

  for (const b of courseBlocks) {
    entries.push({ kind: 'course', date: b.block_date, start: b.start_time, end: b.end_time, label: b.label })
  }

  // Sort within each date by start_time
  entries.sort((a, b) =>
    a.date !== b.date
      ? a.date.localeCompare(b.date)
      : a.start.localeCompare(b.start)
  )

  const grouped = new Map<string, CalEntry[]>()
  for (const e of entries) {
    grouped.set(e.date, [...(grouped.get(e.date) ?? []), e])
  }
  return grouped
}

// ── Waveform decoration ────────────────────────────────────────────────────────

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

// ── Entry cards ────────────────────────────────────────────────────────────────

function TypeTag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 8, letterSpacing: '0.2em',
      textTransform: 'uppercase', color, flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

function CourseEntry({ entry }: { entry: Extract<CalEntry, { kind: 'course' }> }) {
  return (
    <div style={{
      background: 'rgba(232,222,250,0.02)',
      borderLeft: '2px solid rgba(232,222,250,0.08)',
      padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <TypeTag label="Course class" color="rgba(232,222,250,0.2)" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(232,222,250,0.35)', letterSpacing: '0.04em' }}>
          {fmt12(entry.start)} — {fmt12(entry.end)}
        </span>
        {entry.label && (
          <>
            <span style={{ color: 'rgba(232,222,250,0.15)', fontFamily: MONO, fontSize: 10 }}>·</span>
            <span style={{ fontSize: 12, color: 'rgba(232,222,250,0.3)', fontFamily: SANS }}>
              {entry.label}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function MasterclassEntry({ entry }: { entry: Extract<CalEntry, { kind: 'masterclass' }> }) {
  return (
    <div style={{
      background: 'rgba(232,222,250,0.03)',
      borderLeft: '2px solid rgba(232,222,250,0.15)',
      padding: '12px 16px',
    }}>
      <div style={{ marginBottom: 4 }}>
        <TypeTag label="Masterclass" color="rgba(232,222,250,0.35)" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MapPin size={10} style={{ color: 'rgba(232,222,250,0.3)', flexShrink: 0 }} />
        <span style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(232,222,250,0.45)', letterSpacing: '0.04em' }}>
          {fmt12(entry.start)} — {fmt12(entry.end)}
        </span>
      </div>
    </div>
  )
}

interface PracticeEntryProps {
  entry: Extract<CalEntry, { kind: 'practice' }>
  bookedOnDate: number
  confirmingSlotId: string | null
  bookingSlotId: string | null
  bookedSlotId: string | null
  cancellingBookingId: string | null
  cancellingId: string | null
  onConfirmBook: (sessionId: string) => void
  onCancelConfirm: () => void
  onBook: (session: Session) => void
  onConfirmCancel: (bookingId: string) => void
  onKeepCancel: () => void
  onCancel: (booking: PracticeBooking) => void
}

function PracticeEntry({
  entry, bookedOnDate,
  confirmingSlotId, bookingSlotId, bookedSlotId,
  cancellingBookingId, cancellingId,
  onConfirmBook, onCancelConfirm, onBook,
  onConfirmCancel, onKeepCancel, onCancel,
}: PracticeEntryProps) {
  const { session, myBooking } = entry
  const isConfirmingBook   = confirmingSlotId === session.id
  const isBooking          = bookingSlotId === session.id
  const wasBooked          = bookedSlotId === session.id
  const isConfirmingCancel = myBooking !== null && cancellingBookingId === myBooking.id
  const isCancelling       = myBooking !== null && cancellingId === myBooking.id

  const available  = session.lock_owner_type === null && session.status === 'open'
  const mine       = myBooking !== null
  const taken      = !available && !mine
  const dayFull    = bookedOnDate >= 2 && available && !mine

  let borderColor = 'rgba(232,222,250,0.1)'
  if (wasBooked || mine) borderColor = '#E8DEFA'
  else if (available && !dayFull) borderColor = 'rgba(232,222,250,0.35)'

  let bgColor = '#141414'
  if (mine || wasBooked) bgColor = 'rgba(232,222,250,0.05)'
  if (taken) bgColor = 'rgba(232,222,250,0.02)'

  return (
    <div style={{
      background: bgColor,
      borderLeft: `2px solid ${borderColor}`,
      padding: '14px 16px',
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      {/* Row 1: type + time + primary action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <TypeTag
            label={mine ? 'Practice · Your slot' : taken ? 'Practice · Taken' : 'Practice'}
            color={mine ? '#E8DEFA' : taken ? 'rgba(232,222,250,0.2)' : 'rgba(232,222,250,0.7)'}
          />
          <span style={{ fontFamily: MONO, fontSize: 13, color: mine ? 'rgba(232,222,250,0.85)' : taken ? 'rgba(232,222,250,0.3)' : 'rgba(232,222,250,0.7)', letterSpacing: '0.04em' }}>
            {fmt12(entry.start)} — {fmt12(entry.end)}
          </span>
        </div>

        <div style={{ flexShrink: 0 }}>
          {wasBooked && (
            <span style={{
              fontFamily: MONO, fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#0a0a0a', background: '#E8DEFA', padding: '4px 10px',
            }}>
              Booked
            </span>
          )}

          {!wasBooked && mine && !isConfirmingCancel && canCancel(session.session_date, session.start_time) && (
            <button
              onClick={() => onConfirmCancel(myBooking!.id)}
              disabled={isCancelling}
              style={{
                background: 'none', border: '1px solid rgba(232,222,250,0.15)',
                padding: '6px 14px', fontFamily: MONO, fontSize: 9,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(232,222,250,0.4)', cursor: isCancelling ? 'wait' : 'pointer',
              }}
            >
              {isCancelling ? '…' : 'Cancel'}
            </button>
          )}

          {!wasBooked && mine && !canCancel(session.session_date, session.start_time) && (
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)' }}>
              Inside 24h
            </span>
          )}

          {!mine && !taken && !isConfirmingBook && !wasBooked && (
            dayFull ? (
              <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)' }}>
                Day full
              </span>
            ) : (
              <button
                onClick={() => onConfirmBook(session.id)}
                style={{
                  background: '#E8DEFA', border: 'none', padding: '7px 18px',
                  fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#0a0a0a', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Book
              </button>
            )
          )}
        </div>
      </div>

      {/* Inline: booking confirm */}
      {isConfirmingBook && (
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(232,222,250,0.06)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(232,222,250,0.5)', flexGrow: 1 }}>
            Book this slot?
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onCancelConfirm}
              style={{
                background: 'none', border: '1px solid rgba(232,222,250,0.12)',
                padding: '6px 14px', fontFamily: MONO, fontSize: 9,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(232,222,250,0.35)', cursor: 'pointer',
              }}
            >
              Nevermind
            </button>
            <button
              onClick={() => onBook(session)}
              disabled={isBooking}
              style={{
                background: '#E8DEFA', border: 'none', padding: '6px 18px',
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#0a0a0a', fontWeight: 700,
                cursor: isBooking ? 'wait' : 'pointer', opacity: isBooking ? 0.6 : 1,
              }}
            >
              {isBooking ? '…' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Inline: cancel confirm */}
      {isConfirmingCancel && (
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(232,222,250,0.06)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(232,222,250,0.5)', flexGrow: 1 }}>
            Cancel this slot?
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onKeepCancel}
              style={{
                background: 'none', border: '1px solid rgba(232,222,250,0.12)',
                padding: '6px 14px', fontFamily: MONO, fontSize: 9,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(232,222,250,0.35)', cursor: 'pointer',
              }}
            >
              Keep it
            </button>
            <button
              onClick={() => onCancel(myBooking!)}
              disabled={isCancelling}
              style={{
                background: 'rgba(220,60,60,0.15)', border: '1px solid rgba(220,60,60,0.3)',
                padding: '6px 18px', fontFamily: MONO, fontSize: 9,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(255,120,100,0.8)', cursor: isCancelling ? 'wait' : 'pointer',
              }}
            >
              {isCancelling ? '…' : 'Yes, cancel'}
            </button>
          </div>
        </div>
      )}
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

  const [confirmingSlotId, setConfirmingSlotId]   = useState<string | null>(null)
  const [bookingSlotId, setBookingSlotId]         = useState<string | null>(null)
  const [bookedSlotId, setBookedSlotId]           = useState<string | null>(null)
  const [bookingError, setBookingError]           = useState<string | null>(null)

  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId]               = useState<string | null>(null)
  const [cancelError, setCancelError]                 = useState<string | null>(null)

  const isLocked  = student.practice_access_mode !== 'unlocked'
  const isBlocked = isBlockActive(student.blocked_until)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      // Materialize practice slots for this week + next week before fetching calendar.
      // Non-fatal: if the RPC fails, the calendar still loads with whatever slots exist.
      await ensurePracticeSlots(calendarWeekStarts()).catch(() => {})
      const { from, to } = calendarWindow()
      const [sessions, courseBlocks, bookings] = await Promise.all([
        fetchSessionsForCalendar(from, to),
        fetchCourseBlocksForRange(student.cohort, from, to),
        fetchMyPracticeBookings(),
      ])
      setCalendar(buildCalendar(sessions, courseBlocks, bookings))
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

  async function handleBook(session: Session) {
    setBookingSlotId(session.id)
    setBookingError(null)
    try {
      const result = await bookPracticeSlot(session.id, student.id)
      if (result.error) {
        const MSGS: Record<string, string> = {
          slot_taken:        'This slot was just taken — someone booked it first.',
          slot_full:         'This slot is full.',
          daily_cap_reached: 'You\'ve already booked 2 sessions on this day.',
          access_locked:     'Practice booking isn\'t unlocked for your account.',
          noshowblock:       'Your practice access is blocked. Contact your instructor.',
          student_not_found: 'Account error. Refresh and try again.',
        }
        setBookingError(MSGS[result.error] ?? `Booking failed (${result.error}).`)
        setConfirmingSlotId(null)
        return
      }
      supabase.functions.invoke('send-practice-email', {
        body: { booking_id: result.booking_id, type: 'confirmed',
          student_name: student.name, student_email: student.email,
          slot_date: session.session_date,
          slot_start: session.start_time.slice(0, 5),
          slot_end:   session.end_time.slice(0, 5),
        },
      }).catch(() => {})
      setConfirmingSlotId(null)
      setBookedSlotId(session.id)
      await load()
      setTimeout(() => setBookedSlotId(null), 4000)
    } catch {
      setBookingError('Something went wrong. Try again.')
      setConfirmingSlotId(null)
    } finally {
      setBookingSlotId(null)
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
        body: { booking_id: booking.id, type: 'cancelled',
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
    padding: isMobile ? '24px 20px 48px' : '48px 56px',
    fontFamily: SANS, minHeight: '100vh',
  }

  // ── Locked ──────────────────────────────────────────────────────────────────
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

  // ── Blocked ─────────────────────────────────────────────────────────────────
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

  // ── Unlocked: calendar ───────────────────────────────────────────────────────
  const calDates = Array.from(calendar.keys())

  return (
    <div style={pad}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 28 : 40 }}>
        <WaveformBars />
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.5)', margin: '20px 0 12px' }}>
          Practice
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: isMobile ? 24 : 36, fontWeight: 700, color: '#E8DEFA', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 10px' }}>
          Book a practice slot.
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(232,222,250,0.4)', lineHeight: 1.7, margin: 0, fontFamily: MONO, letterSpacing: '0.03em' }}>
          Max 2 sessions / day · Cancel 24h in advance · {STUDIO}
        </p>
      </div>

      {/* Error banners */}
      {bookingError && (
        <ErrorBanner msg={bookingError} onDismiss={() => setBookingError(null)} />
      )}
      {cancelError && (
        <ErrorBanner msg={cancelError} onDismiss={() => setCancelError(null)} />
      )}

      {/* Calendar */}
      {calDates.length === 0 ? (
        <div style={{ paddingTop: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)' }}>
            No slots this week
          </div>
          <p style={{ fontSize: 14, color: 'rgba(232,222,250,0.35)', lineHeight: 1.7, margin: '12px 0 0' }}>
            Practice slots refresh each week. Check back Sunday evening.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 28 : 36, maxWidth: 680 }}>
          {calDates.map(date => {
            const entries    = calendar.get(date)!
            const dayBooked  = bookedPerDate.get(date) ?? 0
            const hasPractice = entries.some(e => e.kind === 'practice')

            return (
              <div key={date}>
                {/* Date header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
                }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.55)' }}>
                    {fmtDateHeading(date)}
                  </span>
                  {hasPractice && dayBooked >= 2 && (
                    <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.25)' }}>
                      · 2 sessions booked
                    </span>
                  )}
                </div>

                {/* Entries */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {entries.map((entry, i) => {
                    if (entry.kind === 'course') {
                      return <CourseEntry key={i} entry={entry} />
                    }
                    if (entry.kind === 'masterclass') {
                      return <MasterclassEntry key={i} entry={entry} />
                    }
                    return (
                      <PracticeEntry
                        key={entry.session.id}
                        entry={entry}
                        bookedOnDate={dayBooked}
                        confirmingSlotId={confirmingSlotId}
                        bookingSlotId={bookingSlotId}
                        bookedSlotId={bookedSlotId}
                        cancellingBookingId={cancellingBookingId}
                        cancellingId={cancellingId}
                        onConfirmBook={id => { setConfirmingSlotId(id); setBookingError(null) }}
                        onCancelConfirm={() => setConfirmingSlotId(null)}
                        onBook={handleBook}
                        onConfirmCancel={id => setCancellingBookingId(id)}
                        onKeepCancel={() => setCancellingBookingId(null)}
                        onCancel={handleCancel}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <WaveformStyle />
    </div>
  )
}

function ErrorBanner({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  return (
    <div style={{
      background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.22)',
      padding: '12px 16px', marginBottom: 24, maxWidth: 680,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,120,100,0.6)', paddingTop: 2 }}>Error</span>
      <span style={{ fontSize: 13, color: 'rgba(255,120,100,0.85)', lineHeight: 1.6, flex: 1 }}>{msg}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,120,100,0.4)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: 0, paddingTop: 1 }}>✕</button>
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
