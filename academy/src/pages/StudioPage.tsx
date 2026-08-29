import { motion } from 'motion/react'
import type { GalleryItem } from '../admin/settings'

const STUDIO_MEDIA: GalleryItem[] = [
  { type: 'video', src: '/studio/studio-v1.mov', alt: 'GCI Studio — Pioneer XDJ-RX3' },
  { type: 'video', src: '/studio/studio-v2.mov', alt: 'GCI Studio — The booth' },
]

export default function StudioPage() {
  function handleBack() {
    if (window.history.length > 1) window.history.back()
    else window.location.href = '/'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white' }}>

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,191,255,0.07)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(212,191,255,0.45)', transition: 'color 0.2s', padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4bfff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.45)')}
        >
          &larr; Back
        </button>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo-mark.svg" alt="GCI" style={{ width: '26px', height: '26px', opacity: 0.75 }} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(212,191,255,0.35)', textTransform: 'uppercase', marginBottom: '2px' }}>
              Gig Culture India
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', color: 'white' }}>
              Music <span style={{ color: '#d4bfff' }}>Academy</span>
            </div>
          </div>
        </a>
      </div>

      {/* Page content — max-width container gives videos room to breathe */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 60px)' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{ paddingTop: '110px', paddingBottom: '40px' }}
        >
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            color: 'rgba(212,191,255,0.35)', letterSpacing: '0.3em',
            textTransform: 'uppercase', marginBottom: '14px',
          }}>
            GCI Studio · Sector 20, Gurugram
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <h1 style={{
              fontSize: 'clamp(3.5rem, 9vw, 8rem)', fontWeight: 800,
              lineHeight: 0.88, letterSpacing: '-0.04em',
              fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0,
            }}>
              The<br /><span style={{ WebkitTextStroke: '2px #d4bfff', WebkitTextFillColor: 'transparent' }}>Studio.</span>
            </h1>
            <div style={{ paddingBottom: '8px' }}>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(212,191,255,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 4px' }}>Equipment</p>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', lineHeight: 1.8, margin: 0 }}>
                Pioneer XDJ-RX3<br />Sennheiser HD 25 Plus<br />Rekordbox
              </p>
            </div>
          </div>
        </motion.div>

        {/* Video 01 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ position: 'relative', lineHeight: 0, marginBottom: '2px' }}
        >
          <video
            src={STUDIO_MEDIA[0].src}
            autoPlay muted loop playsInline
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
          <div aria-hidden style={{
            position: 'absolute', top: '16px', left: '16px',
            fontFamily: "'Space Mono', monospace",
            fontSize: 'clamp(36px, 5vw, 72px)', fontWeight: 700,
            color: 'rgba(212,191,255,0.18)', lineHeight: 1, letterSpacing: '-0.04em',
            pointerEvents: 'none',
          }}>01</div>
          <div aria-hidden style={{
            position: 'absolute', bottom: '14px', right: '16px',
            fontFamily: "'Space Mono', monospace", fontSize: '8px',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(212,191,255,0.28)', pointerEvents: 'none',
          }}>Pioneer XDJ-RX3</div>
        </motion.div>

        {/* Inter-panel strip */}
        <div style={{
          padding: '22px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(212,191,255,0.06)',
          borderBottom: '1px solid rgba(212,191,255,0.06)',
          marginBottom: '2px',
        }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(212,191,255,0.18)' }}>
            11th Floor · Capital Tower · Sector 20
          </span>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ width: '2px', height: `${5 + Math.sin(i * 1.3) * 4}px`, background: 'rgba(212,191,255,0.22)', borderRadius: '1px' }} />
            ))}
          </div>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(212,191,255,0.18)' }}>
            Gurugram
          </span>
        </div>

        {/* Video 02 — slight right-align offset for editorial rhythm */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          style={{ position: 'relative', lineHeight: 0, marginLeft: 'clamp(20px, 4vw, 60px)', marginBottom: '40px' }}
        >
          <video
            src={STUDIO_MEDIA[1].src}
            autoPlay muted loop playsInline
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
          <div aria-hidden style={{
            position: 'absolute', top: '16px', left: '16px',
            fontFamily: "'Space Mono', monospace",
            fontSize: 'clamp(36px, 5vw, 72px)', fontWeight: 700,
            color: 'rgba(212,191,255,0.18)', lineHeight: 1, letterSpacing: '-0.04em',
            pointerEvents: 'none',
          }}>02</div>
          <div aria-hidden style={{
            position: 'absolute', bottom: '14px', right: '16px',
            fontFamily: "'Space Mono', monospace", fontSize: '8px',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(212,191,255,0.28)', pointerEvents: 'none',
          }}>Sennheiser HD 25 Plus</div>
        </motion.div>

      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(212,191,255,0.07)', padding: '22px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          GCI Music Academy · Gurugram
        </span>
        <a href="/#masterclass" style={{
          fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(212,191,255,0.4)', textDecoration: 'none', transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4bfff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.4)')}
        >Book a session &rarr;</a>
      </div>

    </div>
  )
}
