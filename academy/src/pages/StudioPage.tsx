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

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{ paddingTop: '100px', paddingBottom: '36px' }}
        >
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            color: 'rgba(212,191,255,0.35)', letterSpacing: '0.3em',
            textTransform: 'uppercase', marginBottom: '14px',
          }}>
            GCI Studio · Sector 20, Gurugram
          </p>
          <h1 style={{
            fontSize: 'clamp(3.5rem, 9vw, 8rem)', fontWeight: 800,
            lineHeight: 0.88, letterSpacing: '-0.04em',
            fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0,
          }}>
            The<br /><span style={{ WebkitTextStroke: '2px #d4bfff', WebkitTextFillColor: 'transparent' }}>Studio.</span>
          </h1>
        </motion.div>

        {/* Diptych — side by side, natural 16:9, no fixed height, no object-fit */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
        >
          <style>{`
            .studio-diptych {
              display: flex;
              gap: 3px;
              align-items: flex-start;
            }
            .studio-panel {
              flex: 1;
              position: relative;
              line-height: 0;
              min-width: 0;
            }
            .studio-panel video {
              display: block;
              width: 100%;
              height: auto;
            }
            @media (max-width: 560px) {
              .studio-diptych { flex-direction: column; }
            }
          `}</style>

          <div className="studio-diptych">
            {STUDIO_MEDIA.map((item, i) => (
              <div key={i} className="studio-panel">
                <video src={item.src} autoPlay muted loop playsInline />
                <div aria-hidden style={{
                  position: 'absolute', top: '10px', left: '12px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 'clamp(22px, 3vw, 44px)', fontWeight: 700,
                  color: 'rgba(212,191,255,0.2)', lineHeight: 1, letterSpacing: '-0.03em',
                  pointerEvents: 'none',
                }}>0{i + 1}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Equipment strip */}
        <div style={{
          marginTop: '20px', marginBottom: '48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
          borderTop: '1px solid rgba(212,191,255,0.06)',
          paddingTop: '16px',
        }}>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <div key={i} style={{
                width: '2px', height: `${5 + Math.abs(Math.sin(i * 1.4)) * 9}px`,
                background: 'rgba(212,191,255,0.2)', borderRadius: '1px',
              }} />
            ))}
          </div>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: '8px',
            color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            Pioneer XDJ-RX3 · Sennheiser HD 25 Plus · Rekordbox
          </span>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <div key={i} style={{
                width: '2px', height: `${5 + Math.abs(Math.sin(i * 1.4)) * 9}px`,
                background: 'rgba(212,191,255,0.2)', borderRadius: '1px',
              }} />
            ))}
          </div>
        </div>

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
