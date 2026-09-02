import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { fetchMyCourseSchedule } from '../../lib/db'
import type { EnrolledStudent, Session } from '../../lib/db'

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

function fmt12(t: string) {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function fmtDay(d: string) {
  const date = new Date(d + 'T00:00:00')
  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()
  return { day, month }
}

function fmtWeekday(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()
}

function SessionRow({
  session, index, isPast, isNext,
  style,
}: {
  session: Session
  index: number
  isPast: boolean
  isNext: boolean
  style?: React.CSSProperties
}) {
  const { day, month } = fmtDay(session.session_date)
  const weekday = fmtWeekday(session.session_date)

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      opacity: isPast ? 0.38 : 1,
      transition: 'opacity 150ms',
      ...style,
    }}>
      {/* Timeline column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
        <div style={{
          width: isNext ? 12 : 8, height: isNext ? 12 : 8,
          borderRadius: '50%',
          background: isNext ? '#E8DEFA' : isPast ? 'rgba(232,222,250,0.2)' : 'rgba(232,222,250,0.4)',
          flexShrink: 0,
          marginTop: 6,
          boxShadow: isNext ? '0 0 12px rgba(232,222,250,0.4)' : 'none',
        }} />
        <div style={{ flex: 1, width: 1, background: 'rgba(232,222,250,0.07)', marginTop: 6 }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1, paddingBottom: 24, paddingLeft: 16,
        borderBottom: '1px solid rgba(232,222,250,0.04)',
        marginBottom: 0,
      }}>
        {/* Date line */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: isPast ? 'rgba(232,222,250,0.4)' : '#E8DEFA', lineHeight: 1 }}>
            {day}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 13, color: 'rgba(232,222,250,0.5)' }}>
            {month}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(232,222,250,0.3)' }}>
            {weekday}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            {isNext && (
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em',
                textTransform: 'uppercase', background: '#E8DEFA',
                color: '#0a0a0a', padding: '3px 8px', fontWeight: 700,
              }}>
                Next class
              </span>
            )}
            {isPast && (
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.25)' }}>
                [Done]
              </span>
            )}
            {!isNext && !isPast && (
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)' }}>
                [Upcoming]
              </span>
            )}
          </div>
        </div>

        {/* Time + location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: 'rgba(232,222,250,0.65)' }}>
            {fmt12(session.start_time)} – {fmt12(session.end_time)}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(232,222,250,0.25)' }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={11} style={{ color: 'rgba(232,222,250,0.25)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(232,222,250,0.35)', fontFamily: SANS }}>
              {session.location}
            </span>
          </div>
        </div>

        {/* Session number */}
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', color: 'rgba(232,222,250,0.18)', marginTop: 8 }}>
          Session {String(index + 1).padStart(2, '0')}
        </div>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: 16, paddingBottom: 24 }}>
      <div style={{ width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(232,222,250,0.08)' }} />
        <div style={{ flex: 1, width: 1, background: 'rgba(232,222,250,0.04)', marginTop: 6 }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 28, width: 100, background: 'rgba(232,222,250,0.06)', borderRadius: 2 }} />
        <div style={{ height: 14, width: 180, background: 'rgba(232,222,250,0.06)', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function SchedulePage({ student }: { student: EnrolledStudent }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyCourseSchedule().then(setSessions).finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = sessions.filter(s => s.session_date >= today)
  const past = sessions.filter(s => s.session_date < today)
  const nextSession = upcoming[0]

  const completed = past.length
  const total = sessions.length

  return (
    <div style={{ padding: '48px 56px', fontFamily: SANS, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)', marginBottom: 12 }}>
          Schedule
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: 36, fontWeight: 700, color: '#E8DEFA', letterSpacing: '-0.02em', margin: '0 0 20px' }}>
          Cohort {student.cohort === 'C1' ? '1' : '2'} · Course Sessions
        </h1>

        {/* Progress */}
        {!loading && total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <div style={{ flex: 1, maxWidth: 280, height: 2, background: 'rgba(232,222,250,0.08)', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${(completed / total) * 100}%`,
                background: '#E8DEFA', transition: 'width 600ms ease',
              }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,222,250,0.4)' }}>
              {completed} / {total} complete
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: 680 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : sessions.length === 0 ? (
          <div style={{ fontFamily: MONO, fontSize: 13, color: 'rgba(232,222,250,0.25)', padding: '40px 0' }}>
            No classes scheduled yet. Check back soon.
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)', marginBottom: 24 }}>
                  Upcoming
                </div>
                {upcoming.map((s, i) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    index={past.length + i}
                    isPast={false}
                    isNext={s.id === nextSession?.id}
                    style={{ animationDelay: `${i * 30}ms` }}
                  />
                ))}
              </>
            )}

            {/* Past */}
            {past.length > 0 && (
              <>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.2)', margin: '32px 0 24px' }}>
                  Completed
                </div>
                {past.slice().reverse().map((s, i) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    index={past.length - 1 - i}
                    isPast={true}
                    isNext={false}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
