import { Calendar, BookOpen, Bell, LayoutDashboard, LogOut } from 'lucide-react'
import type { EnrolledStudent } from '../../lib/db'

type Route = 'dashboard' | 'schedule' | 'resources' | 'announcements'

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

const NAV = [
  { route: 'dashboard'     as Route, label: 'Dashboard',     icon: LayoutDashboard },
  { route: 'schedule'      as Route, label: 'Schedule',       icon: Calendar },
  { route: 'resources'     as Route, label: 'Resources',      icon: BookOpen },
  { route: 'announcements' as Route, label: 'Announcements',  icon: Bell },
]

const COHORT_COLOR: Record<string, string> = {
  C0: '#94a3b8', C1: '#f472b6', C2: '#818cf8', C3: '#fbbf24', C4: '#34d399', C5: '#38bdf8',
}

function CohortDot({ cohort }: { cohort: string }) {
  const color = COHORT_COLOR[cohort] ?? '#E8DEFA'
  const num = cohort.replace('C', '')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color }}>
        Cohort {num}
      </span>
    </div>
  )
}

export default function PortalLayout({
  children, student, route, onNavigate, onSignOut,
}: {
  children: React.ReactNode
  student: EnrolledStudent
  route: Route
  onNavigate: (r: Route) => void
  onSignOut: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: SANS, background: '#0e0e0e',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 232, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#0e0e0e',
        borderRight: '1px solid rgba(232,222,250,0.1)',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(232,222,250,0.1)' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,222,250,0.5)', marginBottom: 6 }}>
            Student Portal
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            GCI <span style={{ color: '#E8DEFA' }}>Academy</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ route: r, label, icon: Icon }) => {
            const active = route === r
            return (
              <button
                key={r}
                onClick={() => onNavigate(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: active ? 'rgba(232,222,250,0.09)' : 'transparent',
                  border: 'none',
                  borderLeft: active ? '2px solid #E8DEFA' : '2px solid transparent',
                  cursor: 'pointer',
                  color: active ? '#E8DEFA' : 'rgba(232,222,250,0.6)',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  fontFamily: SANS,
                  textAlign: 'left', width: '100%',
                  transition: 'color 100ms, background 100ms, border-color 100ms',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,222,250,0.9)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,222,250,0.05)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,222,250,0.6)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }
                }}
              >
                <Icon size={14} strokeWidth={1.8} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Student info + logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(232,222,250,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginBottom: 6, fontFamily: SANS }}>
            {student.name}
          </div>
          <CohortDot cohort={student.cohort} />
          <button
            onClick={onSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              marginTop: 16, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
              color: 'rgba(232,222,250,0.4)',
              fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              transition: 'color 100ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,222,250,0.8)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,222,250,0.4)' }}
          >
            <LogOut size={11} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{
        flex: 1, minWidth: 0, background: '#141414',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
