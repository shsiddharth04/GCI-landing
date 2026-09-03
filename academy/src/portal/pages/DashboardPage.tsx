import { useState, useEffect } from 'react'
import { ArrowRight, MapPin } from 'lucide-react'
import { fetchMyCourseSchedule, fetchMyAnnouncements, fetchMyResources } from '../../lib/db'
import type { EnrolledStudent, Session, Announcement, StudentResource } from '../../lib/db'

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

type Route = 'dashboard' | 'schedule' | 'resources' | 'announcements'

function fmt12(t: string) {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function fmtDayNum(d: string) {
  return new Date(d + 'T00:00:00').getDate().toString().padStart(2, '0')
}

function fmtMonth(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()
}

function fmtWeekday(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })
}

const COHORT_COLOR: Record<string, string> = {
  C1: '#f472b6', C2: '#818cf8', C3: '#fbbf24', C4: '#34d399', C5: '#38bdf8',
}

function CohortBadge({ cohort }: { cohort: string }) {
  const color = COHORT_COLOR[cohort] ?? '#E8DEFA'
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color }}>
      [{cohort}]
    </span>
  )
}

function SkeletonBlock({ h = 20, w = '100%', style }: { h?: number; w?: number | string; style?: React.CSSProperties }) {
  return (
    <div style={{
      height: h, width: w, background: 'rgba(232,222,250,0.06)',
      borderRadius: 2, ...style,
    }} />
  )
}

function TypeBadge({ type }: { type: StudentResource['resource_type'] }) {
  const map: Record<string, string> = { pdf: 'PDF', link: 'LINK', video: 'VIDEO', audio: 'AUDIO', other: 'FILE' }
  return (
    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', color: 'rgba(232,222,250,0.4)' }}>
      [{map[type ?? 'link'] ?? 'FILE'}]
    </span>
  )
}

