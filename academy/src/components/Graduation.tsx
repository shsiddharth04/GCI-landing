import { motion } from 'motion/react'
import { fadeUp, staggerContainer, viewportOnce } from '../lib/motion'

const BAR_HEIGHTS = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.75, 0.45, 1, 0.55, 0.8]
const BAR_DELAYS = [0, 0.15, 0.3, 0.05, 0.45, 0.2, 0.6, 0.1, 0.35, 0.5, 0.25, 0.7, 0.4]

function MiniWaveform() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="eq-bar"
          style={{
            width: '2px',
            height: `${h * 24}px`,
            background: '#d4bfff',
            borderRadius: '1px',
            animationDelay: `${BAR_DELAYS[i]}s`,
            opacity: 0.35 + h * 0.25,
          }}
        />
      ))}
    </div>
  )
}

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
    body: 'Your profile goes live on the GCI booking platform upon completion. Hosts with real budgets, AI-matched to your sound. No cold emails, no industry gatekeepers.',
    highlight: true,
  },
]

export default function Graduation() {
  return (
    <section style={{ background: '#d4bfff', position: 'relative', overflow: 'hidden', borderTop: '3px solid #050505', borderBottom: '3px solid #050505' }}>
      <style>{`
        .graduation-section { padding: 64px 20px; }
        @media (min-width: 768px) { .graduation-section { padding: 96px 24px; } }
      `}</style>

      <div className="graduation-section lavender-scan" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(5,5,5,0.08) 0%, transparent 100%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1152px', margin: '0 auto', position: 'relative' }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewportOnce}
            variants={fadeUp}
            style={{ marginBottom: '56px' }}
          >
            <p style={{
              display: 'inline-block',
              fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.28em',
              color: '#d4bfff', textTransform: 'uppercase', marginBottom: '16px',
              background: '#050505', padding: '5px 12px',
            }}>
              What you graduate with
            </p>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3rem)', fontWeight: 800, color: '#050505', lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Finish the course.<br />Enter the ecosystem.
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewportOnce}
            variants={staggerContainer(0.1)}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2px', background: 'rgba(5,5,5,0.12)' }}
          >
            {OUTCOMES.map(({ index, title, body, highlight }) => (
              <motion.div
                key={index}
                variants={fadeUp}
                style={{
                  background: highlight ? '#050505' : 'rgba(5,5,5,0.06)',
                  padding: '40px',
                  position: 'relative',
                  transition: 'background 0.2s',
                  ...(highlight ? { boxShadow: '0 0 60px rgba(5,5,5,0.5)' } : {}),
                }}
                onMouseEnter={e => { if (!highlight) (e.currentTarget as HTMLDivElement).style.background = 'rgba(5,5,5,0.1)' }}
                onMouseLeave={e => { if (!highlight) (e.currentTarget as HTMLDivElement).style.background = 'rgba(5,5,5,0.06)' }}
              >
                <div style={{
                  height: '1px',
                  background: highlight
                    ? 'linear-gradient(90deg, transparent, rgba(212,191,255,0.6), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(5,5,5,0.3), transparent)',
                  marginBottom: '32px',
                }} />

                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  marginBottom: '20px',
                  color: highlight ? '#d4bfff' : 'rgba(5,5,5,0.4)',
                }}>
                  [{index}]
                </div>

                <h3 style={{
                  fontSize: highlight ? '22px' : '18px',
                  fontWeight: 800,
                  marginBottom: '14px',
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                  color: highlight ? 'white' : '#050505',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {title}
                </h3>

                <p style={{
                  fontSize: '14px',
                  lineHeight: 1.7,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: highlight ? 'rgba(255,255,255,0.55)' : 'rgba(5,5,5,0.55)',
                }}>
                  {body}
                </p>

                {highlight && (
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(212,191,255,0.12)' }}>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '10px',
                      color: '#d4bfff',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                    }}>
                      The GCI difference ↗
                    </span>
                  </div>
                )}

                {highlight && (
                  <div style={{
                    position: 'absolute',
                    bottom: '28px',
                    right: '28px',
                    pointerEvents: 'none',
                  }}>
                    <MiniWaveform />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
