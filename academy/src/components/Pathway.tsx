import { ArrowRight } from 'lucide-react'
import { loadSettings } from '../admin/settings'

export default function Pathway() {
  const settings = loadSettings()
  const { course, masterclass } = settings

  const masterclassDate = masterclass.date
    ? new Date(masterclass.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : '[MASTERCLASS DATE]'

  const masterclassTime = masterclass.time || '[TIME]'
  const seatsLeft = masterclass.seatCap ? `${masterclass.seatCap} seats` : '[SEAT CAP] seats'
  const courseFee = course.fee
    ? `₹${Number(course.fee).toLocaleString('en-IN')}`
    : '[COURSE FEE]'
  const batchStart = course.batchStartDate
    ? new Date(course.batchStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '[BATCH START DATE]'

  return (
    <>
      {/* Masterclass section */}
      <section id="masterclass" className="py-28 px-6 bg-[#E8DEFA]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            {/* Left */}
            <div className="md:max-w-xl">
              <div className="font-mono text-[10px] text-[#0a0a0a]/40 tracking-widest uppercase mb-4">[01] — Start here</div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#0a0a0a] leading-tight mb-5">
                Free Masterclass.<br />
                Inside the studio.
              </h2>
              <p className="text-[#0a0a0a]/60 text-sm leading-relaxed mb-8 max-w-md">
                {masterclass.whatsInside ||
                  'A hands-on session inside GCI Studio, Gurugram. See the gear, feel the room, meet the instructors. Zero commitment — no payment, no prerequisites. Just show up.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#register"
                  className="inline-flex items-center justify-center gap-2 bg-[#0a0a0a] hover:bg-[#141414] text-[#E8DEFA] font-semibold px-7 py-4 rounded-xl text-sm transition-colors"
                >
                  Register — it's free
                </a>
              </div>
            </div>

            {/* Right — details card */}
            <div className="bg-[#0a0a0a] rounded-2xl p-7 min-w-[260px]">
              <div className="space-y-5">
                {[
                  { label: 'Date', value: masterclassDate },
                  { label: 'Time', value: masterclassTime },
                  { label: 'Duration', value: masterclass.duration || '[DURATION]' },
                  { label: 'Location', value: masterclass.studioName || 'GCI Studio' },
                  { label: 'Address', value: masterclass.studioAddress || '[STUDIO ADDRESS, GURUGRAM]' },
                  { label: 'Seats', value: seatsLeft + ' (waitlist if full)' },
                  { label: 'Cost', value: 'Free' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-0.5">{label}</div>
                    <div className="text-sm text-white/80 leading-snug">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pathway arrow strip */}
      <div className="bg-[#141414] border-y border-white/5 py-4 px-6 flex items-center justify-center gap-4">
        <span className="font-mono text-[10px] text-[#E8DEFA]/40 tracking-widest uppercase">Masterclass</span>
        <ArrowRight size={14} className="text-[#E8DEFA]/30" />
        <span className="font-mono text-[10px] text-[#E8DEFA]/70 tracking-widest uppercase">DJ Course</span>
        <span className="font-mono text-[10px] text-white/20 ml-2">— complete the masterclass, enroll in the course</span>
      </div>

      {/* DJ Course section */}
      <section id="course" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            {/* Left */}
            <div className="md:max-w-xl">
              <div className="font-mono text-[10px] text-[#E8DEFA]/40 tracking-widest uppercase mb-4">[02] — Go deeper</div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
                The DJ Course.<br />
                <span className="text-[#E8DEFA]">The real thing.</span>
              </h2>
              <p className="text-white/45 text-sm leading-relaxed mb-8 max-w-md">
                {course.format === 'hybrid'
                  ? 'In-studio and online. The full curriculum, end to end.'
                  : 'In-studio, Gurugram. The full curriculum across real sessions — gear, theory, live sets, and business. Graduate booking-ready on the GCI marketplace.'}
              </p>
              <a
                href="#enroll"
                className="inline-flex items-center justify-center gap-2 bg-[#E8DEFA] hover:bg-[#d4c8f0] text-[#0a0a0a] font-semibold px-7 py-4 rounded-xl text-sm transition-colors"
              >
                Enroll now — {courseFee}
              </a>
            </div>

            {/* Right — details card */}
            <div className="bg-[#141414] border border-white/8 rounded-2xl p-7 min-w-[260px]">
              <div className="space-y-5">
                {[
                  { label: 'Batch starts', value: batchStart },
                  { label: 'Schedule', value: course.schedule || '[SCHEDULE]' },
                  { label: 'Format', value: course.format === 'in-studio' ? 'In-studio, Gurugram' : course.format === 'hybrid' ? 'Hybrid' : '[FORMAT]' },
                  { label: 'Equipment', value: course.equipmentUsed || '[EQUIPMENT]' },
                  { label: 'Seats', value: course.seatCap ? `${course.seatCap} per batch` : '[SEAT CAP]' },
                  { label: 'Fee', value: courseFee },
                  ...(course.emiAvailable && course.emiDetails ? [{ label: 'EMI', value: course.emiDetails }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-0.5">{label}</div>
                    <div className="text-sm text-white/75 leading-snug">{value}</div>
                  </div>
                ))}
              </div>
              {course.refundPolicy && (
                <div className="mt-6 pt-5 border-t border-white/6">
                  <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest mb-1">Refund policy</div>
                  <p className="text-xs text-white/35 leading-relaxed">{course.refundPolicy}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
