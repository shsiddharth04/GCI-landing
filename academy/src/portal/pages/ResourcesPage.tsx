import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { fetchMyResources } from '../../lib/db'
import type { StudentResource } from '../../lib/db'
import { useIsMobile } from '../hooks/useIsMobile'

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF', link: 'LINK', video: 'VIDEO', audio: 'AUDIO', other: 'FILE',
}

const FILTER_OPTIONS = ['all', 'pdf', 'link', 'video', 'audio'] as const
type Filter = typeof FILTER_OPTIONS[number]

function ResourceCard({ resource, style }: { resource: StudentResource; style?: React.CSSProperties }) {
  const label = TYPE_LABELS[resource.resource_type ?? 'link'] ?? 'FILE'

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'block', textDecoration: 'none',
        background: '#1e1e1e',
        border: '1px solid rgba(232,222,250,0.13)',
        padding: '20px 20px 18px',
        cursor: 'pointer',
        transition: 'border-color 120ms, transform 120ms',
        ...style,
      }}
      onMouseEnter={e => {
        const a = e.currentTarget as HTMLAnchorElement
        a.style.borderColor = 'rgba(232,222,250,0.45)'
        a.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const a = e.currentTarget as HTMLAnchorElement
        a.style.borderColor = 'rgba(232,222,250,0.13)'
        a.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', color: 'rgba(232,222,250,0.6)' }}>
          [{label}]
        </span>
        <ExternalLink size={12} style={{ color: 'rgba(232,222,250,0.2)', flexShrink: 0 }} />
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: '#E8DEFA', lineHeight: 1.3, marginBottom: 8, fontFamily: SANS }}>
        {resource.title}
      </div>

      {resource.description && (
        <div style={{
          fontSize: 12, color: 'rgba(232,222,250,0.65)', lineHeight: 1.6, fontFamily: SANS,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {resource.description}
        </div>
      )}
    </a>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: '#1e1e1e', border: '1px solid rgba(232,222,250,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ height: 10, width: 40, background: 'rgba(232,222,250,0.06)', borderRadius: 2 }} />
      <div style={{ height: 16, width: '80%', background: 'rgba(232,222,250,0.06)', borderRadius: 2 }} />
      <div style={{ height: 12, background: 'rgba(232,222,250,0.04)', borderRadius: 2 }} />
      <div style={{ height: 12, width: '60%', background: 'rgba(232,222,250,0.04)', borderRadius: 2 }} />
    </div>
  )
}

export default function ResourcesPage() {
  const isMobile = useIsMobile()
  const [resources, setResources] = useState<StudentResource[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetchMyResources().then(setResources).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? resources
    : resources.filter(r => r.resource_type === filter)

  return (
    <div style={{ padding: isMobile ? '24px 20px' : '48px 56px', fontFamily: SANS, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)', marginBottom: 10 }}>
          Resources
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: isMobile ? 24 : 36, fontWeight: 700, color: '#E8DEFA', letterSpacing: '-0.02em', margin: 0 }}>
          Your materials.
        </h1>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
        {FILTER_OPTIONS.map(f => {
          const active = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: isMobile ? '5px 12px' : '6px 14px',
                background: active ? '#E8DEFA' : 'transparent',
                border: `1px solid ${active ? '#E8DEFA' : 'rgba(232,222,250,0.15)'}`,
                color: active ? '#0a0a0a' : 'rgba(232,222,250,0.7)',
                fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', cursor: 'pointer',
                fontWeight: active ? 700 : 400,
                transition: 'all 100ms',
              }}
              onMouseEnter={e => {
                if (!active) {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.borderColor = 'rgba(232,222,250,0.35)'
                  b.style.color = 'rgba(232,222,250,0.8)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.borderColor = 'rgba(232,222,250,0.15)'
                  b.style.color = 'rgba(232,222,250,0.7)'
                }
              }}
            >
              {f === 'all' ? 'All' : TYPE_LABELS[f] ?? f}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: isMobile ? 10 : 12,
      }}>
        {loading ? (
          Array.from({ length: isMobile ? 4 : 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', fontFamily: MONO, fontSize: 13, color: 'rgba(232,222,250,0.45)', padding: '40px 0' }}>
            {filter === 'all' ? 'No resources available yet.' : `No ${TYPE_LABELS[filter]} resources yet.`}
          </div>
        ) : (
          filtered.map((r, i) => (
            <ResourceCard
              key={r.id}
              resource={r}
              style={{ animationDelay: `${i * 30}ms` }}
            />
          ))
        )}
      </div>
    </div>
  )
}
