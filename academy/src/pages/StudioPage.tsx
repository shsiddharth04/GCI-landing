import { motion } from 'motion/react'
import type { GalleryItem } from '../admin/settings'

const STUDIO_MEDIA: GalleryItem[] = [
  { type: 'video', src: '/studio/studio-v1.mov', alt: 'GCI Studio' },
  { type: 'video', src: '/studio/studio-v2.mov', alt: 'The studio space' },
]

export default function StudioPage() {
  function handleBack() {
    if (window.history.length > 1) window.history.back()
    else window.location.href = '/'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', display: 'flex', flexDirection: 'column' }}>

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

      {/* Header — above the diptych */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ paddingTop: '100px', paddingBottom: '32px', paddingLeft: '24px', paddingRight: '24px' }}
      >
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.35)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '12px' }}>
          GCI Studio · 11th Floor, Capital Tower, Sector 20, Gurugram
        </p>
        <h1 style={{
          fontSize: 'clamp(3.5rem, 9vw, 8rem)', fontWeight: 800,
          lineHeight: 0.88, letterSpacing: '-0.04em',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          margin: 0,
        }}>
          The<br /><span style={{ WebkitTextStroke: '2px #d4bfff', WebkitTextFillColor: 'transparent' }}>Studio.</span>
        </h1>
      </motion.div>

      {/* Full-bleed diptych */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        style={{ position: 'relative', width: '100%', flex: 1 }}
      >
        <style>{`
          .diptych {
            display: flex;
            height: 65vh;
            gap: 2px;
            min-height: 320px;
          }
          .diptych-panel {
            position: relative;
            overflow: hidden;
            flex: 1;
          }
          .diptych-panel:first-child { flex: 1.35; }
          .diptych-panel video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .diptych-label {
            position: absolute;
            bottom: 20px;
            left: 20px;
            font-family: 'Space Mono', monospace;
            font-size: 8px;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: rgba(212,191,255,0.35);
            pointer-events: none;
          }
          .diptych-index {
            position: absolute;
            top: 16px;
            right: 16px;
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.18em;
            color: rgba(212,191,255,0.18);
            pointer-events: none;
          }
          @media (max-width: 600px) {
            .diptych { flex-direction: column; height: auto; }
            .diptych-panel { flex: none !important; height: 50vw; min-height: 200px; }
          }
        `}</style>

        <div className="diptych">
          {STUDIO_MEDIA.map((item, i) => (
            <div key={i} className="diptych-panel">
              <video src={item.src} autoPlay muted loop playsInline />
              {/* Lavender tint overlay — lifts on hover */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(212,191,255,0.04)',
                transition: 'background 0.4s',
                pointerEvents: 'none',
              }} />
              <div className="diptych-index">0{i + 1}</div>
              <div className="diptych-label">
                {i === 0 ? 'Pioneer XDJ-RX3' : 'Sennheiser HD 25 Plus'}
              </div>
            </div>
          ))}
        </div>

        {/* Lavender separator between panels (visual only, via gap bg) */}
        <div aria-hidden style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: '57.4%', // aligns with the 2px gap between flex items
          width: '2px',
          background: 'rgba(212,191,255,0.25)',
          pointerEvents: 'none',
        }} />
      </motion.div>

      {/* Footer strip */}
      <div style={{
        borderTop: '1px solid rgba(212,191,255,0.07)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Pioneer XDJ-RX3 · Sennheiser HD 25 Plus · Rekordbox
        </span>
        <a href="/#masterclass" style={{
          fontFamily: "'Space Mono', monospace", fontSize: '9px',
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(212,191,255,0.4)', textDecoration: 'none', transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4bfff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.4)')}
        >
          Book a session &rarr;
        </a>
      </div>

    </div>
  )
}
