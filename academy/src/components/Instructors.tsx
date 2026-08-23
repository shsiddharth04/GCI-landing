import { Star } from 'lucide-react'
import { loadSettings } from '../admin/settings'

function PlaceholderCard() {
  return (
    <div style={{ background: '#0f0d18', border: '1px solid rgba(226,169,241,0.1)', padding: '28px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.4), transparent)' }} />
      <div style={{ width: '44px', height: '44px', background: 'rgba(226,169,241,0.07)', marginBottom: '20px' }} />
      <div style={{ height: '14px', width: '120px', background: 'rgba(255,255,255,0.06)', marginBottom: '8px' }} />
      <div style={{ height: '10px', width: '90px', background: 'rgba(226,169,241,0.1)', marginBottom: '20px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ height: '10px', background: 'rgba(255,255,255,0.04)', width: '100%' }} />
        <div style={{ height: '10px', background: 'rgba(255,255,255,0.04)', width: '80%' }} />
      </div>
      <div style={{ marginTop: '16px', fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>[INSTRUCTOR — TBC]</div>
    </div>
  )
}

export default function Instructors() {
  const { instructors } = loadSettings()

  return (
    <section id="instructors" style={{ padding: '112px 24px', background: '#050505' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Taught by
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Practitioners.<br /><span style={{ color: '#e2a9f1' }}>Not academics.</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.38)', marginTop: '16px', maxWidth: '480px', lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Every instructor has operated inside the live music and DJ scene. Real gigs. Real bookings. Real failures.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px', background: 'rgba(226,169,241,0.08)' }}>
          {instructors.length === 0 ? (
            <><PlaceholderCard /><PlaceholderCard /><PlaceholderCard /></>
          ) : (
            instructors.map(inst => (
              <div key={inst.id} style={{ background: '#0f0d18', border: 'none', position: 'relative', transition: 'background 0.2s', overflow: 'hidden' }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = '#130f1e')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = '#0f0d18')}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.4), transparent)', zIndex: 2 }} />

                {/* Photo — full-bleed top with duotone overlay */}
                {inst.photoUrl ? (
                  <div style={{ position: 'relative', width: '100%', height: '320px', overflow: 'hidden' }}>
                    <img
                      src={inst.photoUrl}
                      alt={inst.name}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%',
                        display: 'block',
                        filter: 'grayscale(85%) contrast(1.05) brightness(1.15)',
                      }}
                    />
                    {/* Subtle lavender tint */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, rgba(226,169,241,0.06) 0%, rgba(10,4,20,0.2) 100%)',
                    }} />
                    {/* Bottom fade into card */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                      background: 'linear-gradient(to bottom, transparent, #0f0d18)',
                    }} />
                  </div>
                ) : (
                  <div style={{ width: '44px', height: '44px', background: 'rgba(226,169,241,0.1)', color: '#e2a9f1', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '28px 28px 20px' }}>
                    {inst.initials || inst.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div style={{ padding: inst.photoUrl ? '20px 28px 28px' : '0 28px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{inst.name}</span>
                    {inst.isLead && <Star size={11} style={{ color: '#e2a9f1', fill: 'rgba(226,169,241,0.3)' }} />}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.55)', letterSpacing: '0.16em', marginBottom: '16px', textTransform: 'uppercase' }}>{inst.role}</div>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{inst.bio}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
