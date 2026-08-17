import { loadSettings } from '../admin/settings'

const PLACEHOLDER_MODULES = [
  { weekLabel: 'Session 1', title: 'Understanding sound & the room', description: '' },
  { weekLabel: 'Session 2', title: 'Reading energy: crowd dynamics', description: '' },
  { weekLabel: 'Session 3', title: 'Equipment deep-dive', description: '' },
  { weekLabel: 'Session 4', title: 'Track selection & crate building', description: '' },
  { weekLabel: 'Session 5', title: 'Mixing fundamentals', description: '' },
  { weekLabel: 'Session 6', title: 'Live set construction', description: '' },
  { weekLabel: 'Session 7', title: 'Business: pricing, contracts, bookings', description: '' },
  { weekLabel: 'Session 8', title: 'Capstone: live session + feedback', description: '' },
]

export default function Curriculum() {
  const settings = loadSettings()
  const modules = settings.curriculum.length > 0
    ? [...settings.curriculum].sort((a, b) => a.order - b.order)
    : PLACEHOLDER_MODULES.map((m, i) => ({ ...m, id: String(i), order: i }))

  const isPlaceholder = settings.curriculum.length === 0

  return (
    <section id="curriculum" className="py-28 px-6 bg-[#141414]/50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <p className="font-mono text-[10px] text-[#E8DEFA]/40 tracking-widest uppercase mb-4">The curriculum</p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Every session.<br />
              <span className="text-[#E8DEFA]">Inside the studio.</span>
            </h2>
          </div>
          {isPlaceholder && (
            <p className="text-xs text-white/25 font-mono max-w-xs">
              Module details will be confirmed and updated before launch.
            </p>
          )}
        </div>

        {/* Module list */}
        <div className="space-y-0 border border-white/6 rounded-2xl overflow-hidden">
          {modules.map((mod, i) => (
            <div
              key={mod.id}
              className="flex gap-6 p-6 md:p-8 border-b border-white/5 last:border-0 bg-[#0a0a0a] hover:bg-[#141414] transition-colors group"
            >
              <div className="font-mono text-xs text-[#E8DEFA]/30 mt-0.5 w-8 shrink-0 group-hover:text-[#E8DEFA]/60 transition-colors">
                [{String(i + 1).padStart(2, '0')}]
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span className="font-mono text-[10px] text-[#E8DEFA]/40 tracking-widest uppercase shrink-0">
                    {mod.weekLabel}
                  </span>
                  <h3 className="text-sm md:text-base font-semibold text-white/90">
                    {mod.title}
                  </h3>
                </div>
                {mod.description && (
                  <p className="text-sm text-white/35 mt-2 leading-relaxed">{mod.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
