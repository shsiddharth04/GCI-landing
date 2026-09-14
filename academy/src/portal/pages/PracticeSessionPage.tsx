import { useState, useEffect, useCallback } from 'react'
import type { EnrolledStudent, Session, PracticeBooking } from '../../lib/db'
import { fetchPracticeSlots, fetchMyPracticeBookings, bookPracticeSlot, cancelPracticeBooking } from '../../lib/db'
import { supabase } from '../../lib/supabase'

interface Props { student: EnrolledStudent }

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

function fmt12(t: string): string {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function fmtDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function fmtDateTime(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function isBlockActive(blockedUntil: string | null): boolean {
  return !!blockedUntil && new Date(blockedUntil) > new Date()
}

function canCancel(sessionDate: string | undefined, startTime: string | undefined): boolean {
  if (!sessionDate || !startTime) return false
  const slotStart = new Date(`${sessionDate}T${startTime}`)
  return slotStart.getTime() - Date.now() > 24 * 60 * 60 * 1000
}

function WaveformBars({ dim = false }: { dim?: boolean }) {
  const heights = [0.2, 0.6, 1.0, 0.45, 0.8, 0.35, 0.9, 0.5, 0.7, 0.3, 0.85, 0.55, 0.75, 0.4, 0.65]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 40 }}>
      {heights.map((h, i) => (
        <div key={i} className="practice-wave-bar" style={{
          width: 3,
          background: dim ? 'rgba(232,222,250,0.08)' : 'rgba(232,222,250,0.22)',
          borderRadius: 2,
          height: `${h * 100}%`,
          animationDelay: `${i * 0.1}s`,
          animationDuration: `${0.9 + (i % 3) * 0.3}s`,
        }} />
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em',
      textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)',
    }}>
      {children}
    </span>
  )
}

