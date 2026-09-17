import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Calendar, Users, GraduationCap, ClipboardList, LogOut, CalendarDays, UserCheck, FileText, Bell, CreditCard, BookMarked } from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/admin/course', label: 'Course', icon: GraduationCap },
  { to: '/admin/masterclass', label: 'Masterclass', icon: Calendar },
  { to: '/admin/curriculum', label: 'Curriculum', icon: BookOpen },
  { to: '/admin/instructors', label: 'Instructors', icon: Users },
  { to: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/course-enrollments', label: 'Enrollments', icon: BookMarked },
  { to: '/admin/students', label: 'Students', icon: UserCheck },
  { to: '/admin/resources', label: 'Resources', icon: FileText },
  { to: '/admin/announcements', label: 'Announcements', icon: Bell },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  function handleLogout() {
    sessionStorage.removeItem('admin_authed')
    navigate('/admin')
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F3EEFF' }}>
      {/* Sidebar — stays dark, brand-anchored */}
      <aside className="w-56 shrink-0 flex flex-col" style={{ background: '#0E0918', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-sm font-bold tracking-tight text-white">
            GCI <span className="text-[#E8DEFA]">Academy</span>
          </div>
          <div className="text-[10px] text-white/30 font-mono mt-0.5">Admin Console</div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#E8DEFA]/12 text-[#E8DEFA] font-medium'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/35 hover:text-white/70 hover:bg-white/5 w-full transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content — light lavender */}
      <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: '#F3EEFF' }}>
        {children}
      </main>
    </div>
  )
}
