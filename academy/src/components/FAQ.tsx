import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { loadSettings } from '../admin/settings'

const BASE_FAQS = [
  { q: 'Do I need prior DJ experience to join the masterclass?', a: 'No. The masterclass is beginner-friendly by design. Come curious — not prepared.' },
  { q: 'What equipment will I be using during the course?', a: 'You will train on professional club-standard gear inside GCI Studio. Full details confirmed before enrollment.' },
  { q: 'Is the masterclass genuinely free?', a: 'Yes. No payment. No hidden fees. Capacity is capped — register early to secure a seat.' },
  { q: 'Where is GCI Studio?', a: 'In Gurugram. The exact address is sent via confirmation email after you register.' },
  { q: 'What happens after I complete the DJ Course?', a: 'You graduate booking-ready on the GCI marketplace. Real hosts, AI-matched to your sound, with automated contract protection on every gig.' },
  { q: 'Is there parking at the studio?', a: 'Parking and transit details are included in your registration confirmation.' },
  { q: 'Can I enroll in the course without attending the masterclass?', a: 'Yes — the masterclass is the recommended starting point, not a prerequisite.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const { masterclass } = loadSettings()

  const faqs = masterclass.studioAddress
    ? BASE_FAQS.map(f => f.q.includes('Where is GCI Studio') ? { ...f, a: masterclass.studioAddress } : f)
    : BASE_FAQS

  return (
    <section id="faq" style={{ padding: '112px 24px', background: '#0a0810' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>
            FAQ
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Questions.<br /><span style={{ color: '#e2a9f1' }}>Straight answers.</span>
          </h2>
        </div>

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
                <div style={{ padding: '0 24px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, borderTop: '1px solid rgba(226,169,241,0.06)', paddingTop: '16px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
