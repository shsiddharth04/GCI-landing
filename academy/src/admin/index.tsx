import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
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

export default function AdminApp() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('admin_authed') === '1')

  if (!authed) {
    return <AdminLogin onAuth={() => setAuthed(true)} />
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
