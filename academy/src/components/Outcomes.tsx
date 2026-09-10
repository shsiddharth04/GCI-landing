import { motion } from 'motion/react'
import { fadeUp, staggerContainer, viewportOnce } from '../lib/motion'

const WHY_ITEMS = [
  { index: '01', title: 'A real booking pipeline, not a diploma.', body: 'Every graduate gets onboarded onto the GCI marketplace upon completion. Hosts with real budgets, AI-matched to your sound. No cold emails, no industry gatekeepers.' },
  { index: '02', title: 'Hands-on with real equipment.', body: 'You learn on professional DJ gear inside our Gurugram studio. Not a simulation. Not a YouTube tutorial. You play, you make mistakes, you get better.' },
]

export default function WhyAcademy() {
  return (
    <section style={{ padding: 'clamp(64px, 10vw, 112px) 24px', background: '#050505' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce}
          variants={fadeUp}
          style={{ marginBottom: '64px', maxWidth: '640px' }}
        >
          <p style={{
            display: 'inline-block',
            fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.28em',
            color: '#d4bfff', textTransform: 'uppercase', marginBottom: '16px',
            border: '1px solid rgba(212,191,255,0.5)', background: 'rgba(212,191,255,0.1)',
            padding: '5px 12px',
          }}>
            Why GCI Academy
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Not just a certificate.<br />
            <span style={{ color: '#d4bfff' }}>A booking pipeline.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce}
          variants={staggerContainer(0.12)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1px',
            background: 'rgba(212,191,255,0.1)',
            border: '1px solid rgba(212,191,255,0.1)',
            overflow: 'hidden',
          }}
        >
          {WHY_ITEMS.map(({ index, title, body }) => (
            <motion.div
              key={index}
              variants={fadeUp}
              style={{ background: '#0f0d18', padding: '40px', position: 'relative', overflow: 'hidden', transition: 'background 0.2s' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = '#130f1e'
                const hairline = (e.currentTarget as HTMLDivElement).querySelector('.card-hairline') as HTMLElement | null
                if (hairline) hairline.style.background = 'linear-gradient(90deg, transparent, rgba(212,191,255,0.85), transparent)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = '#0f0d18'
                const hairline = (e.currentTarget as HTMLDivElement).querySelector('.card-hairline') as HTMLElement | null
                if (hairline) hairline.style.background = 'linear-gradient(90deg, transparent, rgba(212,191,255,0.5), transparent)'
              }}
            >
              {/* Ghost number — poster texture behind content */}
              <div aria-hidden style={{
                position: 'absolute', bottom: '-10px', right: '16px',
                fontFamily: "'Space Mono', monospace",
                fontSize: 'clamp(80px, 12vw, 120px)',
                fontWeight: 700, color: '#d4bfff', opacity: 0.04,
                lineHeight: 1, userSelect: 'none', pointerEvents: 'none', zIndex: 0,
              }}>
                {index}
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="card-hairline" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.5), transparent)', marginBottom: '32px', transition: 'background 0.2s' }} />

                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '32px',
                  color: '#d4bfff',
                  fontWeight: 700,
                  marginBottom: '20px',
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                }}>
                  [{index}]
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px', lineHeight: 1.35, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
