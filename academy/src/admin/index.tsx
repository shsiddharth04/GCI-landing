import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLogin from './components/AdminLogin'
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

async function checkIsAdmin(): Promise<boolean> {
  const { data } = await supabase.rpc('is_admin')
  return !!data
}

export default function AdminApp() {
  const [loading,  setLoading]  = useState(true)
  const [isAdmin,  setIsAdmin]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setIsAdmin(session ? await checkIsAdmin() : false)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsAdmin(session ? await checkIsAdmin() : false)
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

  if (!isAdmin) {
    return <AdminLogin onAuth={() => { /* onAuthStateChange handles state update */ }} />
  }

  return (
    <AdminLayout>
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
      </Routes>
    </AdminLayout>
  )
}
