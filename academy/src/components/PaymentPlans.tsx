import { motion } from 'motion/react'
import { loadSettings } from '../admin/settings'
import { fadeUp, staggerContainer, viewportOnce } from '../lib/motion'

export default function PaymentPlans() {
  const { course } = loadSettings()

  const plans = (() => {
    const base = course.paymentPlans ?? []
    if (course.emiAvailable && course.emiDetails) {
      return [...base, { label: 'EMI', dueSchedule: course.emiDetails, note: 'Subject to eligibility.', isHighlighted: false }]
    }
    return base
  })()

  if (plans.length === 0) return null

  const feeLabel = course.fee ? `₹${Number(course.fee).toLocaleString('en-IN')}` : '[COURSE FEE]'

  return (
    <section style={{ padding: '96px 24px', background: '#050505' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce}
          variants={fadeUp}
          style={{ marginBottom: '56px' }}
        >
          <p style={{
            display: 'inline-block',
            fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.28em',
            color: '#d4bfff', textTransform: 'uppercase', marginBottom: '16px',
            border: '1px solid rgba(212,191,255,0.5)', background: 'rgba(212,191,255,0.1)',
            padding: '5px 12px',
          }}>
            Flexible payment
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            The course fee,<br /><span style={{ color: '#d4bfff' }}>paid in three parts.</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.38)', marginTop: '16px', maxWidth: '420px', lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            The DJ Course is {feeLabel} total. Choose the structure that works for you.
          </p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`, gap: '1px', background: 'rgba(212,191,255,0.1)', border: '1px solid rgba(212,191,255,0.1)', overflow: 'hidden' }}
        >
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              style={{
                background: plan.isHighlighted ? '#130f1e' : '#0f0d18',
                padding: '36px 32px',
                position: 'relative',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#130f1e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = plan.isHighlighted ? '#130f1e' : '#0f0d18' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: plan.isHighlighted ? 'linear-gradient(90deg, transparent, rgba(212,191,255,0.7), transparent)' : 'linear-gradient(90deg, transparent, rgba(212,191,255,0.3), transparent)' }} />

              {plan.isHighlighted && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: '#050505', background: '#d4bfff', letterSpacing: '0.16em', textTransform: 'uppercase', padding: '4px 10px' }}>
                    Most common
                  </span>
                </div>
              )}

              <div style={{ fontSize: '17px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '14px', color: plan.isHighlighted ? 'white' : 'rgba(255,255,255,0.85)' }}>
                {plan.label}
              </div>

              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: plan.note ? '12px' : '0' }}>
                {plan.dueSchedule}
              </p>

              {plan.note && (
                <p style={{ fontSize: '11px', color: 'rgba(212,191,255,0.4)', lineHeight: 1.5, fontFamily: "'Space Mono', monospace" }}>
                  {plan.note}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
