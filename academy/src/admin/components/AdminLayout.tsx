import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Calendar, Users, GraduationCap, ClipboardList, LogOut } from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/course', label: 'Course', icon: GraduationCap },
  { to: '/admin/masterclass', label: 'Masterclass', icon: Calendar },
  { to: '/admin/curriculum', label: 'Curriculum', icon: BookOpen },
  { to: '/admin/instructors', label: 'Instructors', icon: Users },
  { to: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  function handleLogout() {
    sessionStorage.removeItem('admin_authed')
    navigate('/admin')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#0d0d0d] border-r border-white/6 flex flex-col">
        <div className="px-5 py-5 border-b border-white/6">
          <div className="text-sm font-bold tracking-tight">
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
                    ? 'bg-[#E8DEFA]/10 text-[#E8DEFA] font-medium'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/35 hover:text-white/70 hover:bg-white/5 w-full transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
