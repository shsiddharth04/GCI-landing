import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'
import { loadSettings } from '../admin/settings'
import { fadeUp, viewportOnce } from '../lib/motion'

const BASE_FAQS = [
  {
    q: 'Do I need prior DJ experience to join the masterclass?',
    a: 'No. The masterclass is beginner-friendly by design. Come curious, not prepared.',
  },
  {
    q: 'What equipment will I be using during the course?',
    a: "You train on the Pioneer XDJ-RX3, the same control-panel architecture as the CDJ-3000 and DJM-900NXS2 used in clubs worldwide, paired with studio monitors and Sennheiser HD 25 Plus headphones. You don't train on watered-down gear.",
  },
  {
    q: 'How many students are in each batch?',
    a: "3 students per batch. Intentionally. There's no back-row anonymity, no waiting your turn while a crowded room gets the instructor's attention. It's direct, hands-on mentorship from day one.",
  },
  {
    q: 'Is the masterclass genuinely free?',
    a: "Yes. No payment, no hidden fees. It's a ₹2,500 value session, yours at no cost. Capacity is capped, so register early.",
  },
  {
    q: 'Is there a deposit to enroll in the DJ Course?',
    a: '10% of the course fee (₹2,220) confirms your seat. This deposit is non-refundable. The remainder is due before the first session.',
  },
  {
    q: 'Where is GCI Studio?',
    a: 'In Gurugram. The exact address is sent via confirmation after you register for the masterclass.',
  },
  {
    q: 'What happens after I complete the DJ Course?',
    a: "You're onboarded onto the GigCultureIndia platform as a listed artist. Your profile enters our AI vibe-matching engine, connecting you directly to venues, event hosts and organizers looking for artists like you. Real bookings. Automated contracts. You don't just finish a course. You become part of the ecosystem.",
  },
  {
    q: 'Can I enroll in the course without attending the masterclass?',
    a: 'Yes, the masterclass is the recommended starting point, not a hard prerequisite.',
  },
  {
    q: 'Do I get any software or resources to keep after the course?',
    a: 'Yes. You receive curated reference material, practice tracks, guides, and your Rekordbox workflow setup to continue building outside of sessions.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const { masterclass } = loadSettings()

  const studioAnswer = (() => {
    const a1 = masterclass.studioAddress
    const a2 = masterclass.secondStudioAddress
    if (a1 && a2) return `Two studio locations in Gurugram. Masters Union students: ${a1}. All other students: ${a2}. Your assigned studio is confirmed in your registration confirmation.`
    if (a1) return a1
    return null
  })()

  const faqs = studioAnswer
    ? BASE_FAQS.map(f => f.q.includes('Where is GCI Studio') ? { ...f, a: studioAnswer } : f)
    : BASE_FAQS

  return (
    <section id="faq" style={{ padding: '112px 24px', background: '#0a0810' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewportOnce}
          variants={fadeUp}
          style={{ marginBottom: '56px' }}
        >
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '16px' }}>
            FAQ
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Questions.<br /><span style={{ color: '#e2a9f1' }}>Straight answers.</span>
          </h2>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {faqs.map(({ q, a }, i) => (
            <div key={i} style={{ background: '#0f0d18', border: '1px solid rgba(226,169,241,0.08)', overflow: 'hidden', position: 'relative' }}>
              {i === 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.45), transparent)' }} />}
              <button onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '16px', padding: '20px 24px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'white',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(226,169,241,0.03)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{q}</span>
                <ChevronDown size={15} style={{ flexShrink: 0, color: 'rgba(226,169,241,0.35)', transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {open === i && (
                <div style={{ padding: '0 24px 20px', paddingTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, borderTop: '1px solid rgba(226,169,241,0.06)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
