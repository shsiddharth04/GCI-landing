import { motion } from 'motion/react'
import type { GalleryItem } from '../admin/settings'
import type { MouseEvent } from 'react'

const STUDIO_MEDIA: GalleryItem[] = [
  { type: 'video', src: '/studio/studio-v1.mov', alt: 'GCI Studio' },
  { type: 'video', src: '/studio/studio-v2.mov', alt: 'The studio space' },
]

function tilt(e: MouseEvent<HTMLDivElement>, strength = 5) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  e.currentTarget.style.transform = `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) scale(1.01)`
}
function resetTilt(e: MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = 'none'
}

function ImageTile({ item }: { item: GalleryItem }) {
  return (
    <div
      onMouseMove={tilt}
      onMouseLeave={resetTilt}
      style={{ position: 'relative', background: '#0f0d18', lineHeight: 0, transition: 'transform 0.18s ease', transformStyle: 'preserve-3d' }}
    >
      <img
        src={item.src}
        alt={item.alt}
        loading="lazy"
        style={{
          display: 'block', width: '100%', height: 'auto',
          filter: 'grayscale(100%) contrast(1.3) brightness(0.85)',
          transition: 'filter 0.5s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(0%) contrast(1.1) brightness(1.0)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(100%) contrast(1.3) brightness(0.85)' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,191,255,0.05)', pointerEvents: 'none' }} />
    </div>
  )
}

function VideoTile({ item }: { item: GalleryItem }) {
  return (
    <div style={{ position: 'relative', lineHeight: 0, background: '#0f0d18' }}>
      <video
        src={item.src}
        autoPlay muted loop playsInline
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,191,255,0.03)', pointerEvents: 'none' }} />
    </div>
  )
}

export default function StudioPage() {
  const studioGallery = STUDIO_MEDIA

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white' }}>
      <style>{`
        .studio-masonry {
          columns: 2;
          column-gap: 3px;
        }
        .studio-item {
          break-inside: avoid;
          margin-bottom: 3px;
          display: block;
        }
        @media (max-width: 479px) {
          .studio-masonry { columns: 1; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,191,255,0.08)',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(212,191,255,0.5)', transition: 'color 0.2s',
            padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4bfff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.5)')}
        >
          &larr; Back
        </button>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo-mark.svg" alt="GCI" style={{ width: '28px', height: '28px', opacity: 0.8 }} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(212,191,255,0.4)', textTransform: 'uppercase', marginBottom: '2px' }}>
              Gig Culture India
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', color: 'white' }}>
              Music <span style={{ color: '#d4bfff' }}>Academy</span>
            </div>
          </div>
        </a>
      </div>

      {/* Hero text */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px 32px', maxWidth: '1152px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '14px' }}>
            GCI Studio · Gurugram
          </p>
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: 800,
            lineHeight: 0.9, letterSpacing: '-0.035em',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            The<br /><span style={{ color: '#d4bfff' }}>Studio.</span>
          </h1>
          <p style={{ marginTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: '480px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            11th Floor, Capital Tower, Next To CDS Tower, Sector 20, Gurugram. Pioneer XDJ-RX3, Sennheiser HD 25 Plus, Rekordbox. The real gear, in a real room.
          </p>
        </motion.div>
      </div>

      {/* Gallery */}
      {studioGallery && studioGallery.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px clamp(64px, 10vw, 112px)' }}
        >
          <div className="studio-masonry">
            {studioGallery.map((item, i) => (
              <div key={i} className="studio-item">
                {item.type === 'video'
                  ? <VideoTile item={item} />
                  : <ImageTile item={item} />
                }
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer strip */}
      <div style={{ borderTop: '1px solid rgba(212,191,255,0.08)', padding: '24px', textAlign: 'center' }}>
        <a href="/#masterclass" style={{
          fontFamily: "'Space Mono', monospace", fontSize: '9px',
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(212,191,255,0.4)', textDecoration: 'none', transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4bfff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.4)')}
        >
          Book a masterclass slot &rarr;
        </a>
      </div>
    </div>
  )
}
