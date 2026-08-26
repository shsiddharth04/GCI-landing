import { motion } from 'motion/react'
import { loadSettings } from '../admin/settings'
import { useScramble } from '../hooks/useScramble'

/* ─── Full-width equalizer waveform ───────────────────────────── */
const W_COUNT = 64
const W_HEIGHTS = Array.from({ length: W_COUNT }, (_, i) => {
  const t = i / (W_COUNT - 1)
  return 0.15 + Math.abs(Math.sin(t * Math.PI * 3.8 + 0.4)) * 0.85
})
const W_DELAYS = Array.from({ length: W_COUNT }, () => Math.random() * 0.8)

function FullWidthWaveform() {
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: '2px', height: '52px' }}>
      {W_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="eq-bar"
          style={{
            flex: 1,
            height: `${h * 52}px`,
            background: '#d4bfff',
            borderRadius: '1px',
            animationDelay: `${W_DELAYS[i]}s`,
            opacity: 0.18 + h * 0.45,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Scramble CTA ─────────────────────────────────────────────── */
function ScrambleCTA({ label, sub, href, primary }: { label: string; sub?: string; href: string; primary?: boolean }) {
  const { display, scramble, reset } = useScramble(label.toUpperCase())

  const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    scramble()
    if (!primary) {
      e.currentTarget.style.borderColor = 'rgba(212,191,255,0.55)'
      e.currentTarget.style.color = '#d4bfff'
    } else {
      e.currentTarget.style.boxShadow = '0 0 60px rgba(212,191,255,0.65)'
    }
  }

  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    reset()
    if (!primary) {
      e.currentTarget.style.borderColor = 'rgba(212,191,255,0.25)'
      e.currentTarget.style.color = 'rgba(212,191,255,0.7)'
    } else {
      e.currentTarget.style.boxShadow = '0 0 40px rgba(212,191,255,0.4)'
    }
  }

  return (
    <a
      href={href}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: primary ? 'center' : 'flex-start',
        gap: '2px',
        padding: primary ? '14px 32px' : '14px 20px',
        background: primary ? '#d4bfff' : 'transparent',
        color: primary ? '#050505' : 'rgba(212,191,255,0.7)',
        border: primary ? 'none' : '1px solid rgba(212,191,255,0.25)',
        textDecoration: 'none',
        fontFamily: "'Space Mono', monospace",
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase' as const,
        boxShadow: primary ? '0 0 40px rgba(212,191,255,0.4)' : 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s, color 0.2s',
        minWidth: '160px',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {display}
      {sub && (
        <span style={{ fontSize: '8px', fontWeight: 400, letterSpacing: '0.1em', opacity: 0.45 }}>
          {sub}
        </span>
      )}
    </a>
  )
}

/* ─── Hero ────────────────────────────────────────────────────── */
export default function Hero() {
  const { course } = loadSettings()
  const feeLabel = course.fee ? `₹${Number(course.fee).toLocaleString('en-IN')}` : ''

  return (
    <section className="ink-dot-grid relative min-h-screen bg-[#050505] overflow-hidden flex flex-col">

      {/* Edge vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(5,5,5,0.7) 100%)',
        zIndex: 2,
      }} />

      {/* Ghost atmosphere — bleeds off right */}
      <div aria-hidden className="absolute pointer-events-none select-none hidden lg:block" style={{
        right: '-3%', top: '22%',
        fontFamily: "'Space Mono', monospace",
        fontSize: 'clamp(120px, 18vw, 240px)',
        fontWeight: 700,
        color: '#d4bfff',
        opacity: 0.028,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        zIndex: 1,
        whiteSpace: 'nowrap',
      }}>
        GURUGRAM
      </div>

      {/* Left margin rule */}
      <div aria-hidden className="absolute pointer-events-none hidden md:block" style={{
        left: '52px', top: '12%', height: '76%', width: '1px',
        background: 'linear-gradient(to bottom, transparent, rgba(212,191,255,0.18) 15%, rgba(212,191,255,0.18) 85%, transparent)',
        zIndex: 3,
      }} />

      {/* ── Top strip ──────────────────────────────────────── */}
      <div className="relative flex items-center justify-between px-6 md:px-16 pt-24 pb-0" style={{ zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <img src="/logo-mark.svg" alt="GCI" style={{ width: '32px', height: '32px', opacity: 0.7 }} />
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', letterSpacing: '0.28em', color: 'rgba(212,191,255,0.35)', textTransform: 'uppercase' }}>
              Gig Culture India
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              Music <span style={{ color: '#d4bfff' }}>Academy</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
          style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.3)', letterSpacing: '0.22em', textTransform: 'uppercase' }}
          className="hidden sm:block"
        >
          In-studio · Gurugram · 3 per batch
        </motion.div>
      </div>

      {/* ── Headline — fills the vertical centre ───────────── */}
      <div className="relative flex-1 flex flex-col justify-center px-6 md:px-16 py-10" style={{ zIndex: 10 }}>

        {/* Pre-headline */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: 'easeOut' }}
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.38em',
            color: 'rgba(212,191,255,0.5)',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}
        >
          Learn to
        </motion.div>

        {/* Giant two-line headline */}
        <div style={{ lineHeight: 0.88, marginBottom: '40px' }}>

          {/* Line 1: "READ" — outline / stroke */}
          <div style={{ overflow: 'hidden' }}>
            <motion.div
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.62, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(72px, 13vw, 192px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 0.88,
                WebkitTextStroke: '2px #d4bfff',
                WebkitTextFillColor: 'transparent',
                display: 'block',
              }}
            >
              READ
            </motion.div>
          </div>

          {/* Line 2: "A ROOM." — solid white */}
          <div style={{ overflow: 'hidden' }}>
            <motion.div
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.62, delay: 0.44, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(72px, 13vw, 192px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 0.88,
                color: 'white',
                display: 'block',
              }}
            >
              A ROOM.
            </motion.div>
          </div>
        </div>

        {/* Horizontal rule */}
        <motion.div
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: 'easeInOut' }}
          style={{ height: '1px', background: 'rgba(212,191,255,0.2)', marginBottom: '32px' }}
        />

        {/* Bottom strip — subhead left, CTAs right */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.72 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.38)',
            lineHeight: 1.75,
            maxWidth: '380px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Hands-on DJ education in Gurugram. Graduate booking-ready and listed on the GCI marketplace — not just certified.
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <ScrambleCTA label="Register — free" sub="₹2,500 value" href="#masterclass" primary />
            <ScrambleCTA label="Join the course" href="#course" />
          </div>
        </motion.div>

        {/* Stats — small mono strip below CTAs on mobile */}
        {feeLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.85 }}
            style={{ display: 'flex', gap: '32px', marginTop: '28px', flexWrap: 'wrap' }}
          >
            {[
              { label: 'Course fee', value: feeLabel },
              { label: 'Format', value: 'In-studio' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#d4bfff' }}>{value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Full-width waveform ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="relative w-full px-0"
        style={{ zIndex: 10 }}
      >
        <FullWidthWaveform />
      </motion.div>

    </section>
  )
}
