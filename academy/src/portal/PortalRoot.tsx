import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { fetchMyEnrollment } from '../lib/db'
import type { EnrolledStudent } from '../lib/db'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SchedulePage from './pages/SchedulePage'
import ResourcesPage from './pages/ResourcesPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import PortalLayout from './components/PortalLayout'

type Route = 'dashboard' | 'schedule' | 'resources' | 'announcements'

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
  const [session, setSession] = useState<Session | null>(null)
  const [student, setStudent] = useState<EnrolledStudent | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessError, setAccessError] = useState(false)
  const [route, setRoute] = useState<Route>(getRoute())

  useEffect(() => {
    window.addEventListener('portalroute', () => setRoute(getRoute()))
    window.addEventListener('popstate', () => setRoute(getRoute()))
    return () => {
      window.removeEventListener('portalroute', () => setRoute(getRoute()))
      window.removeEventListener('popstate', () => setRoute(getRoute()))
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadStudent()
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadStudent()
      } else {
        setStudent(null)
        setLoading(false)
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
      } else {
        setStudent(s)
      }
    } catch {
      setAccessError(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setStudent(null)
    setSession(null)
    navigate('dashboard')
  }

  if (loading) {
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

  if (!session || !student) {
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
