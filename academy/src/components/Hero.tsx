import { loadSettings } from '../admin/settings'

const BAR_HEIGHTS = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.75, 0.45, 1, 0.55, 0.8, 0.35, 0.95]
const BAR_DELAYS = [0, 0.15, 0.3, 0.05, 0.45, 0.2, 0.6, 0.1, 0.35, 0.5, 0.25, 0.7, 0.4, 0.55, 0.15]

function Waveform({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-end gap-[3px] ${className}`}>
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="eq-bar w-[3px] rounded-full bg-[#E8DEFA]"
          style={{
            height: `${h * 40}px`,
            animationDelay: `${BAR_DELAYS[i]}s`,
            opacity: 0.4 + h * 0.5,
          }}
        />
      ))}
    </div>
  )
}

export default function Hero() {
  const settings = loadSettings()
  const { course, masterclass } = settings

  const batchLabel = course.batchStartDate
    ? new Date(course.batchStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '[BATCH START DATE]'

  const seatLabel = masterclass.seatCap ? `${masterclass.seatCap} seats` : '[SEAT CAP] seats'
  const feeLabel = course.fee ? `₹${Number(course.fee).toLocaleString('en-IN')}` : '[COURSE FEE]'

  return (
    <section className="min-h-screen flex flex-col justify-center pt-16 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#E8DEFA]/5 blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto w-full py-20">
        {/* Tag */}
        <div className="flex items-center gap-2 mb-8">
          <span className="font-mono text-[10px] text-[#E8DEFA]/50 tracking-widest uppercase border border-[#E8DEFA]/20 px-3 py-1.5 rounded-full">
            DJ Education · In-studio · Gurugram
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[106px] font-bold tracking-tight leading-[0.95] mb-8">
          Learn to<br />
          <span className="text-[#E8DEFA]">read a room.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base md:text-lg text-white/45 max-w-xl mb-10 leading-relaxed">
          GCI Music Academy is a hands-on DJ education program run out of our studio in Gurugram.
          Graduate directly into GCI's live-booking pipeline — not just a certificate.
        </p>

        {/* Dual CTA */}
        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <a
            href="#masterclass"
            className="inline-flex items-center justify-center gap-2 bg-[#E8DEFA] hover:bg-[#d4c8f0] text-[#0a0a0a] font-semibold px-7 py-4 rounded-xl text-sm transition-colors"
          >
            Register free — Masterclass
          </a>
          <a
            href="#course"
            className="inline-flex items-center justify-center gap-2 border border-white/12 hover:border-white/25 text-white/65 hover:text-white px-7 py-4 rounded-xl text-sm font-medium transition-colors"
          >
            View DJ Course — {feeLabel}
          </a>
        </div>

        {/* Waveform */}
        <div className="mb-14">
          <Waveform />
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          {[
            { label: 'Batch starts', value: batchLabel },
            { label: 'Masterclass seats', value: seatLabel },
            { label: 'Format', value: course.format === 'in-studio' ? 'In-studio only' : course.format === 'hybrid' ? 'Hybrid' : 'In-studio, Gurugram' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] text-white/25 uppercase tracking-widest">{label}</span>
              <span className="font-mono text-xs text-[#E8DEFA]/70">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
