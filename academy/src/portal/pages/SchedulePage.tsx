import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { fetchMyCourseSchedule } from '../../lib/db'
import type { EnrolledStudent, Session } from '../../lib/db'
import { useIsMobile } from '../hooks/useIsMobile'

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
  session, index, isPast, isNext, isMobile, style,
}: {
  session: Session
  index: number
  isPast: boolean
  isNext: boolean
  isMobile: boolean
  style?: React.CSSProperties
}) {
  const { day, month } = fmtDay(session.session_date)
  const weekday = fmtWeekday(session.session_date)

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      opacity: isPast ? 0.45 : 1,
      transition: 'opacity 150ms',
      ...style,
    }}>
      {/* Timeline column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobile ? 32 : 48, flexShrink: 0 }}>
        <div style={{
          width: isNext ? 12 : 8, height: isNext ? 12 : 8,
          borderRadius: '50%',
          background: isNext ? '#E8DEFA' : isPast ? 'rgba(232,222,250,0.3)' : 'rgba(232,222,250,0.5)',
          flexShrink: 0,
          marginTop: 6,
          boxShadow: isNext ? '0 0 12px rgba(232,222,250,0.4)' : 'none',
        }} />
        <div style={{ flex: 1, width: 1, background: 'rgba(232,222,250,0.1)', marginTop: 6 }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1, paddingBottom: isMobile ? 20 : 28, paddingLeft: isMobile ? 12 : 16,
        borderBottom: '1px solid rgba(232,222,250,0.07)',
        marginBottom: 0,
      }}>
        {/* Date line */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 6 : 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: isMobile ? 22 : 28, fontWeight: 700, color: isPast ? 'rgba(232,222,250,0.55)' : '#E8DEFA', lineHeight: 1 }}>
            {day}
          </span>
          <span style={{ fontFamily: MONO, fontSize: isMobile ? 11 : 13, color: 'rgba(232,222,250,0.65)' }}>
            {month}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(232,222,250,0.45)' }}>
            {weekday}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            {isNext && (
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em',
                textTransform: 'uppercase', background: '#E8DEFA',
                color: '#0a0a0a', padding: '3px 8px', fontWeight: 700,
              }}>
                Next
              </span>
            )}
            {isPast && (
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.4)' }}>
                [Done]
              </span>
            )}
            {!isNext && !isPast && (
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.45)' }}>
                {isMobile ? '[—]' : '[Upcoming]'}
              </span>
            )}
          </div>
        </div>

        {/* Module label */}
        {session.course_name && (
          <div style={{ fontFamily: SANS, fontSize: isMobile ? 13 : 15, fontWeight: 600, color: 'rgba(232,222,250,0.9)', marginBottom: 6 }}>
            {session.course_name}
          </div>
        )}

        {/* Time + location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: isMobile ? 12 : 14, color: 'rgba(232,222,250,0.8)' }}>
            {fmt12(session.start_time)} – {fmt12(session.end_time)}
          </span>
          {!isMobile && <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(232,222,250,0.3)' }}>·</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={10} style={{ color: 'rgba(232,222,250,0.4)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(232,222,250,0.55)', fontFamily: SANS }}>
              {session.location}
            </span>
          </div>
        </div>

        {/* Session number */}
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', color: 'rgba(232,222,250,0.3)', marginTop: 8 }}>
          Session {String(index + 1).padStart(2, '0')}
        </div>
      </div>
    </div>
  )
}

function SkeletonRow({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 16, paddingBottom: isMobile ? 20 : 28 }}>
      <div style={{ width: isMobile ? 32 : 48, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(232,222,250,0.1)' }} />
        <div style={{ flex: 1, width: 1, background: 'rgba(232,222,250,0.06)', marginTop: 6 }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: isMobile ? 22 : 28, width: 100, background: 'rgba(232,222,250,0.08)', borderRadius: 2 }} />
        <div style={{ height: 14, width: 180, background: 'rgba(232,222,250,0.06)', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function SchedulePage({ student }: { student: EnrolledStudent }) {
  const isMobile = useIsMobile()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyCourseSchedule(student.cohort).then(setSessions).finally(() => setLoading(false))
  }, [student.cohort])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = sessions.filter(s => s.session_date >= today)
  const past = sessions.filter(s => s.session_date < today)
  const nextSession = upcoming[0]

  const completed = past.length
  const total = sessions.length

  return (
    <div style={{ padding: isMobile ? '24px 20px' : '48px 56px', fontFamily: SANS, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 28 : 48 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.5)', marginBottom: 10 }}>
          Schedule
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: isMobile ? 24 : 36, fontWeight: 700, color: '#E8DEFA', letterSpacing: '-0.02em', margin: '0 0 16px' }}>
          Cohort {student.cohort.replace('C', '')} · Sessions
        </h1>

        {/* Progress */}
        {!loading && total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <div style={{ flex: 1, maxWidth: isMobile ? 200 : 280, height: 2, background: 'rgba(232,222,250,0.1)', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${(completed / total) * 100}%`,
                background: '#E8DEFA', transition: 'width 600ms ease',
              }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(232,222,250,0.55)' }}>
              {completed} / {total} complete
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: isMobile ? '100%' : 680 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} isMobile={isMobile} />)
        ) : sessions.length === 0 ? (
          <div style={{ fontFamily: MONO, fontSize: 13, color: 'rgba(232,222,250,0.45)', padding: '40px 0' }}>
            No classes scheduled yet. Check back soon.
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.45)', marginBottom: 20 }}>
                  Upcoming
                </div>
                {upcoming.map((s, i) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    index={past.length + i}
                    isPast={false}
                    isNext={s.id === nextSession?.id}
                    isMobile={isMobile}
                    style={{ animationDelay: `${i * 30}ms` }}
                  />
                ))}
              </>
            )}

            {past.length > 0 && (
              <>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)', margin: '28px 0 20px' }}>
                  Completed
                </div>
                {past.map((s, i) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    index={i}
                    isPast={true}
                    isNext={false}
                    isMobile={isMobile}
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
