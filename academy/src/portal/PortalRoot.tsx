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
  const [isReset, setIsReset] = useState(false)

  useEffect(() => {
    const onRoute = () => setRoute(getRoute())
    window.addEventListener('portalroute', onRoute)
    window.addEventListener('popstate', onRoute)
    return () => {
      window.removeEventListener('portalroute', onRoute)
      window.removeEventListener('popstate', onRoute)
    }
  }, [])

  useEffect(() => {
    async function loadStudent() {
      try {
        const s = await fetchMyEnrollment()
        if (!s || s.status !== 'active') {
          setAccessError(true)
          await supabase.auth.signOut()
          setView('login')
        } else if (!s.has_set_password) {
          // Session is live but student hasn't set a password yet
          setIsReset(false)
          setView('set-password')
        } else {
          setStudent(s)
          setView('portal')
        }
      } catch {
        setAccessError(true)
        setView('login')
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setStudent(null)
        setView('login')
        return
      }

      if (event === 'PASSWORD_RECOVERY') {
        // User clicked a reset link — route to SetPasswordPage in reset mode
        setIsReset(true)
        setView('set-password')
        return
      }

      if (event === 'USER_UPDATED') {
        // Password was just set — load student and go to portal
        await loadStudent()
        return
      }

      if (session && event === 'SIGNED_IN') {
        // New sign-in — link user_id and check if this is their first time
        const { data: isFirstLogin } = await supabase.rpc('link_my_enrollment')
        if (isFirstLogin === true) {
          setIsReset(false)
          setView('set-password')
        } else {
          await loadStudent()
        }
        return
      }

      if (event === 'INITIAL_SESSION') {
        if (session) {
          await loadStudent()
        } else {
          setView('login')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setStudent(null)
    setView('login')
    navigate('dashboard')
  }

  async function handlePasswordSet() {
    const s = await fetchMyEnrollment()
    if (s && s.status === 'active') {
      setStudent(s)
      setView('portal')
    } else {
      setView('login')
    }
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

  if (view === 'set-password') {
    return <SetPasswordPage isReset={isReset} onComplete={handlePasswordSet} />
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
