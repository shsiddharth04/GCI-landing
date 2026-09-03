import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMyEnrollment } from '../lib/db'
import type { EnrolledStudent } from '../lib/db'
import LoginPage from './pages/LoginPage'
import SetPasswordPage from './pages/SetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import SchedulePage from './pages/SchedulePage'
import ResourcesPage from './pages/ResourcesPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import PortalLayout from './components/PortalLayout'

type Route = 'dashboard' | 'schedule' | 'resources' | 'announcements'
type View = 'loading' | 'set-password' | 'login' | 'portal'

function getRoute(): Route {
  const path = window.location.pathname
  if (path.includes('/schedule')) return 'schedule'
  if (path.includes('/resources')) return 'resources'
  if (path.includes('/announcements')) return 'announcements'
  return 'dashboard'
}

function navigate(route: Route) {
  const paths: Record<Route, string> = {
    dashboard: '/',
    schedule: '/schedule',
    resources: '/resources',
    announcements: '/announcements',
  }
  window.history.pushState({}, '', paths[route])
  window.dispatchEvent(new Event('portalroute'))
}

export { navigate }

export default function PortalRoot() {
  const [view, setView] = useState<View>('loading')
  const [student, setStudent] = useState<EnrolledStudent | null>(null)
  const [accessError, setAccessError] = useState(false)
  const [route, setRoute] = useState<Route>(getRoute())
  const [tokenHash, setTokenHash] = useState<string | null>(null)
  const [tokenType, setTokenType] = useState<'invite' | 'recovery' | 'magiclink' | null>(null)

  useEffect(() => {
    window.addEventListener('portalroute', () => setRoute(getRoute()))
    window.addEventListener('popstate', () => setRoute(getRoute()))
    return () => {
      window.removeEventListener('portalroute', () => setRoute(getRoute()))
      window.removeEventListener('popstate', () => setRoute(getRoute()))
    }
  }, [])

  useEffect(() => {
    // PKCE flow: token arrives as ?token_hash=xxx&type=xxx in query string
    const searchParams = new URLSearchParams(window.location.search)
    const qTokenHash = searchParams.get('token_hash')
    const qType = searchParams.get('type')

    if (qTokenHash && (qType === 'invite' || qType === 'recovery' || qType === 'magiclink')) {
      setTokenHash(qTokenHash)
      setTokenType(qType as 'invite' | 'recovery' | 'magiclink')
      window.history.replaceState({}, '', window.location.pathname)
      setView('set-password')
      return
    }

    // Implicit flow: Supabase processes the magic link server-side and redirects
    // with #access_token=xxx in the fragment. The client auto-consumes it and
    // logs the user in — we intercept here before getSession() sees the session.
    const hashStr = window.location.hash.slice(1)
    const hashParams = new URLSearchParams(hashStr)
    const hashType = hashParams.get('type')

    if (hashParams.get('access_token') && hashType === 'magiclink') {
      // Session is already established — skip verifyOtp, just set the password
      window.history.replaceState({}, '', window.location.pathname)
      setTokenHash('')       // empty = tell SetPasswordPage to skip verifyOtp
      setTokenType('magiclink')
      setView('set-password')
      return
    }

    // Normal session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadStudent()
      } else {
        setView('login')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (event === 'SIGNED_IN') {
          supabase.rpc('link_my_enrollment').then(() => {
            // Only transition to portal if we're not mid password-setup flow
            setView(v => v === 'set-password' ? 'set-password' : 'loading')
            if (view !== 'set-password') loadStudent()
          })
        } else if (event === 'USER_UPDATED') {
          loadStudent()
        }
      } else {
        setStudent(null)
        setView('login')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadStudent() {
    try {
      const s = await fetchMyEnrollment()
      if (!s || s.status !== 'active') {
        setAccessError(true)
        await supabase.auth.signOut()
        setView('login')
      } else {
        setStudent(s)
        setView('portal')
      }
    } catch {
      setAccessError(true)
      setView('login')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setStudent(null)
    setView('login')
    navigate('dashboard')
  }

  if (view === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 28 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="eq-bar" style={{
              width: 3, height: '100%', background: '#E8DEFA', borderRadius: 1,
              animationDelay: `${i * 0.12}s`,
            }} />
          ))}
        </div>
      </div>
    )
  }

  if (view === 'set-password' && tokenHash && tokenType) {
    return (
      <SetPasswordPage
        tokenHash={tokenHash}
        tokenType={tokenType as 'invite' | 'recovery' | 'magiclink'}
        onComplete={loadStudent}
      />
    )
  }

  if (view === 'login' || !student) {
    return <LoginPage accessError={accessError} />
  }

  return (
    <PortalLayout student={student} route={route} onNavigate={navigate} onSignOut={handleSignOut}>
      {route === 'dashboard'     && <DashboardPage     student={student} onNavigate={navigate} />}
      {route === 'schedule'      && <SchedulePage       student={student} />}
      {route === 'resources'     && <ResourcesPage />}
      {route === 'announcements' && <AnnouncementsPage />}
    </PortalLayout>
  )
}