export default function PracticeSessionPage({ student }: Props) {
  const [slots, setSlots] = useState<Session[]>([])
  const [myBookings, setMyBookings] = useState<PracticeBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [confirmingSlotId, setConfirmingSlotId] = useState<string | null>(null)
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookedSlotId, setBookedSlotId] = useState<string | null>(null)

  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const isLocked = student.practice_access_mode !== 'unlocked'
  const isBlocked = isBlockActive(student.blocked_until)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const [slotsData, bookingsData] = await Promise.all([
        fetchPracticeSlots(),
        fetchMyPracticeBookings(),
      ])
      setSlots(slotsData)
      setMyBookings(bookingsData)
    } catch {
      setLoadError('Failed to load. Refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLocked && !isBlocked) {
      load()
    } else {
      setLoading(false)
    }
  }, [isLocked, isBlocked, load])

  async function handleBook(slot: Session) {
    setBookingSlotId(slot.id)
    setBookingError(null)
    try {
      const result = await bookPracticeSlot(slot.id, student.id)
      if (result.error) {
        const MESSAGES: Record<string, string> = {
          slot_taken:        'This slot was just taken. Refresh to see what\'s available.',
          slot_full:         'This slot is full.',
          daily_cap_reached: 'You\'ve already booked 2 sessions on this day.',
          access_locked:     'Practice booking isn\'t unlocked for your account.',
          noshowblock:       'Your practice access is blocked. Contact your instructor.',
          student_not_found: 'Account error. Refresh and try again.',
        }
        setBookingError(MESSAGES[result.error] ?? `Booking failed (${result.error}).`)
        setConfirmingSlotId(null)
        return
      }

      supabase.functions.invoke('send-practice-email', {
        body: {
          booking_id:    result.booking_id,
          type:          'confirmed',
          student_name:  student.name,
          student_email: student.email,
          slot_date:     slot.session_date,
          slot_start:    slot.start_time.slice(0, 5),
          slot_end:      slot.end_time.slice(0, 5),
        },
      }).catch(() => {})

      setConfirmingSlotId(null)
      setBookedSlotId(slot.id)
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
        const MESSAGES: Record<string, string> = {
          inside_24h_window:            'This slot starts within 24 hours. Cancellation window is closed.',
          invalid_or_already_cancelled: 'This booking is already cancelled.',
        }
        setCancelError(MESSAGES[result.error] ?? `Cancellation failed (${result.error}).`)
        setCancellingBookingId(null)
        return
      }

      supabase.functions.invoke('send-practice-email', {
        body: {
          booking_id:    booking.id,
          type:          'cancelled',
          student_name:  student.name,
          student_email: student.email,
          slot_date:     booking.session?.session_date ?? '',
          slot_start:    booking.session?.start_time?.slice(0, 5) ?? '',
          slot_end:      booking.session?.end_time?.slice(0, 5) ?? '',
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

  // Compute per-date booked count from current bookings (for UI hint)
  const bookedPerDate = new Map<string, number>()
  for (const b of myBookings) {
    const d = b.session?.session_date
    if (d) bookedPerDate.set(d, (bookedPerDate.get(d) ?? 0) + 1)
  }

  // Group slots by date
  const slotsByDate = new Map<string, Session[]>()
  for (const s of slots) {
    slotsByDate.set(s.session_date, [...(slotsByDate.get(s.session_date) ?? []), s])
  }

  const pad = '32px 28px 28px'
  const sectionGap: React.CSSProperties = { marginBottom: 40 }

  // ── Locked state ─────────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div style={{ padding: pad, fontFamily: SANS }}>
        <div style={{ marginBottom: 28 }}>
          <WaveformBars dim />
        </div>

        <Label>Practice · Locked</Label>

        <h1 style={{
          fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(24px, 5vw, 36px)',
          color: '#E8DEFA', letterSpacing: '-0.02em', lineHeight: 1.15,
          margin: '16px 0 20px',
        }}>
          Keep showing up.
        </h1>

        <p style={{
          fontSize: 15, color: 'rgba(232,222,250,0.55)', lineHeight: 1.75,
          margin: '0 0 40px', maxWidth: 420,
        }}>
          Practice booking opens after your 6th class.
        </p>

        <div style={{
          borderTop: '1px solid rgba(232,222,250,0.08)',
          paddingTop: 24,
        }}>
          <Label>Practice · Locked</Label>
        </div>

        <style>{`
          @keyframes practice-wave-pulse {
            0%, 100% { transform: scaleY(0.4); }
            50% { transform: scaleY(1); }
          }
          .practice-wave-bar { animation: practice-wave-pulse 1s ease-in-out infinite; transform-origin: bottom; }
        `}</style>
      </div>
    )
  }

  // ── Blocked state ─────────────────────────────────────────────────────────────
  if (isBlocked) {
    return (
      <div style={{ padding: pad, fontFamily: SANS }}>
        <div style={{ marginBottom: 28 }}>
          <WaveformBars dim />
        </div>

        <Label>Practice · Blocked</Label>

        <h1 style={{
          fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(24px, 5vw, 36px)',
          color: '#E8DEFA', letterSpacing: '-0.02em', lineHeight: 1.15,
          margin: '16px 0 20px',
        }}>
          Access blocked.
        </h1>

        <p style={{
          fontSize: 15, color: 'rgba(232,222,250,0.55)', lineHeight: 1.75,
          margin: '0 0 12px', maxWidth: 420,
        }}>
          You missed a session without cancelling in advance. Booking access is blocked until:
        </p>

        <p style={{
          fontFamily: MONO, fontSize: 13, color: '#E8DEFA',
          letterSpacing: '0.04em', margin: '0 0 40px',
        }}>
          {fmtDateTime(student.blocked_until!)}
        </p>

        <div style={{ borderTop: '1px solid rgba(232,222,250,0.08)', paddingTop: 24 }}>
          <p style={{
            fontSize: 13, color: 'rgba(232,222,250,0.35)', lineHeight: 1.7, margin: 0,
          }}>
            Once the block expires, booking opens automatically. Contact your instructor if you think this was an error.
          </p>
        </div>

        <style>{`
          @keyframes practice-wave-pulse {
            0%, 100% { transform: scaleY(0.4); }
            50% { transform: scaleY(1); }
          }
          .practice-wave-bar { animation: practice-wave-pulse 1s ease-in-out infinite; transform-origin: bottom; }
        `}</style>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: pad, fontFamily: SANS }}>
        <Label>Loading...</Label>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ padding: pad, fontFamily: SANS }}>
        <p style={{ color: 'rgba(255,120,100,0.8)', fontSize: 14 }}>{loadError}</p>
      </div>
    )
  }

  // ── Unlocked ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: pad, fontFamily: SANS }}>

      {/* Page header */}
      <div style={{ marginBottom: 40 }}>
        <WaveformBars />
        <h1 style={{
          fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(24px, 5vw, 36px)',
          color: '#E8DEFA', letterSpacing: '-0.02em', lineHeight: 1.15,
          margin: '20px 0 8px',
        }}>
          Book a practice slot.
        </h1>
        <p style={{
          fontSize: 14, color: 'rgba(232,222,250,0.45)', lineHeight: 1.7,
          margin: 0, fontFamily: MONO, letterSpacing: '0.04em',
        }}>
          Max 2 sessions per day. Cancel at least 24 hours in advance.
        </p>
      </div>

      {/* Booking error banner */}
      {bookingError && (
        <div style={{
          background: 'rgba(220,60,60,0.12)', border: '1px solid rgba(220,60,60,0.25)',
          borderRadius: 4, padding: '14px 18px', marginBottom: 28,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,120,100,0.7)', paddingTop: 2 }}>
            ERROR
          </span>
          <span style={{ fontSize: 14, color: 'rgba(255,120,100,0.9)', lineHeight: 1.6 }}>{bookingError}</span>
          <button
            onClick={() => setBookingError(null)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,120,100,0.5)', fontFamily: MONO, fontSize: 10, padding: 0,
              paddingTop: 2,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Cancel error banner */}
      {cancelError && (
        <div style={{
          background: 'rgba(220,60,60,0.12)', border: '1px solid rgba(220,60,60,0.25)',
          borderRadius: 4, padding: '14px 18px', marginBottom: 28,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,120,100,0.7)', paddingTop: 2 }}>
            ERROR
          </span>
          <span style={{ fontSize: 14, color: 'rgba(255,120,100,0.9)', lineHeight: 1.6 }}>{cancelError}</span>
          <button
            onClick={() => setCancelError(null)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,120,100,0.5)', fontFamily: MONO, fontSize: 10, padding: 0,
              paddingTop: 2,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Upcoming bookings */}
      {myBookings.length > 0 && (
        <div style={sectionGap}>
          <div style={{
            fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)',
            marginBottom: 16,
          }}>
            Your upcoming sessions — {myBookings.length}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myBookings.map(booking => {
              const s = booking.session
              const cancellable = canCancel(s?.session_date, s?.start_time)
              const isConfirmingCancel = cancellingBookingId === booking.id
              const isCancelling = cancellingId === booking.id

              return (
                <div key={booking.id} style={{
                  background: '#141414',
                  border: '1px solid rgba(232,222,250,0.08)',
                  borderRadius: 6, padding: '18px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#E8DEFA', fontSize: 14, marginBottom: 4 }}>
                        {s ? fmtDate(s.session_date) : '—'}
                      </div>
                      {s && (
                        <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,222,250,0.5)', letterSpacing: '0.05em' }}>
                          {fmt12(s.start_time)} — {fmt12(s.end_time)}
                        </div>
                      )}
                    </div>

                    {/* Cancel controls */}
                    {cancellable && !isConfirmingCancel && (
                      <button
                        onClick={() => setCancellingBookingId(booking.id)}
                        disabled={isCancelling}
                        style={{
                          background: 'none', border: '1px solid rgba(232,222,250,0.15)',
                          borderRadius: 4, padding: '7px 14px',
                          fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                          textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)',
                          cursor: isCancelling ? 'wait' : 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {isCancelling ? '...' : 'Cancel'}
                      </button>
                    )}

                    {!cancellable && (
                      <span style={{
                        fontFamily: MONO, fontSize: 9, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)',
                        paddingTop: 4, flexShrink: 0,
                      }}>
                        Inside 24h
                      </span>
                    )}
                  </div>

                  {/* Inline cancel confirm */}
                  {isConfirmingCancel && (
                    <div style={{
                      marginTop: 16, paddingTop: 16,
                      borderTop: '1px solid rgba(232,222,250,0.06)',
                      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                    }}>
                      <span style={{ fontSize: 13, color: 'rgba(232,222,250,0.55)' }}>
                        Cancel this slot? This frees it for others.
                      </span>
                      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                        <button
                          onClick={() => setCancellingBookingId(null)}
                          style={{
                            background: 'none', border: '1px solid rgba(232,222,250,0.12)',
                            borderRadius: 4, padding: '7px 16px',
                            fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)',
                            cursor: 'pointer',
                          }}
                        >
                          Keep it
                        </button>
                        <button
                          onClick={() => handleCancel(booking)}
                          disabled={isCancelling}
                          style={{
                            background: 'rgba(220,60,60,0.15)',
                            border: '1px solid rgba(220,60,60,0.3)',
                            borderRadius: 4, padding: '7px 16px',
                            fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: 'rgba(255,120,100,0.8)',
                            cursor: isCancelling ? 'wait' : 'pointer',
                          }}
                        >
                          {isCancelling ? '...' : 'Yes, cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      {myBookings.length > 0 && slots.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(232,222,250,0.06)',
          marginBottom: 36,
        }} />
      )}

      {/* Available slots */}
      {slots.length === 0 ? (
        <div style={{
          padding: '32px 0',
          borderTop: myBookings.length > 0 ? undefined : '1px solid rgba(232,222,250,0.06)',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.25)' }}>
            No slots available right now
          </div>
          <p style={{ fontSize: 14, color: 'rgba(232,222,250,0.4)', lineHeight: 1.7, margin: '12px 0 0' }}>
            Check back when new slots are added by your instructor.
          </p>
        </div>
      ) : (
        <div>
          <div style={{
            fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)',
            marginBottom: 20,
          }}>
            Available slots
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Array.from(slotsByDate.entries()).map(([date, dateSlots]) => {
              const dayCount = bookedPerDate.get(date) ?? 0
              const dayFull = dayCount >= 2

              return (
                <div key={date}>
                  {/* Date group header */}
                  <div style={{
                    fontFamily: MONO, fontSize: 10, letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: 'rgba(232,222,250,0.45)',
                    marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    {fmtDate(date)}
                    {dayFull && (
                      <span style={{ color: 'rgba(232,222,250,0.2)' }}>· 2 sessions booked</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dateSlots.map(slot => {
                      const isConfirming = confirmingSlotId === slot.id
                      const isBooking = bookingSlotId === slot.id
                      const wasBooked = bookedSlotId === slot.id

                      return (
                        <div key={slot.id} style={{
                          background: wasBooked ? 'rgba(232,222,250,0.06)' : '#141414',
                          border: wasBooked
                            ? '1px solid rgba(232,222,250,0.2)'
                            : '1px solid rgba(232,222,250,0.08)',
                          borderRadius: 6, padding: '16px 20px',
                          transition: 'background 0.2s, border-color 0.2s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                            <div style={{
                              fontFamily: MONO, fontSize: 13, color: wasBooked ? '#E8DEFA' : 'rgba(232,222,250,0.7)',
                              letterSpacing: '0.05em',
                            }}>
                              {fmt12(slot.start_time)} — {fmt12(slot.end_time)}
                            </div>

                            {wasBooked ? (
                              <span style={{
                                fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#0a0a0a', background: '#E8DEFA',
                                padding: '4px 10px', borderRadius: 2,
                              }}>
                                Booked
                              </span>
                            ) : dayFull ? (
                              <span style={{
                                fontFamily: MONO, fontSize: 9, letterSpacing: '0.15em',
                                textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)',
                              }}>
                                Day full
                              </span>
                            ) : !isConfirming ? (
                              <button
                                onClick={() => {
                                  setConfirmingSlotId(slot.id)
                                  setBookingError(null)
                                }}
                                style={{
                                  background: '#E8DEFA', border: 'none', borderRadius: 4,
                                  padding: '8px 20px', fontFamily: MONO, fontSize: 10,
                                  letterSpacing: '0.12em', textTransform: 'uppercase',
                                  color: '#0a0a0a', fontWeight: 700, cursor: 'pointer',
                                  flexShrink: 0,
                                }}
                              >
                                Book
                              </button>
                            ) : null}
                          </div>

                          {/* Inline booking confirm */}
                          {isConfirming && (
                            <div style={{
                              marginTop: 14, paddingTop: 14,
                              borderTop: '1px solid rgba(232,222,250,0.06)',
                              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                            }}>
                              <span style={{ fontSize: 13, color: 'rgba(232,222,250,0.5)', flexGrow: 1 }}>
                                Book this slot?
                              </span>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => setConfirmingSlotId(null)}
                                  style={{
                                    background: 'none', border: '1px solid rgba(232,222,250,0.12)',
                                    borderRadius: 4, padding: '7px 16px',
                                    fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                                    textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Nevermind
                                </button>
                                <button
                                  onClick={() => handleBook(slot)}
                                  disabled={isBooking}
                                  style={{
                                    background: '#E8DEFA', border: 'none', borderRadius: 4,
                                    padding: '7px 20px', fontFamily: MONO, fontSize: 10,
                                    letterSpacing: '0.12em', textTransform: 'uppercase',
                                    color: '#0a0a0a', fontWeight: 700,
                                    cursor: isBooking ? 'wait' : 'pointer',
                                    opacity: isBooking ? 0.6 : 1,
                                  }}
                                >
                                  {isBooking ? '...' : 'Confirm'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes practice-wave-pulse {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        .practice-wave-bar { animation: practice-wave-pulse 1s ease-in-out infinite; transform-origin: bottom; }
      `}</style>
    </div>
  )
}
