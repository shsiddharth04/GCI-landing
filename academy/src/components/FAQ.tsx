import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Do I need to already be on the GCI platform to join?',
    a: 'No — the Academy is designed to prepare you for the platform. Completing the program fast-tracks your profile approval and gives you early access to Cohort 1 matching.',
  },
  {
    q: 'How much time per week does this require?',
    a: 'Roughly 3–5 hours per week. All content is async, so you move at your own pace within each module window.',
  },
  {
    q: 'Is there a cost to join?',
    a: 'Cohort 1 is free for early applicants. Future cohorts will be paid. Apply now to lock in your free spot.',
  },
  {
      q: "I'm a host, not a musician — is this for me?",
    a: 'Yes. The Host Track is a first-class curriculum, not an afterthought. Half our modules are designed around the host experience.',
  },
  {
    q: 'What happens after I finish?',
    a: 'You get a GCI Academy badge on your profile, priority matching in the first post-cohort booking window, and access to the alumni community.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked</h2>
        </div>

        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div
              key={i}
              className="border border-white/8 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-sm font-medium hover:bg-white/[0.03] transition-colors"
              >
                <span>{q}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-white/40 transition-transform ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-white/50 leading-relaxed border-t border-white/5 pt-4">
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
