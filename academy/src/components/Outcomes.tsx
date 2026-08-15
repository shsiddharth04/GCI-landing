const outcomes = [
  { number: '3x', label: 'Average gig rate increase for artist graduates' },
  { number: '< 48h', label: 'Time to first booking match after completing onboarding module' },
  { number: '0 disputes', label: 'Contract-related payment disputes among cohort alumni' },
  { number: '8 weeks', label: 'To go from application to booking-ready on the platform' },
]

export default function Outcomes() {
  return (
    <section className="py-20 px-6 border-y border-white/5 bg-white/[0.015]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {outcomes.map(({ number, label }) => (
            <div key={label} className="flex flex-col gap-2">
              <span className="text-4xl md:text-5xl font-extrabold text-violet-400">{number}</span>
              <span className="text-xs text-white/40 leading-relaxed max-w-[150px] mx-auto">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
