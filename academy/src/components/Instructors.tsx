import { Star } from 'lucide-react'
import { loadSettings } from '../admin/settings'

function PlaceholderCard({ index }: { index: number }) {
  return (
    <div className="bg-[#141414] border border-white/6 rounded-2xl p-7">
      <div className="w-12 h-12 rounded-xl bg-white/5 mb-5" />
      <div className="h-4 w-32 bg-white/5 rounded mb-2" />
      <div className="h-3 w-24 bg-[#E8DEFA]/10 rounded mb-5" />
      <div className="space-y-2">
        <div className="h-3 bg-white/4 rounded w-full" />
        <div className="h-3 bg-white/4 rounded w-4/5" />
      </div>
      <div className="mt-4 font-mono text-[10px] text-white/15">[INSTRUCTOR {index} — TBC]</div>
    </div>
  )
}

export default function Instructors() {
  const settings = loadSettings()
  const instructors = settings.instructors

  return (
    <section id="instructors" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="font-mono text-[10px] text-[#E8DEFA]/40 tracking-widest uppercase mb-4">Taught by</p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Practitioners.<br />
            <span className="text-[#E8DEFA]">Not academics.</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-lg text-sm leading-relaxed">
            Every instructor has operated inside the live music and DJ scene. Real gigs. Real bookings. Real failures.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {instructors.length === 0 ? (
            <>
              <PlaceholderCard index={1} />
              <PlaceholderCard index={2} />
              <PlaceholderCard index={3} />
            </>
          ) : (
            instructors.map((inst) => (
              <div key={inst.id} className="bg-[#141414] border border-white/6 rounded-2xl p-7 hover:border-[#E8DEFA]/15 transition-colors">
                {inst.photoUrl ? (
                  <img
                    src={inst.photoUrl}
                    alt={inst.name}
                    className="w-12 h-12 rounded-xl object-cover mb-5"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#E8DEFA]/10 text-[#E8DEFA] font-bold text-sm flex items-center justify-center mb-5">
                    {inst.initials || inst.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm">{inst.name}</span>
                  {inst.isLead && <Star size={11} className="text-[#E8DEFA]/60 fill-[#E8DEFA]/30" />}
                </div>
                <div className="font-mono text-[10px] text-[#E8DEFA]/50 tracking-wider mb-4">{inst.role}</div>
                <p className="text-sm text-white/40 leading-relaxed">{inst.bio}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
