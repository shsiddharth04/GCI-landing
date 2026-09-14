import { Calendar, BookOpen, Bell, LayoutDashboard, LogOut, Mic2 } from 'lucide-react'
import type { EnrolledStudent } from '../../lib/db'
import { useIsMobile } from '../hooks/useIsMobile'

type Route = 'dashboard' | 'schedule' | 'resources' | 'announcements' | 'practice'

const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

const NAV = [
  { route: 'dashboard'     as Route, label: 'Dashboard',  icon: LayoutDashboard, soon: false },
  { route: 'schedule'      as Route, label: 'Schedule',   icon: Calendar,        soon: false },
  { route: 'resources'     as Route, label: 'Resources',  icon: BookOpen,        soon: false },
  { route: 'announcements' as Route, label: 'Alerts',     icon: Bell,            soon: false },
  { route: 'practice'      as Route, label: 'Practice',   icon: Mic2,            soon: false },
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
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: SANS, background: '#0e0e0e' }}>
        {/* Mobile top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 52, flexShrink: 0,
          background: '#0e0e0e',
          borderBottom: '1px solid rgba(232,222,250,0.1)',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            GCI <span style={{ color: '#E8DEFA' }}>Academy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CohortDot cohort={student.cohort} />
            <button
              onClick={onSignOut}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                color: 'rgba(232,222,250,0.35)', display: 'flex', alignItems: 'center',
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, background: '#141414', paddingBottom: 64, minHeight: 0, overflowY: 'auto' }}>
          {children}
        </main>

        {/* Bottom nav */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
          background: '#0e0e0e',
          borderTop: '1px solid rgba(232,222,250,0.1)',
          display: 'flex', zIndex: 50,
        }}>
          {NAV.map(({ route: r, label, icon: Icon, soon }) => {
            const active = route === r
            return (
              <button
                key={r}
                onClick={() => onNavigate(r)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderTop: active ? '2px solid #E8DEFA' : '2px solid transparent',
                  color: active ? '#E8DEFA' : soon ? 'rgba(232,222,250,0.25)' : 'rgba(232,222,250,0.4)',
                  padding: '8px 2px 6px',
                  transition: 'color 100ms', position: 'relative',
                }}
              >
                <Icon size={17} strokeWidth={active ? 2 : 1.6} />
                <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {label}
                </span>
                {soon && (
                  <span style={{
                    position: 'absolute', top: 6, right: '50%', transform: 'translateX(8px)',
                    fontFamily: MONO, fontSize: 6, letterSpacing: '0.06em',
                    background: 'rgba(232,222,250,0.15)', color: 'rgba(232,222,250,0.5)',
                    padding: '1px 3px', borderRadius: 2,
                  }}>
                    soon
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    )
  }

  // Desktop layout — unchanged
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
          {NAV.map(({ route: r, label, icon: Icon, soon }) => {
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
                  color: active ? '#E8DEFA' : soon ? 'rgba(232,222,250,0.35)' : 'rgba(232,222,250,0.6)',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  fontFamily: SANS,
                  textAlign: 'left', width: '100%',
                  transition: 'color 100ms, background 100ms, border-color 100ms',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = soon ? 'rgba(232,222,250,0.5)' : 'rgba(232,222,250,0.9)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,222,250,0.05)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = soon ? 'rgba(232,222,250,0.35)' : 'rgba(232,222,250,0.6)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }
                }}
              >
                <Icon size={14} strokeWidth={1.8} />
                <span style={{ flex: 1 }}>{label === 'Alerts' ? 'Announcements' : label}</span>
                {soon && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: 'rgba(232,222,250,0.08)', color: 'rgba(232,222,250,0.4)',
                    padding: '2px 5px',
                  }}>
                    Soon
                  </span>
                )}
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
