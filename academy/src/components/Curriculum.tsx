const weeks = [
  { week: 'Week 1–2', title: 'Foundations', desc: 'How the live music economy works, where money moves, and where independent artists and hosts fit in.' },
  { week: 'Week 3', title: 'Platform Onboarding', desc: 'Set up your GCI profile, connect your Spotify or SoundCloud, and understand how the AI matching engine reads your data.' },
  { week: 'Week 4', title: 'Pricing & Negotiation', desc: 'Build a personal pricing framework. Learn when to hold your rate and when flexibility wins a long-term relationship.' },
  { week: 'Week 5', title: 'Contracts & Legal Basics', desc: 'Understand what a booking contract must include, common red flags, and how GCI automates contract protection.' },
  { week: 'Week 6', title: 'Marketing & Discoverability', desc: 'Build a digital presence that feeds the algorithm: SoundCloud strategy, press kit essentials, and social proof.' },
  { week: 'Week 7', title: 'Running the Booking Flow', desc: 'End-to-end walkthrough of a real booking — from match to show night — using the GCI platform.' },
  { week: 'Week 8', title: 'Capstone & Launch', desc: 'Complete your first live booking or event brief on the platform with cohort peer review and instructor feedback.' },
]

export default function Curriculum() {
  return (
    <section id="curriculum" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">8-week curriculum</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Every module is built around real scenarios from the GCI marketplace — not hypothetical case studies.
          </p>
        </div>

        <div className="relative pl-6 border-l border-white/8">
          {weeks.map(({ week, title, desc }, i) => (
            <div key={i} className="mb-10 relative">
              <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full border-2 border-violet-500 bg-[#080808]" />
              <div className="text-xs text-violet-400 font-semibold mb-1">{week}</div>
              <h3 className="text-base font-semibold mb-1">{title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