export default function DashboardPage({
  student, onNavigate,
}: {
  student: EnrolledStudent
  onNavigate: (r: Route) => void
}) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [resources, setResources] = useState<StudentResource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchMyCourseSchedule(), fetchMyAnnouncements(), fetchMyResources()])
      .then(([s, a, r]) => { setSessions(s); setAnnouncements(a); setResources(r) })
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = sessions.filter(s => s.session_date >= today)
  const nextClass = upcoming[0] ?? null
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.session_date < today).length

  const latestAnnouncement = announcements[0] ?? null
  const topResources = resources.slice(0, 3)

  return (
    <div style={{ padding: '48px 56px', fontFamily: SANS, minHeight: '100vh' }}>

      {/* Progress strip */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)' }}>
            {loading ? (
              <SkeletonBlock h={10} w={140} />
            ) : (
              `${completedSessions} / ${totalSessions} Classes complete`
            )}
          </span>
          <CohortBadge cohort={student.cohort} />
        </div>
        <div style={{ height: 1, background: 'rgba(232,222,250,0.08)', position: 'relative' }}>
          {!loading && totalSessions > 0 && (
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${(completedSessions / totalSessions) * 100}%`,
              background: '#E8DEFA',
              transition: 'width 600ms ease',
            }} />
          )}
        </div>
      </div>

      {/* Greeting */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontFamily: SANS, fontSize: 40, fontWeight: 700,
          color: '#E8DEFA', letterSpacing: '-0.025em', margin: 0,
        }}>
          Hi, {student.name.split(' ')[0]}.
        </h1>
      </div>

      {/* Next class hero */}
      <div style={{
        background: '#141414', border: '1px solid rgba(232,222,250,0.08)',
        borderLeft: `3px solid #E8DEFA`,
        padding: '36px 40px', marginBottom: 32,
        animation: 'fadeSlideIn 200ms ease both',
      }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.35)', marginBottom: 24 }}>
          Next class
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonBlock h={80} w={120} />
            <SkeletonBlock h={20} w={200} />
            <SkeletonBlock h={16} w={160} />
          </div>
        ) : nextClass ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{
                fontFamily: MONO, fontSize: 88, fontWeight: 700,
                color: '#E8DEFA', lineHeight: 1, letterSpacing: '-0.04em',
              }}>
                {fmtDayNum(nextClass.session_date)}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 18, color: 'rgba(232,222,250,0.7)' }}>
                  {fmtMonth(nextClass.session_date)}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 14, color: 'rgba(232,222,250,0.4)' }}>
                  {fmtWeekday(nextClass.session_date)}
                </span>
              </div>
            </div>

            <div style={{ paddingBottom: 8 }}>
              <div style={{ fontFamily: MONO, fontSize: 22, color: 'rgba(232,222,250,0.8)', marginBottom: 12 }}>
                {fmt12(nextClass.start_time)} – {fmt12(nextClass.end_time)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <MapPin size={12} style={{ color: 'rgba(232,222,250,0.3)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(232,222,250,0.45)', fontFamily: SANS }}>
                  {nextClass.location}
                </span>
              </div>
              <CohortBadge cohort={student.cohort} />
            </div>

            <div style={{ marginLeft: 'auto', paddingBottom: 8 }}>
              <button
                onClick={() => onNavigate('schedule')}
                style={{
                  background: 'none', border: '1px solid rgba(232,222,250,0.15)',
                  color: 'rgba(232,222,250,0.6)', fontFamily: MONO, fontSize: 10,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '8px 14px', cursor: 'pointer',
                  transition: 'all 120ms',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.borderColor = 'rgba(232,222,250,0.4)'
                  b.style.color = '#E8DEFA'
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.borderColor = 'rgba(232,222,250,0.15)'
                  b.style.color = 'rgba(232,222,250,0.6)'
                }}
              >
                Full schedule <ArrowRight size={11} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: 'rgba(232,222,250,0.35)', fontFamily: MONO }}>
            No upcoming classes scheduled yet.
          </div>
        )}
      </div>

      {/* Two column: announcement + resources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Latest announcement */}
        <div style={{ border: '1px solid rgba(232,222,250,0.08)', background: '#141414', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)' }}>
              Announcements
            </span>
            <button
              onClick={() => onNavigate('announcements')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,222,250,0.3)', fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0, transition: 'color 100ms', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#E8DEFA' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,222,250,0.3)' }}
            >
              View all <ArrowRight size={9} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonBlock h={20} w="80%" />
              <SkeletonBlock h={14} />
              <SkeletonBlock h={14} w="70%" />
            </div>
          ) : latestAnnouncement ? (
            <>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#E8DEFA', marginBottom: 10, lineHeight: 1.3, fontFamily: SANS }}>
                {latestAnnouncement.title}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(232,222,250,0.5)', lineHeight: 1.7, fontFamily: SANS,
                display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {latestAnnouncement.body}
              </div>
              {latestAnnouncement.published_at && (
                <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(232,222,250,0.25)', marginTop: 12 }}>
                  {new Date(latestAnnouncement.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase()}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(232,222,250,0.25)', fontFamily: MONO }}>
              No announcements yet.
            </div>
          )}
        </div>

        {/* Recent resources */}
        <div style={{ border: '1px solid rgba(232,222,250,0.08)', background: '#141414', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)' }}>
              Resources
            </span>
            <button
              onClick={() => onNavigate('resources')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,222,250,0.3)', fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0, transition: 'color 100ms', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#E8DEFA' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,222,250,0.3)' }}
            >
              View all <ArrowRight size={9} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => <SkeletonBlock key={i} h={16} />)}
            </div>
          ) : topResources.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {topResources.map((r, i) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0',
                    borderBottom: i < topResources.length - 1 ? '1px solid rgba(232,222,250,0.05)' : 'none',
                    textDecoration: 'none',
                    transition: 'opacity 100ms',
                    opacity: 1,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.7' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
                >
                  <TypeBadge type={r.resource_type} />
                  <span style={{ fontSize: 13, color: 'rgba(232,222,250,0.75)', fontFamily: SANS, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.title}
                  </span>
                  <ArrowRight size={11} style={{ color: 'rgba(232,222,250,0.25)', flexShrink: 0 }} />
                </a>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(232,222,250,0.25)', fontFamily: MONO }}>
              No resources yet.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
