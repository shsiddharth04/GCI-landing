import { useState, useEffect } from 'react'
import { fetchMyAnnouncements } from '../../lib/db'
import type { Announcement } from '../../lib/db'

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).toUpperCase()
}

function CohortTag({ cohort }: { cohort: Announcement['cohort'] }) {
  const color = cohort === 'C1' ? '#f472b6' : cohort === 'C2' ? '#818cf8' : 'rgba(232,222,250,0.4)'
  return (
    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', color }}>
      [{cohort === 'all' ? 'ALL' : cohort}]
    </span>
  )
}

function AnnouncementItem({
  item, index,
}: {
  item: Announcement
  index: number
}) {
  return (
    <div style={{
      padding: '40px 0',
      borderBottom: '1px solid rgba(232,222,250,0.06)',
      animation: 'fadeSlideIn 200ms ease both',
      animationDelay: `${index * 40}ms`,
    }}>
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {item.published_at && (
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(232,222,250,0.25)' }}>
            {fmtDate(item.published_at)}
          </span>
        )}
        <span style={{ color: 'rgba(232,222,250,0.15)' }}>·</span>
        <CohortTag cohort={item.cohort} />
      </div>

      {/* Title */}
      <h2 style={{
        fontFamily: SANS, fontSize: 28, fontWeight: 700,
        color: '#E8DEFA', letterSpacing: '-0.02em',
        lineHeight: 1.2, margin: '0 0 20px',
      }}>
        {item.title}
      </h2>

      {/* Body */}
      <div style={{
        fontSize: 16, fontFamily: SANS,
        color: 'rgba(232,222,250,0.65)',
        lineHeight: 1.75,
        whiteSpace: 'pre-wrap',
      }}>
        {item.body}
      </div>
    </div>
  )
}

function SkeletonItem() {
  return (
    <div style={{ padding: '40px 0', borderBottom: '1px solid rgba(232,222,250,0.06)' }}>
      <div style={{ height: 10, width: 180, background: 'rgba(232,222,250,0.06)', borderRadius: 2, marginBottom: 16 }} />
      <div style={{ height: 28, width: '60%', background: 'rgba(232,222,250,0.08)', borderRadius: 2, marginBottom: 20 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, background: 'rgba(232,222,250,0.05)', borderRadius: 2 }} />
        <div style={{ height: 14, width: '85%', background: 'rgba(232,222,250,0.05)', borderRadius: 2 }} />
        <div style={{ height: 14, width: '70%', background: 'rgba(232,222,250,0.05)', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyAnnouncements().then(setAnnouncements).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '48px 56px', fontFamily: SANS, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)', marginBottom: 12 }}>
          Announcements
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: 36, fontWeight: 700, color: '#E8DEFA', letterSpacing: '-0.02em', margin: 0 }}>
          From your instructors.
        </h1>
      </div>

      {/* Items */}
      <div style={{ maxWidth: 680 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonItem key={i} />)
        ) : announcements.length === 0 ? (
          <div style={{ paddingTop: 48, fontFamily: MONO, fontSize: 13, color: 'rgba(232,222,250,0.25)' }}>
            No announcements yet.
          </div>
        ) : (
          announcements.map((a, i) => (
            <AnnouncementItem key={a.id} item={a} index={i} />
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
