import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLogin from './components/AdminLogin'
import AdminSetPassword from './components/AdminSetPassword'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import CourseEditor from './pages/CourseEditor'
import MasterclassEditor from './pages/MasterclassEditor'
import CurriculumEditor from './pages/CurriculumEditor'
import InstructorEditor from './pages/InstructorEditor'
import Registrations from './pages/Registrations'
import Payments from './pages/Payments'
import CourseEnrollments from './pages/CourseEnrollments'
import Schedule from './pages/Schedule'
import Students from './pages/Students'
import ResourcesAdmin from './pages/ResourcesAdmin'
import AnnouncementsAdmin from './pages/AnnouncementsAdmin'
import Team from './pages/Team'

async function checkIsAdmin(): Promise<boolean> {
  const { data } = await supabase.rpc('is_admin')
  return !!data
}

async function checkIsSuperadmin(): Promise<boolean> {
  const { data } = await supabase.rpc('is_superadmin')
  return !!data
}

export default function AdminApp() {
  const [loading,      setLoading]      = useState(true)
  const [isAdmin,      setIsAdmin]      = useState(false)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [isRecovery,   setIsRecovery]   = useState(false)

  async function refreshAuth(session: { access_token: string } | null, signOutIfNotAdmin = false) {
    if (!session) {
      setIsAdmin(false)
      setIsSuperadmin(false)
      setIsRecovery(false)
      return
    }
    const [admin, superadmin] = await Promise.all([checkIsAdmin(), checkIsSuperadmin()])
    setIsAdmin(admin)
    setIsSuperadmin(superadmin)
    // Someone authenticated successfully but isn't in admin_users — sign them out
    // immediately so their session doesn't linger in the admin portal.
    if (!admin && signOutIfNotAdmin) {
      await supabase.auth.signOut()
    }
  }

  useEffect(() => {
    // Detect invite/recovery flow initiated from the email link.
    // The inline script in index.html captures the Supabase auth type before
    // Supabase clears the URL hash, and main.tsx redirects here. We read it once
    // and clear it so it doesn't persist across future visits.
    const authType = sessionStorage.getItem('_auth_type')
    if (authType) sessionStorage.removeItem('_auth_type')

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && (authType === 'invite' || authType === 'recovery')) {
        setIsRecovery(true)
        setLoading(false)
        return
      }
      await refreshAuth(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecovery(true)
          setLoading(false)
          return
        }
        if (event === 'USER_UPDATED') {
          setIsRecovery(false)
        }
        // On a fresh sign-in, kick out anyone who isn't in admin_users.
        // This prevents student portal credentials from creating a lingering
        // session in the admin portal even though they'd be shown the login form.
        await refreshAuth(session, event === 'SIGNED_IN')
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3EEFF' }}>
        <div className="text-[#8B73B3] text-sm">Loading…</div>
      </div>
    )
  }

  if (isRecovery) {
    return <AdminSetPassword />
  }

  if (!isAdmin) {
    return <AdminLogin onAuth={() => { /* onAuthStateChange handles state update */ }} />
  }

  return (
    <AdminLayout isSuperadmin={isSuperadmin}>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="course" element={<CourseEditor />} />
        <Route path="masterclass" element={<MasterclassEditor />} />
        <Route path="curriculum" element={<CurriculumEditor />} />
        <Route path="instructors" element={<InstructorEditor />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="payments" element={<Payments />} />
        <Route path="course-enrollments" element={<CourseEnrollments />} />
        <Route path="students" element={<Students />} />
        <Route path="resources" element={<ResourcesAdmin />} />
        <Route path="announcements" element={<AnnouncementsAdmin />} />
        {isSuperadmin && <Route path="team" element={<Team />} />}
      </Routes>
    </AdminLayout>
  )
}
