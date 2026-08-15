const tracks = [
  {
    tag: 'Artist Track',
    color: 'violet',
    title: 'From bedroom to booking',
    description:
      "For independent musicians ready to monetize their craft. You'll learn how to price gigs, write contracts, build your press kit, and get discovered through the GCI platform.",
    bullets: [
      'Pricing your sets — floor rates, negotiation, bonuses',
      'Contracts that protect you from flakes and no-pays',
      'Building a SoundCloud portfolio that converts hosts',
      'Platform walkthrough: getting matched and booked',
    ],
  },
  {
    tag: 'Host Track',
    color: 'indigo',
    title: 'Plan unforgettable events',
    description:
      'For event organizers who want to stop guessing on talent. Learn how to brief a vibe, read a match, negotiate with artists, and run a seamless booking from first contact to show night.',
    bullets: [
      'Writing a strong event brief hosts use to get matched',
      'How to interpret AI-curated artist recommendations',
      'Budget planning and how to split cost with artists',
      'Day-of logistics and post-event review frameworks',
    ],
  },
]

export default function Tracks() {
  return (
    <section id="tracks" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Two tracks. One mission.</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Whether you're performing or producing events, GCI Academy has a tailored curriculum built for your side of the marketplace.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {tracks.map((t) => (
            <div
              key={t.tag}
              className="border border-white/8 bg-white/[0.03] rounded-2xl p-8 hover:border-violet-500/30 transition-colors"
            >
              <span
                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5 ${
                  t.color === 'violet'
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'bg-indigo-500/15 text-indigo-300'
                }`}
              >
                {t.tag}
              </span>
              <h3 className="text-xl font-bold mb-3">{t.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6">{t.description}</p>
              <ul className="space-y-2.5">
                {t.bullets.map((b) => (
                  <li key={b} className="flex gap-3 items-start text-sm text-white/60">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
