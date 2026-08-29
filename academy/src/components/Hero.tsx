import { motion } from 'motion/react'
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
    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: '2px', height: '28px' }}>
      {W_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="eq-bar"
          style={{
            flex: 1,
            height: `${h * 28}px`,
            background: '#d4bfff',
            borderRadius: '1px',
            animationDelay: `${W_DELAYS[i]}s`,
            opacity: 0.06 + h * 0.14,
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
        padding: primary ? '14px 28px' : '14px 20px',
        background: primary ? '#d4bfff' : 'transparent',
        color: primary ? '#050505' : 'rgba(212,191,255,0.7)',
        border: primary ? 'none' : '1px solid rgba(212,191,255,0.25)',
        textDecoration: 'none',
        fontFamily: "'Space Mono', monospace",
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase' as const,
        boxShadow: primary ? '0 0 40px rgba(212,191,255,0.4)' : 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s, color 0.2s',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {display}
      {sub && (
        <span style={{ fontSize: '8px', fontWeight: 400, letterSpacing: '0.08em', opacity: 0.45 }}>
          {sub}
        </span>
      )}
    </a>
  )
}

/* ─── Hero ────────────────────────────────────────────────────── */
export default function Hero() {
  return (
    <section className="ink-dot-grid relative min-h-screen bg-[#050505] overflow-hidden flex flex-col justify-center pt-20">

      {/* Edge vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(5,5,5,0.65) 100%)',
        zIndex: 2,
      }} />

      {/* Ghost atmosphere — bleeds off right, desktop only */}
      <div aria-hidden className="absolute pointer-events-none select-none hidden lg:block" style={{
        right: '-2%', bottom: '14%',
        fontFamily: "'Space Mono', monospace",
        fontSize: 'clamp(100px, 16vw, 220px)',
        fontWeight: 700,
        color: '#d4bfff',
        opacity: 0.03,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        zIndex: 1,
        whiteSpace: 'nowrap',
      }}>
        GURUGRAM
      </div>

      {/* Left margin rule */}
      <div aria-hidden className="absolute pointer-events-none hidden md:block" style={{
        left: '48px', top: '18%', height: '64%', width: '1px',
        background: 'linear-gradient(to bottom, transparent, rgba(212,191,255,0.16) 20%, rgba(212,191,255,0.16) 80%, transparent)',
        zIndex: 3,
      }} />

      {/* Top hairline */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{
        zIndex: 10,
        background: 'linear-gradient(90deg, transparent, rgba(212,191,255,0.2), transparent)',
      }} />

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="relative px-6 md:px-16 lg:px-20 max-w-6xl" style={{ zIndex: 10 }}>

        {/* Brand eyebrow — GCI as the primary brand statement, not a logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          style={{ marginBottom: '36px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(22px, 3vw, 32px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              color: 'white',
            }}>
              GCI
            </div>
            <div style={{
              width: '1px',
              height: '28px',
              background: 'rgba(212,191,255,0.25)',
            }} />
            <div>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '8px',
                letterSpacing: '0.28em',
                color: 'rgba(212,191,255,0.45)',
                textTransform: 'uppercase',
                marginBottom: '2px',
              }}>
                Gig Culture India
              </div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#d4bfff',
                letterSpacing: '-0.01em',
              }}>
                Music Academy
              </div>
            </div>
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '8px',
            letterSpacing: '0.22em',
            color: 'rgba(212,191,255,0.28)',
            textTransform: 'uppercase',
          }}>
            In-studio · Gurugram · 3 students per batch
          </div>
        </motion.div>

        {/* Pre-headline */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.22, ease: 'easeOut' }}
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.32em',
            color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          Learn to
        </motion.div>

        {/* Headline — proportions match the previous design (~106px max) */}
        <div style={{ lineHeight: 0.9, marginBottom: '36px' }}>

          {/* "READ" — outline/stroke */}
          <div style={{ overflow: 'hidden' }}>
            <motion.div
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(60px, 8vw, 112px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 0.9,
                WebkitTextStroke: '2px #d4bfff',
                WebkitTextFillColor: 'transparent',
                display: 'block',
              }}
            >
              READ
            </motion.div>
          </div>

          {/* "A ROOM." — solid white */}
          <div style={{ overflow: 'hidden' }}>
            <motion.div
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(60px, 8vw, 112px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 0.9,
                color: 'white',
                display: 'block',
              }}
            >
              A ROOM.
            </motion.div>
          </div>
        </div>

        {/* Horizontal rule — reveals left to right */}
        <motion.div
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.55, delay: 0.56, ease: 'easeInOut' }}
          style={{ height: '1px', background: 'rgba(212,191,255,0.2)', marginBottom: '28px' }}
        />

        {/* Subhead + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.68 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
        >
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.38)',
            lineHeight: 1.75,
            maxWidth: '360px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            flex: '0 0 auto',
          }}>
            Hands-on DJ education in Gurugram. Graduate booking-ready and listed on the GCI marketplace.
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <ScrambleCTA label="Book · ₹179" href="#masterclass" primary />
            <ScrambleCTA label="Join the course" href="#course" />
          </div>
        </motion.div>

      </div>

      {/* ── Full-width waveform — pinned to bottom ────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="absolute bottom-0 left-0 right-0"
        style={{ zIndex: 10 }}
      >
        <FullWidthWaveform />
      </motion.div>

    </section>
  )
}
