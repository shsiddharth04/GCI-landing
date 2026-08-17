import { ArrowRight } from 'lucide-react'
import { loadSettings } from '../admin/settings'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
    </div>
  )
}

function DetailRowDark({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(5,5,5,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'rgba(5,5,5,0.8)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
    </div>
  )
}

export default function Pathway() {
  const { course, masterclass } = loadSettings()

  const masterclassDate = masterclass.date
    ? new Date(masterclass.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : '[MASTERCLASS DATE]'
  const masterclassTime = masterclass.time || '[TIME]'
  const seatsLeft = masterclass.seatCap ? `${masterclass.seatCap} seats` : '[SEAT CAP] seats'
  const courseFee = course.fee ? `₹${Number(course.fee).toLocaleString('en-IN')}` : '[COURSE FEE]'
  const batchStart = course.batchStartDate
    ? new Date(course.batchStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '[BATCH START DATE]'

  return (
    <>
      {/* ── Masterclass ─────────────────────────────────────────── */}
      <section id="masterclass" style={{ background: '#e2a9f1', padding: '112px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle dark texture overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(5,5,5,0.06) 0%, transparent 100%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative' }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div style={{ maxWidth: '480px' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(5,5,5,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '16px' }}>
                [01] — Start here
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#050505', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Free Masterclass.<br />Inside the studio.
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(5,5,5,0.58)', lineHeight: 1.7, marginBottom: '32px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {masterclass.whatsInside || 'A hands-on session inside GCI Studio, Gurugram. See the gear, feel the room, meet the instructors. Zero commitment — no payment, no prerequisites. Just show up.'}
              </p>
              <a href="#register" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: '#050505', color: '#e2a9f1',
                fontWeight: 700, padding: '16px 28px', fontSize: '13px',
                textDecoration: 'none', transition: 'all 0.2s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: '0 0 30px rgba(5,5,5,0.3)',
              }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#0f0d18')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#050505')}
              >Register — it's free</a>
            </div>

            {/* Details card */}
            <div style={{
              background: '#050505', border: '1px solid rgba(226,169,241,0.15)',
              padding: '28px', minWidth: '260px', position: 'relative',
              boxShadow: '0 0 60px rgba(5,5,5,0.4)',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.6), transparent)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { label: 'Date', value: masterclassDate },
                  { label: 'Time', value: masterclassTime },
                  { label: 'Duration', value: masterclass.duration || '[DURATION]' },
                  { label: 'Location', value: masterclass.studioName || 'GCI Studio' },
                  { label: 'Address', value: masterclass.studioAddress || '[STUDIO ADDRESS, GURUGRAM]' },
                  { label: 'Seats', value: seatsLeft + ' (waitlist if full)' },
                  { label: 'Cost', value: 'Free' },
                ].map(row => <DetailRow key={row.label} {...row} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pathway strip ───────────────────────────────────────── */}
      <div style={{ background: '#0f0d18', borderTop: '1px solid rgba(226,169,241,0.08)', borderBottom: '1px solid rgba(226,169,241,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Masterclass</span>
        <ArrowRight size={13} style={{ color: 'rgba(226,169,241,0.35)' }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#e2a9f1', letterSpacing: '0.22em', textTransform: 'uppercase' }}>DJ Course</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.18)', marginLeft: '8px' }}>— complete the masterclass, enroll in the course</span>
      </div>

      {/* ── DJ Course ───────────────────────────────────────────── */}
      <section id="course" style={{ background: '#050505', padding: '112px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div style={{ maxWidth: '480px' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '16px' }}>
                [02] — Go deeper
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                The DJ Course.<br /><span style={{ color: '#e2a9f1' }}>The real thing.</span>
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, marginBottom: '32px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {course.format === 'hybrid' ? 'In-studio and online. The full curriculum, end to end.' : 'In-studio, Gurugram. The full curriculum across real sessions — gear, theory, live sets, and business. Graduate booking-ready on the GCI marketplace.'}
              </p>
              <a href="#enroll" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: '#e2a9f1', color: '#050505',
                fontWeight: 700, padding: '16px 28px', fontSize: '13px',
                textDecoration: 'none', transition: 'all 0.2s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: '0 0 40px rgba(226,169,241,0.45)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eeaeff'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 55px rgba(226,169,241,0.65)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#e2a9f1'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(226,169,241,0.45)' }}
              >Enroll now — {courseFee}</a>
            </div>

            {/* Details card */}
            <div style={{
              background: '#0f0d18', border: '1px solid rgba(226,169,241,0.14)',
              padding: '28px', minWidth: '260px', position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.5), transparent)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { label: 'Batch starts', value: batchStart },
                  { label: 'Schedule', value: course.schedule || '[SCHEDULE]' },
                  { label: 'Format', value: course.format === 'in-studio' ? 'In-studio, Gurugram' : course.format === 'hybrid' ? 'Hybrid' : '[FORMAT]' },
                  { label: 'Equipment', value: course.equipmentUsed || '[EQUIPMENT]' },
                  { label: 'Seats', value: course.seatCap ? `${course.seatCap} per batch` : '[SEAT CAP]' },
                  { label: 'Fee', value: courseFee },
                  ...(course.emiAvailable && course.emiDetails ? [{ label: 'EMI', value: course.emiDetails }] : []),
                ].map(row => <DetailRow key={row.label} {...row} />)}
              </div>
              {course.refundPolicy && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(226,169,241,0.08)' }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(226,169,241,0.3)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '6px' }}>Refund policy</div>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{course.refundPolicy}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
