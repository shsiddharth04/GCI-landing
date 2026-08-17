import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { loadSettings } from '../admin/settings'

const BASE_FAQS = [
  {
    q: 'Do I need prior DJ experience to join the masterclass?',
    a: 'No. The masterclass is beginner-friendly by design. Come curious — not prepared.',
  },
  {
    q: 'What equipment will I be using during the course?',
    a: 'You will train on professional club-standard gear inside GCI Studio. Full details are confirmed before enrollment.',
  },
  {
    q: 'Is the masterclass genuinely free?',
    a: 'Yes. No payment. No hidden fees. Capacity is capped — register early to secure a seat.',
  },
  {
    q: 'Where is GCI Studio?',
    a: 'In Gurugram. The exact address is sent via confirmation email after you register.',
  },
  {
    q: 'What happens after I complete the DJ Course?',
    a: 'You graduate booking-ready on the GCI marketplace. Real hosts, AI-matched to your sound, with automated contract protection on every gig.',
  },
  {
    q: 'Is there parking at the studio?',
    a: 'Parking and transit details are included in your registration confirmation.',
  },
  {
    q: 'Can I enroll in the course without attending the masterclass?',
    a: 'Yes — the masterclass is the recommended starting point, not a prerequisite.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const settings = loadSettings()

  const studioAddress = settings.masterclass.studioAddress
  const faqs = studioAddress
    ? BASE_FAQS.map(f =>
        f.q.includes('Where is GCI Studio')
          ? { ...f, a: studioAddress }
          : f
      )
    : BASE_FAQS

  return (
    <section id="faq" className="py-28 px-6 bg-[#141414]/40">
      <div className="max-w-3xl mx-auto">
        <div className="mb-14">
          <p className="font-mono text-[10px] text-[#E8DEFA]/40 tracking-widest uppercase mb-4">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Questions.<br />
            <span className="text-[#E8DEFA]">Straight answers.</span>
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map(({ q, a }, i) => (
            <div
              key={i}
              className="border border-white/6 rounded-xl overflow-hidden bg-[#0a0a0a]"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-sm font-medium hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white/80">{q}</span>
                <ChevronDown
                  size={15}
                  className={`shrink-0 text-[#E8DEFA]/30 transition-transform ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-white/45 leading-relaxed border-t border-white/4 pt-4">
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
