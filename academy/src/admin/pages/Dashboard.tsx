import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { loadSettings, completionScore } from '../settings'

export default function Dashboard() {
  const settings = loadSettings()
  const { filled, total, missing } = completionScore(settings)
  const pct = Math.round((filled / total) * 100)
  const navigate = useNavigate()

  const quickLinks = [
    { label: 'Edit Course', to: '/admin/course', desc: 'Fee, dates, format, seats' },
    { label: 'Edit Masterclass', to: '/admin/masterclass', desc: 'Date, time, capacity, studio' },
    { label: 'Curriculum', to: '/admin/curriculum', desc: `${settings.curriculum.length} module${settings.curriculum.length !== 1 ? 's' : ''} configured` },
    { label: 'Instructors', to: '/admin/instructors', desc: `${settings.instructors.length} instructor${settings.instructors.length !== 1 ? 's' : ''} configured` },
    { label: 'Registrations', to: '/admin/registrations', desc: 'View waitlist entries' },
  ]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Dashboard</h1>
      <p className="text-sm text-white/40 mb-8">
        {settings.updatedAt
          ? `Last saved ${new Date(settings.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
          : 'No settings saved yet.'}
      </p>

      {/* Completion card */}
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">Setup progress</span>
          <span className="font-mono text-sm text-[#E8DEFA]">{filled}/{total}</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-[#E8DEFA] rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {missing.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle size={15} />
            All required fields are set — ready to launch.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#E8DEFA]/70 mb-3">
              <AlertCircle size={14} />
              Still missing:
            </div>
            <div className="flex flex-wrap gap-2">
              {missing.map(m => (
                <span key={m} className="text-xs bg-white/5 border border-white/8 px-2.5 py-1 rounded-full text-white/50">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickLinks.map(({ label, to, desc }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="text-left bg-[#141414] border border-white/8 hover:border-[#E8DEFA]/20 rounded-xl p-5 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium group-hover:text-[#E8DEFA] transition-colors">{label}</span>
              <ArrowRight size={14} className="text-white/20 group-hover:text-[#E8DEFA]/50 transition-colors" />
            </div>
            <p className="text-xs text-white/35">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
