import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { loadSettings } from '../admin/settings'

/* ─── Particle canvas ─────────────────────────────────────────── */
function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)

    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.0 + 0.2,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.14 + 0.03,
    }))

    let raf: number
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of pts) {
        p.x = (p.x + p.vx + w) % w
        p.y = (p.y + p.vy + h) % h
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(226,169,241,${p.a})`
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
}

/* ─── Aurora blobs ────────────────────────────────────────────── */
function AuroraBlobs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <div style={{
        position: 'absolute', width: '70vw', height: '70vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(226,169,241,0.1) 0%, transparent 62%)',
        filter: 'blur(90px)', left: '15%', top: '8%',
        animation: 'blob-a 24s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: '50vw', height: '55vh', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(170,130,255,0.07) 0%, transparent 62%)',
        filter: 'blur(80px)', right: '-8%', top: '-5%',
        animation: 'blob-b 30s ease-in-out infinite 8s',
      }} />
      <div style={{
        position: 'absolute', width: '42vw', height: '48vh', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220,140,255,0.06) 0%, transparent 62%)',
        filter: 'blur(85px)', left: '-6%', bottom: '-5%',
        animation: 'blob-c 27s ease-in-out infinite 14s',
      }} />
    </div>
  )
}

/* ─── Eq waveform ─────────────────────────────────────────────── */
const BAR_HEIGHTS = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.75, 0.45, 1, 0.55, 0.8, 0.35, 0.95]
const BAR_DELAYS  = [0, 0.15, 0.3, 0.05, 0.45, 0.2, 0.6, 0.1, 0.35, 0.5, 0.25, 0.7, 0.4, 0.55, 0.15]

function Waveform() {
  return (
    <div className="flex items-end gap-[3px]">
      {BAR_HEIGHTS.map((h, i) => (
        <div key={i} className="eq-bar w-[3px] rounded-full bg-[#e2a9f1]"
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
  const { course, masterclass } = loadSettings()

  const batchLabel = course.batchStartDate
    ? new Date(course.batchStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '[BATCH START DATE]'
  const seatLabel = masterclass.seatCap ? `${masterclass.seatCap} seats` : '[SEAT CAP] seats'
  const feeLabel  = course.fee ? `₹${Number(course.fee).toLocaleString('en-IN')}` : '[COURSE FEE]'

  return (
    <section className="min-h-screen flex flex-col justify-center pt-16 px-6 relative overflow-hidden bg-[#050505]">
      <ParticleField />
      <AuroraBlobs />

      {/* Edge vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 2,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(5,5,5,0.75) 100%)',
      }} />

      {/* Top hairline */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{
        zIndex: 10,
        background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.22), transparent)',
      }} />

      <div className="relative max-w-5xl mx-auto w-full py-20" style={{ zIndex: 10 }}>

        {/* Logo + brand — prominent */}
        <motion.div className="flex items-center gap-4 mb-12" {...fadeUp(0.1)}>
          <div className="relative">
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '120px', height: '120px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(226,169,241,0.18) 0%, transparent 68%)',
              filter: 'blur(20px)',
              animation: 'breathe 5.5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            <img src="/logo-mark.svg" alt="GCI" style={{ width: '52px', height: '52px', position: 'relative' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.22em', color: 'rgba(226,169,241,0.45)', textTransform: 'uppercase', marginBottom: '3px' }}>
              Gig Culture India
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Music <span style={{ color: '#e2a9f1' }}>Academy</span>
            </div>
          </div>
        </motion.div>

        {/* Tag */}
        <motion.div {...fadeUp(0.16)} className="mb-8">
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.3em',
            color: '#e2a9f1', textTransform: 'uppercase',
            border: '1px solid rgba(226,169,241,0.35)', background: 'rgba(226,169,241,0.07)',
            padding: '6px 14px', display: 'inline-block',
          }}>
            DJ Education · In-studio · Gurugram
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 {...fadeUp(0.22)}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-[106px] font-bold tracking-tight leading-[0.95] mb-8"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Learn to<br />
          <span style={{ color: '#e2a9f1' }}>read a room.</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p {...fadeUp(0.28)}
          className="text-base md:text-lg max-w-xl mb-10 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.42)' }}
        >
          GCI Music Academy is a hands-on DJ education program run out of our studio in Gurugram.
          Graduate directly into GCI's live-booking pipeline — not just a certificate.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeUp(0.34)} className="flex flex-col sm:flex-row gap-3 mb-16">
          <a href="#masterclass"
            className="inline-flex items-center justify-center"
            style={{
              background: '#e2a9f1', color: '#050505', fontWeight: 700,
              padding: '16px 28px', fontSize: '13px',
              boxShadow: '0 0 40px rgba(226,169,241,0.45)',
              transition: 'all 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(226,169,241,0.65)'; (e.currentTarget as HTMLElement).style.background = '#eeaeff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(226,169,241,0.45)'; (e.currentTarget as HTMLElement).style.background = '#e2a9f1' }}
          >
            Register free — Masterclass
          </a>
          <a href="#course"
            className="inline-flex items-center justify-center"
            style={{
              border: '1px solid rgba(226,169,241,0.3)', color: 'rgba(226,169,241,0.75)',
              padding: '16px 28px', fontSize: '13px', fontWeight: 600,
              background: 'transparent', transition: 'all 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(226,169,241,0.6)'; (e.currentTarget as HTMLElement).style.color = '#e2a9f1'; (e.currentTarget as HTMLElement).style.background = 'rgba(226,169,241,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(226,169,241,0.3)'; (e.currentTarget as HTMLElement).style.color = 'rgba(226,169,241,0.75)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            View DJ Course — {feeLabel}
          </a>
        </motion.div>

        {/* Waveform */}
        <motion.div {...fadeUp(0.4)} className="mb-14">
          <Waveform />
        </motion.div>

        {/* Stats strip */}
        <motion.div {...fadeUp(0.46)} className="flex flex-wrap gap-x-10 gap-y-3">
          {[
            { label: 'Batch starts', value: batchLabel },
            { label: 'Masterclass seats', value: seatLabel },
            { label: 'Format', value: course.format === 'in-studio' ? 'In-studio only' : course.format === 'hybrid' ? 'Hybrid' : 'In-studio, Gurugram' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#e2a9f1' }}>{value}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
