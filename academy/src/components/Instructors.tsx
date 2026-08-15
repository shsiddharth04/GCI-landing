const instructors = [
  {
    name: 'Devith R.',
    role: 'Co-founder, GCI',
    bio: 'Built the GCI marketplace from the ground up. Brings hands-on experience connecting artists and hosts across India\'s independent event scene.',
    initials: 'DR',
  },
  {
    name: 'GCI Artist Network',
    role: 'Veteran independent musicians',
    bio: 'Guest sessions from working artists who have navigated the gig economy before platforms like GCI existed — hard-won lessons, unfiltered.',
    initials: 'GAN',
  },
  {
    name: 'GCI Host Council',
    role: 'Experienced event organizers',
    bio: 'Hosts who have used GCI to book 10+ events share their frameworks for briefing, budgeting, and building relationships with talent.',
    initials: 'GHC',
  },
]

export default function Instructors() {
  return (
    <section id="instructors" className="py-24 px-6 bg-white/[0.015] border-y border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Taught by practitioners</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            No academics. Every instructor has operated inside the GCI ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {instructors.map(({ name, role, bio, initials }) => (
            <div key={name} className="border border-white/8 bg-white/[0.03] rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-300 font-bold text-sm flex items-center justify-center mb-5">
                {initials}
              </div>
              <div className="font-semibold mb-0.5">{name}</div>
              <div className="text-xs text-violet-400 mb-4">{role}</div>
              <p className="text-sm text-white/45 leading-relaxed">{bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
