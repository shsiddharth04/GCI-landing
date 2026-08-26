import { motion } from 'motion/react'
import { fadeUp, staggerContainer, viewportOnce } from '../lib/motion'

const WHY_ITEMS = [
  { index: '01', title: 'A real booking pipeline, not a diploma.', body: 'Every graduate gets discoverable on the GCI marketplace from day one. Hosts with real budgets, AI-matched to your sound. No cold emails, no industry gatekeepers.' },
  { index: '02', title: 'Hands-on with real equipment.', body: 'You learn on professional DJ gear inside our Gurugram studio. Not a simulation. Not a YouTube tutorial. You play, you make mistakes, you get better.' },
]

export default function WhyAcademy() {
  return (
    <section style={{ padding: '112px 24px', background: '#050505' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce}
          variants={fadeUp}
          style={{ marginBottom: '64px', maxWidth: '640px' }}
        >
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.28em', color: 'rgba(226,169,241,0.4)', textTransform: 'uppercase', marginBottom: '16px' }}>
            Why GCI Academy
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Not just a certificate.<br />
            <span style={{ color: '#e2a9f1' }}>A booking pipeline.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce}
          variants={staggerContainer(0.12)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1px',
            background: 'rgba(226,169,241,0.1)',
            border: '1px solid rgba(226,169,241,0.1)',
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
                if (hairline) hairline.style.background = 'linear-gradient(90deg, transparent, rgba(226,169,241,0.85), transparent)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = '#0f0d18'
                const hairline = (e.currentTarget as HTMLDivElement).querySelector('.card-hairline') as HTMLElement | null
                if (hairline) hairline.style.background = 'linear-gradient(90deg, transparent, rgba(226,169,241,0.5), transparent)'
              }}
            >
              <div className="card-hairline" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.5), transparent)', marginBottom: '32px', transition: 'background 0.2s' }} />

              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '32px',
                color: '#e2a9f1',
                fontWeight: 700,
                marginBottom: '20px',
                letterSpacing: '0.06em',
                lineHeight: 1,
              }}>
                [{index}]
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px', lineHeight: 1.35, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
