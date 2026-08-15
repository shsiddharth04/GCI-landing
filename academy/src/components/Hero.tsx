export default function Hero() {
  return (
    <section className="pt-40 pb-28 px-6 text-center relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Cohort 1 — Applications Open
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
          Learn to book gigs.<br />
          <span className="text-violet-400">Get paid doing what you love.</span>
        </h1>

        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          GCI Academy is a hands-on, cohort-based program teaching independent musicians and event hosts
          how to navigate the live music industry — from pricing and contracts to growth and branding.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center" id="apply">
          <a
            href="#tracks"
            className="bg-violet-600 hover:bg-violet-500 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-colors"
          >
            Apply for Cohort 1
          </a>
          <a
            href="#curriculum"
            className="border border-white/10 hover:border-white/20 text-white/70 hover:text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-colors"
          >
            View Curriculum
          </a>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
          {[
            { stat: '8 weeks', label: 'Program length' },
            { stat: '2 tracks', label: 'Artist & Host' },
            { stat: '100%', label: 'Online & async' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-white">{stat}</div>
              <div className="text-xs text-white/40 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
