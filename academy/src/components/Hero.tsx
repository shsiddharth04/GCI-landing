import { motion } from 'motion/react'
import { loadSettings } from '../admin/settings'

/* ─── Eq waveform ─────────────────────────────────────────────── */
const BAR_HEIGHTS = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.75, 0.45, 1, 0.55, 0.8, 0.35, 0.95]
const BAR_DELAYS  = [0, 0.15, 0.3, 0.05, 0.45, 0.2, 0.6, 0.1, 0.35, 0.5, 0.25, 0.7, 0.4, 0.55, 0.15]

function Waveform() {
  return (
    <div className="flex items-end gap-[3px]">
      {BAR_HEIGHTS.map((h, i) => (
        <div key={i} className="eq-bar w-[3px] rounded-full bg-[#d4bfff]"
          style={{ height: `${h * 48}px`, animationDelay: `${BAR_DELAYS[i]}s`, opacity: 0.6 + h * 0.38 }}
        />
      ))}
    </div>
  )
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.36, delay, ease: 'easeOut' as const },
})

/* ─── Hero ────────────────────────────────────────────────────── */
export default function Hero() {
  const { course } = loadSettings()

  const feeLabel = course.fee ? `₹${Number(course.fee).toLocaleString('en-IN')}` : ''

  return (
    <section className="ink-dot-grid min-h-screen flex flex-col justify-center pt-16 px-6 relative overflow-hidden bg-[#050505]">

      {/* Single subtle background gradient — sits above the dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(212,191,255,0.05) 0%, transparent 70%)',
        zIndex: 1,
      }} />

      {/* Edge vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 3,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(5,5,5,0.6) 100%)',
      }} />

      {/* Top hairline */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{
        zIndex: 10,
        background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.22), transparent)',
      }} />

      {/* Left column rule — visible grid skeleton */}
      <div className="absolute pointer-events-none hidden md:block" style={{
        left: '24px', top: '15%', height: '70%', width: '2px',
        background: 'linear-gradient(to bottom, transparent, rgba(212,191,255,0.22) 20%, rgba(212,191,255,0.22) 80%, transparent)',
        zIndex: 4,
      }} />

      {/* Ghost atmosphere text — bleeds off the right edge */}
      <div className="absolute pointer-events-none select-none hidden md:block" style={{
        right: '-4%', bottom: '10%',
        fontFamily: "'Space Mono', monospace",
        fontSize: 'clamp(100px, 15vw, 180px)',
        fontWeight: 700,
        color: '#d4bfff',
        opacity: 0.04,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        zIndex: 2,
        whiteSpace: 'nowrap',
      }}>
        GURUGRAM
      </div>

      <div className="relative max-w-5xl mx-auto w-full py-20" style={{ zIndex: 10 }}>

        {/* Logo + brand */}
        <motion.div className="flex items-center gap-4 mb-12" {...fadeUp(0.1)}>
          <div className="relative">
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '120px', height: '120px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,191,255,0.18) 0%, transparent 68%)',
              filter: 'blur(20px)',
              animation: 'breathe 5.5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            <img src="/logo-mark.svg" alt="GCI" style={{ width: '52px', height: '52px', position: 'relative' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.22em', color: 'rgba(212,191,255,0.45)', textTransform: 'uppercase', marginBottom: '3px' }}>
              Gig Culture India
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Music <span style={{ color: '#d4bfff' }}>Academy</span>
            </div>
          </div>
        </motion.div>

        {/* Tag pill */}
        <motion.div {...fadeUp(0.16)} className="mb-8">
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.26em',
            color: '#d4bfff', textTransform: 'uppercase',
            border: '1px solid rgba(212,191,255,0.35)', background: 'rgba(212,191,255,0.07)',
            padding: '6px 14px', display: 'inline-flex', flexWrap: 'wrap', gap: '0',
          }}>
            In-studio · Gurugram · 3 students per batch
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 {...fadeUp(0.22)}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-[106px] font-bold tracking-tight leading-[0.95] mb-8"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Learn to<br />
          <span style={{ color: '#d4bfff' }}>read a room.</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p {...fadeUp(0.28)}
          className="text-base md:text-lg max-w-xl leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.42)', marginBottom: '0' }}
        >
          GCI Music Academy is a hands-on DJ education program run out of our studio in Gurugram.
          Graduate directly into GCI's live-booking pipeline, not just a certificate.
        </motion.p>

        {/* Typographic rule */}
        <motion.div {...fadeUp(0.31)} style={{
          height: '1px', background: 'rgba(212,191,255,0.25)', margin: '28px 0',
        }} />

        {/* CTAs */}
        <motion.div {...fadeUp(0.34)} className="flex flex-col sm:flex-row gap-3 mb-16">
          <a href="#masterclass"
            className="inline-flex flex-col items-center justify-center"
            style={{
              background: '#d4bfff', color: '#050505', fontWeight: 700,
              padding: '14px 28px', fontSize: '13px',
              boxShadow: '0 0 40px rgba(212,191,255,0.45)',
              transition: 'all 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              gap: '3px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(212,191,255,0.65)'; (e.currentTarget as HTMLElement).style.background = '#e0d4ff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(212,191,255,0.45)'; (e.currentTarget as HTMLElement).style.background = '#d4bfff' }}
          >
            <span>Register · it&apos;s free</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', fontWeight: 400, color: 'rgba(5,5,5,0.5)', letterSpacing: '0.08em' }}>₹2,500 value</span>
          </a>
          <a href="#course"
            className="inline-flex items-center justify-center"
            style={{
              border: '1px solid rgba(212,191,255,0.3)', color: 'rgba(212,191,255,0.75)',
              padding: '16px 28px', fontSize: '13px', fontWeight: 600,
              background: 'transparent', transition: 'all 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,191,255,0.6)'; (e.currentTarget as HTMLElement).style.color = '#d4bfff'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,191,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,191,255,0.3)'; (e.currentTarget as HTMLElement).style.color = 'rgba(212,191,255,0.75)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            Join the DJ Course →
          </a>
        </motion.div>

        {/* Waveform */}
        <motion.div {...fadeUp(0.4)} className="mb-14">
          <Waveform />
        </motion.div>

        {/* Stats strip */}
        <motion.div {...fadeUp(0.46)} className="flex flex-wrap gap-x-10 gap-y-3">
          {[
            { label: 'Format', value: 'In-studio · Gurugram' },
            ...(feeLabel ? [{ label: 'Course fee', value: feeLabel }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#d4bfff' }}>{value}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
