import { loadSettings } from '../admin/settings'

const PLACEHOLDER_MODULES = [
  { weekLabel: 'Session 1', title: 'Understanding sound & the room' },
  { weekLabel: 'Session 2', title: 'Reading energy: crowd dynamics' },
  { weekLabel: 'Session 3', title: 'Equipment deep-dive' },
  { weekLabel: 'Session 4', title: 'Track selection & crate building' },
  { weekLabel: 'Session 5', title: 'Mixing fundamentals' },
  { weekLabel: 'Session 6', title: 'Live set construction' },
  { weekLabel: 'Session 7', title: 'Business: pricing, contracts, bookings' },
  { weekLabel: 'Session 8', title: 'Capstone: live session + feedback' },
].map((m, i) => ({ ...m, id: String(i), order: i, description: '' }))

export default function Curriculum() {
  const settings = loadSettings()
  const modules = settings.curriculum.length > 0
    ? [...settings.curriculum].sort((a, b) => a.order - b.order)
    : PLACEHOLDER_MODULES

  return (
    <section id="curriculum" style={{ padding: '112px 24px', background: '#0a0810' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6" style={{ marginBottom: '56px' }}>
          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>
              The curriculum
            </p>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Every session.<br /><span style={{ color: '#e2a9f1' }}>Inside the studio.</span>
            </h2>
          </div>
          {settings.curriculum.length === 0 && (
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.2)', maxWidth: '220px', lineHeight: 1.8 }}>
              Module details confirmed before launch.
            </p>
          )}
        </div>

        {/* Module list */}
        <div style={{ border: '1px solid rgba(226,169,241,0.1)', overflow: 'hidden', position: 'relative' }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.5), transparent)' }} />

          {modules.map((mod, i) => (
            <div key={mod.id}
              style={{
                display: 'flex', gap: '24px', padding: '24px 32px',
                borderBottom: i < modules.length - 1 ? '1px solid rgba(226,169,241,0.07)' : 'none',
                background: '#0a0810', transition: 'background 0.2s', cursor: 'default',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = '#0f0d18')}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = '#0a0810')}
            >
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'rgba(226,169,241,0.35)', marginTop: '2px', width: '32px', flexShrink: 0, transition: 'color 0.2s' }}>
                [{String(i + 1).padStart(2, '0')}]
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(226,169,241,0.45)', letterSpacing: '0.24em', textTransform: 'uppercase', flexShrink: 0 }}>
                    {mod.weekLabel}
                  </span>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {mod.title}
                  </h3>
                </div>
                {mod.description && (
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '6px', lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{mod.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
