import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { loadSettings } from '../admin/settings'
import { fadeUp, viewportOnce } from '../lib/motion'
import SessionPicker from './SessionPicker'
import CallbackForm from './CallbackForm'
import EnrollmentForm, { COURSE_DEPOSIT_ENABLED } from './EnrollmentForm'

function DetailRow({ label, value, originalValue }: { label: string; value: string; originalValue?: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        {originalValue && (
          <span style={{ fontSize: '12px', color: 'rgba(212,191,255,0.35)', textDecoration: 'line-through', fontFamily: "'Space Mono', monospace" }}>{originalValue}</span>
        )}
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: originalValue ? 700 : 400 }}>{value}</span>
      </div>
      {originalValue && (
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.45)', letterSpacing: '0.1em', marginTop: '4px' }}>₹179 masterclass fee credited on enrollment</div>
      )}
    </div>
  )
}

export default function Pathway() {
  const { course, masterclass } = loadSettings()
  const [ctaView, setCtaView] = useState<'idle' | 'enroll' | 'callback'>('idle')

  const courseFee = course.fee ? `₹${Number(course.fee).toLocaleString('en-IN')}` : ''
  const courseOriginalFee = course.originalFee ? `₹${Number(course.originalFee).toLocaleString('en-IN')}` : ''
  const masterclassFee = masterclass.fee ? `₹${Number(masterclass.fee).toLocaleString('en-IN')}` : '₹179'

  return (
    <>
      {/* ── Masterclass ─────────────────────────────────────────── */}
      <section id="masterclass" className="lavender-scan" style={{ background: '#d4bfff', padding: 'clamp(64px, 10vw, 112px) 24px', position: 'relative', overflow: 'hidden', borderTop: '3px solid #050505', borderBottom: '3px solid #050505' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(5,5,5,0.06) 0%, transparent 100%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative' }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

            {/* Left: copy + form */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewportOnce}
              variants={fadeUp}
              style={{ maxWidth: '480px', flex: 1 }}
            >
              <div style={{
                display: 'inline-block',
                fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#d4bfff',
                letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '16px',
                background: '#050505', padding: '5px 12px',
              }}>
                [01] Start here
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#050505', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                1-on-1 Masterclass.<br />Inside the studio.
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(5,5,5,0.58)', lineHeight: 1.7, marginBottom: '8px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {masterclass.whatsInside}
              </p>

              <SessionPicker />
            </motion.div>

            {/* Right: details card */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewportOnce}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, delay: 0.12, ease: 'easeOut' } } }}
              style={{
                background: '#050505', border: '1px solid rgba(212,191,255,0.15)',
                padding: '28px', minWidth: '260px', position: 'relative',
                boxShadow: '0 0 60px rgba(5,5,5,0.4)',
                alignSelf: 'flex-start',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.6), transparent)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <DetailRow label="Location" value={masterclass.studioAddress || masterclass.studioName || 'GCI Studio, Gurugram'} />
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '3px' }}>Cost</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{masterclassFee}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.45)', letterSpacing: '0.1em', marginTop: '4px' }}>Credited toward course fee on enrollment</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Pathway strip ───────────────────────────────────────── */}
      <div style={{ background: '#0f0d18', borderTop: '1px solid rgba(212,191,255,0.08)', borderBottom: '1px solid rgba(212,191,255,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Masterclass</span>
        <ArrowRight size={13} style={{ color: 'rgba(212,191,255,0.35)', flexShrink: 0 }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#d4bfff', letterSpacing: '0.22em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>DJ Course</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>complete the masterclass, enroll in the course</span>
      </div>

      {/* ── DJ Course ───────────────────────────────────────────── */}
      <section id="course" style={{ background: '#050505', padding: 'clamp(64px, 10vw, 112px) 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">

            {/* Full-width enrollment form — replaces the entire two-column layout */}
            {ctaView === 'enroll' && (
              <motion.div
                key="enroll-fullwidth"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <EnrollmentForm onBack={() => setCtaView('idle')} />
              </motion.div>
            )}

            {/* Two-column layout for idle + callback states */}
            {ctaView !== 'enroll' && (
              <motion.div
                key="course-two-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col md:flex-row md:items-start md:justify-between gap-10"
              >
                {/* Left: copy + CTAs */}
                <motion.div
                  initial="hidden" whileInView="visible" viewport={viewportOnce}
                  variants={fadeUp}
                  style={{ maxWidth: '480px', flex: 1 }}
                >
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    [02] Go deeper
                  </div>
                  <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    The DJ Course.<br /><span style={{ color: '#d4bfff' }}>The real thing.</span>
                  </h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, marginBottom: '32px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    In-studio, Gurugram. The full curriculum across 9 modules: gear, theory, live sets, Rekordbox, and the business of being a DJ. Graduate booking-ready and listed on the GCI marketplace.
                  </p>

                  <AnimatePresence mode="wait">
                    {ctaView === 'idle' && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px' }}
                      >
                        {COURSE_DEPOSIT_ENABLED ? (
                          <>
                            <button
                              onClick={() => setCtaView('enroll')}
                              style={{
                                background: '#d4bfff', color: '#050505',
                                fontWeight: 700, padding: '16px 28px', fontSize: '13px',
                                border: 'none', cursor: 'pointer',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                boxShadow: '0 0 40px rgba(212,191,255,0.45)',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e0d4ff'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 55px rgba(212,191,255,0.65)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#d4bfff'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(212,191,255,0.45)' }}
                            >
                              Enroll Now — ₹2,000 deposit →
                            </button>
                            <button
                              type="button"
                              onClick={() => setCtaView('callback')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                fontFamily: "'Space Mono', monospace", fontSize: '11px',
                                color: 'rgba(212,191,255,0.45)', letterSpacing: '0.1em',
                                transition: 'color 0.15s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.75)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.45)')}
                            >
                              Not sure? Request a callback →
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setCtaView('callback')}
                            style={{
                              background: '#d4bfff', color: '#050505',
                              fontWeight: 700, padding: '16px 28px', fontSize: '13px',
                              border: 'none', cursor: 'pointer',
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              boxShadow: '0 0 40px rgba(212,191,255,0.45)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e0d4ff'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 55px rgba(212,191,255,0.65)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#d4bfff'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(212,191,255,0.45)' }}
                          >
                            Join the DJ Course →
                          </button>
                        )}
                      </motion.div>
                    )}

                    {ctaView === 'callback' && (
                      <motion.div
                        key="callback"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        style={{ background: '#0f0d18', border: '1px solid rgba(212,191,255,0.15)', padding: '24px', position: 'relative' }}
                      >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.55), transparent)' }} />
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '16px' }}>
                          Leave your details
                        </div>
                        <CallbackForm onClose={() => setCtaView('idle')} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Right: details card */}
                <motion.div
                  initial="hidden" whileInView="visible" viewport={viewportOnce}
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, delay: 0.12, ease: 'easeOut' } } }}
                  style={{
                    background: '#0f0d18', border: '1px solid rgba(212,191,255,0.14)',
                    padding: '28px', minWidth: '260px', position: 'relative',
                    alignSelf: 'flex-start',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.5), transparent)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      { label: 'Duration', value: '2 months' },
                      { label: 'Studio', value: masterclass.studioAddress || masterclass.studioName || 'GCI Studio, Gurugram' },
                      { label: 'Equipment', value: 'Pioneer XDJ-RX3, Sennheiser HD 25 Plus' },
                      { label: 'Batch size', value: '3 students (by design)' },
                    ].map(row => <DetailRow key={row.label} label={row.label} value={row.value} />)}
                    {courseFee && (
                      <DetailRow label="Fee" value={courseFee} originalValue={courseOriginalFee || undefined} />
                    )}
                  </div>
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(212,191,255,0.08)' }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.3)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '6px' }}>Deposit</div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {course.refundPolicy}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>
    </>
  )
}
