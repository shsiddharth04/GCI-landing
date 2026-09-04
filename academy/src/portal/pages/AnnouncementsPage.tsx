import { useState, useEffect } from 'react'
import { fetchMyAnnouncements } from '../../lib/db'
import type { Announcement } from '../../lib/db'
import { useIsMobile } from '../hooks/useIsMobile'

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).toUpperCase()
}

const COHORT_COLOR: Record<string, string> = {
  C0: '#94a3b8', C1: '#f472b6', C2: '#818cf8', C3: '#fbbf24', C4: '#34d399', C5: '#38bdf8',
}

function CohortTag({ cohort }: { cohort: Announcement['cohort'] }) {
  const color = cohort === 'all' ? 'rgba(232,222,250,0.4)' : (COHORT_COLOR[cohort] ?? 'rgba(232,222,250,0.4)')
  return (
    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', color }}>
      [{cohort === 'all' ? 'ALL' : cohort}]
    </span>
  )
}

function AnnouncementItem({
  item, index, isMobile,
}: {
  item: Announcement
  index: number
  isMobile: boolean
}) {
  return (
    <div style={{
      padding: isMobile ? '28px 0' : '40px 0',
      borderBottom: '1px solid rgba(232,222,250,0.1)',
      animation: 'fadeSlideIn 200ms ease both',
      animationDelay: `${index * 40}ms`,
    }}>
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {item.published_at && (
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(232,222,250,0.45)' }}>
            {fmtDate(item.published_at)}
          </span>
        )}
        <span style={{ color: 'rgba(232,222,250,0.15)' }}>·</span>
        <CohortTag cohort={item.cohort} />
      </div>

      {/* Title */}
      <h2 style={{
        fontFamily: SANS, fontSize: isMobile ? 20 : 28, fontWeight: 700,
        color: '#E8DEFA', letterSpacing: '-0.02em',
        lineHeight: 1.2, margin: '0 0 16px',
      }}>
        {item.title}
      </h2>

      {/* Body */}
      <div style={{
        fontSize: isMobile ? 14 : 16, fontFamily: SANS,
        color: 'rgba(232,222,250,0.88)',
        lineHeight: 1.75,
        whiteSpace: 'pre-wrap',
      }}>
        {item.body}
      </div>
    </div>
  )
}

function SkeletonItem({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ padding: isMobile ? '28px 0' : '40px 0', borderBottom: '1px solid rgba(232,222,250,0.1)' }}>
      <div style={{ height: 10, width: 180, background: 'rgba(232,222,250,0.1)', borderRadius: 2, marginBottom: 14 }} />
      <div style={{ height: isMobile ? 20 : 28, width: '60%', background: 'rgba(232,222,250,0.08)', borderRadius: 2, marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, background: 'rgba(232,222,250,0.05)', borderRadius: 2 }} />
        <div style={{ height: 14, width: '85%', background: 'rgba(232,222,250,0.05)', borderRadius: 2 }} />
        <div style={{ height: 14, width: '70%', background: 'rgba(232,222,250,0.05)', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const isMobile = useIsMobile()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyAnnouncements().then(setAnnouncements).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: isMobile ? '24px 20px' : '48px 56px', fontFamily: SANS, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.5)', marginBottom: 10 }}>
          Announcements
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: isMobile ? 24 : 36, fontWeight: 700, color: '#E8DEFA', letterSpacing: '-0.02em', margin: 0 }}>
          From your instructors.
        </h1>
      </div>

      {/* Items */}
      <div style={{ maxWidth: isMobile ? '100%' : 680 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonItem key={i} isMobile={isMobile} />)
        ) : announcements.length === 0 ? (
          <div style={{ paddingTop: 48, fontFamily: MONO, fontSize: 13, color: 'rgba(232,222,250,0.45)' }}>
            No announcements yet.
          </div>
        ) : (
          announcements.map((a, i) => (
            <AnnouncementItem key={a.id} item={a} index={i} isMobile={isMobile} />
          ))
        )}
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
