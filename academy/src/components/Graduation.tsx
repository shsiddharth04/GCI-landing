const OUTCOMES = [
  {
    index: '01',
    title: 'Certificate',
    body: 'GCI Music Academy certificate of completion. Named, dated, yours.',
    highlight: false,
  },
  {
    index: '02',
    title: 'GCI Merch',
    body: 'A physical merch pack from the GCI brand. Because you earned something you can wear.',
    highlight: false,
  },
  {
    index: '03',
    title: 'Marketplace onboarding',
    body: 'Your profile goes live on the GCI booking platform from day one. Hosts with real budgets, AI-matched to your sound. No cold emails, no industry gatekeepers.',
    highlight: true,
  },
]

export default function Graduation() {
  return (
    <section style={{ background: '#e2a9f1', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle background texture */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(5,5,5,0.08) 0%, transparent 100%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1152px', margin: '0 auto', position: 'relative' }}>
        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(5,5,5,0.4)', textTransform: 'uppercase', marginBottom: '16px' }}>
            What you graduate with
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#050505', lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Finish the course.<br />Enter the ecosystem.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2px', background: 'rgba(5,5,5,0.12)' }}>
          {OUTCOMES.map(({ index, title, body, highlight }) => (
            <div
              key={index}
              style={{
                background: highlight ? '#050505' : 'rgba(5,5,5,0.06)',
                padding: '40px',
                position: 'relative',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { if (!highlight) (e.currentTarget as HTMLDivElement).style.background = 'rgba(5,5,5,0.1)' }}
              onMouseLeave={e => { if (!highlight) (e.currentTarget as HTMLDivElement).style.background = 'rgba(5,5,5,0.06)' }}
            >
              <div style={{ height: '1px', background: highlight ? 'linear-gradient(90deg, transparent, rgba(226,169,241,0.6), transparent)' : 'linear-gradient(90deg, transparent, rgba(5,5,5,0.3), transparent)', marginBottom: '32px' }} />

              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '20px', color: highlight ? '#e2a9f1' : 'rgba(5,5,5,0.4)' }}>
                [{index}]
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', lineHeight: 1.25, letterSpacing: '-0.01em', color: highlight ? 'white' : '#050505', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {title}
              </h3>

              <p style={{ fontSize: '13px', lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif", color: highlight ? 'rgba(255,255,255,0.55)' : 'rgba(5,5,5,0.55)' }}>
                {body}
              </p>

              {highlight && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(226,169,241,0.12)' }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: '#e2a9f1', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    The GCI difference ↗
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
