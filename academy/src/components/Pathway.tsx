import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { loadSettings } from '../admin/settings'
import { fadeUp, viewportOnce } from '../lib/motion'
import MasterclassForm from './MasterclassForm'
import CallbackForm from './CallbackForm'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
    </div>
  )
}

export default function Pathway() {
  const { course, masterclass } = loadSettings()
  const [callbackOpen, setCallbackOpen] = useState(false)

  const courseFee = course.fee ? `₹${Number(course.fee).toLocaleString('en-IN')}` : ''

  return (
    <>
      {/* ── Masterclass ─────────────────────────────────────────── */}
      <section id="masterclass" style={{ background: '#e2a9f1', padding: '112px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(5,5,5,0.06) 0%, transparent 100%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative' }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

            {/* Left: copy + form */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewportOnce}
              variants={fadeUp}
              style={{ maxWidth: '480px', flex: 1 }}
            >
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(5,5,5,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '16px' }}>
                [01] Start here
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#050505', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Free Masterclass.<br />Inside the studio.
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(5,5,5,0.58)', lineHeight: 1.7, marginBottom: '8px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {masterclass.whatsInside}
              </p>

              <MasterclassForm />
            </motion.div>

            {/* Right: details card */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewportOnce}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, delay: 0.12, ease: 'easeOut' } } }}
              style={{
                background: '#050505', border: '1px solid rgba(226,169,241,0.15)',
                padding: '28px', minWidth: '260px', position: 'relative',
                boxShadow: '0 0 60px rgba(5,5,5,0.4)',
                alignSelf: 'flex-start',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.6), transparent)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { label: 'Location', value: 'GCI Studio, Gurugram' },
                  { label: 'Cost', value: 'Free  ·  ₹2,500 value' },
                ].map(row => <DetailRow key={row.label} {...row} />)}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Pathway strip ───────────────────────────────────────── */}
      <div style={{ background: '#0f0d18', borderTop: '1px solid rgba(226,169,241,0.08)', borderBottom: '1px solid rgba(226,169,241,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Masterclass</span>
        <ArrowRight size={13} style={{ color: 'rgba(226,169,241,0.35)' }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#e2a9f1', letterSpacing: '0.22em', textTransform: 'uppercase' }}>DJ Course</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.18)', marginLeft: '8px' }}>complete the masterclass, enroll in the course</span>
      </div>

      {/* ── DJ Course ───────────────────────────────────────────── */}
      <section id="course" style={{ background: '#050505', padding: '112px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

            {/* Left: copy + callback CTA */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewportOnce}
              variants={fadeUp}
              style={{ maxWidth: '480px', flex: 1 }}
            >
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '16px' }}>
                [02] Go deeper
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                The DJ Course.<br /><span style={{ color: '#e2a9f1' }}>The real thing.</span>
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, marginBottom: '32px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                In-studio, Gurugram. The full curriculum across 9 modules: gear, theory, live sets, Rekordbox, and the business of being a DJ. Graduate booking-ready and listed on the GCI marketplace.
              </p>

              <AnimatePresence mode="wait">
                {!callbackOpen ? (
                  <motion.button
                    key="cta"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => setCallbackOpen(true)}
                    style={{
                      background: '#e2a9f1', color: '#050505',
                      fontWeight: 700, padding: '16px 28px', fontSize: '13px',
                      border: 'none', cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      boxShadow: '0 0 40px rgba(226,169,241,0.45)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eeaeff'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 55px rgba(226,169,241,0.65)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#e2a9f1'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(226,169,241,0.45)' }}
                  >
                    Join the DJ Course →
                  </motion.button>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    style={{
                      background: '#0f0d18',
                      border: '1px solid rgba(226,169,241,0.15)',
                      padding: '24px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.55), transparent)' }} />
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '16px' }}>
                      Leave your details
                    </div>
                    <CallbackForm onClose={() => setCallbackOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Right: details card */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewportOnce}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, delay: 0.12, ease: 'easeOut' } } }}
              style={{
                background: '#0f0d18', border: '1px solid rgba(226,169,241,0.14)',
                padding: '28px', minWidth: '260px', position: 'relative',
                alignSelf: 'flex-start',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.5), transparent)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { label: 'Duration', value: '2 months' },
                  { label: 'Format', value: 'In-studio, Gurugram' },
                  { label: 'Equipment', value: 'Pioneer XDJ-RX3, Sennheiser HD 25 Plus' },
                  { label: 'Batch size', value: '3 students (by design)' },
                  ...(courseFee ? [{ label: 'Fee', value: courseFee }] : []),
                ].map(row => <DetailRow key={row.label} {...row} />)}
              </div>
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(226,169,241,0.08)' }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(226,169,241,0.3)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '6px' }}>Deposit</div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {course.refundPolicy}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
