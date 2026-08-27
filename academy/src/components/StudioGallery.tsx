import { motion } from 'motion/react'
import { loadSettings } from '../admin/settings'
import { fadeUp, fadeIn, viewportOnce } from '../lib/motion'
import type { GalleryItem } from '../admin/settings'
import type { MouseEvent } from 'react'

function tilt(e: MouseEvent<HTMLDivElement>, strength = 6) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  e.currentTarget.style.transform = `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) scale(1.01)`
}
function resetTilt(e: MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = 'none'
}

function ImageTile({ item, isFeatured }: { item: GalleryItem; isFeatured?: boolean }) {
  return (
    <div
      onMouseMove={tilt}
      onMouseLeave={resetTilt}
      style={{
        position: 'relative',
        background: '#0f0d18',
        lineHeight: 0,
        transition: 'transform 0.18s ease',
        transformStyle: 'preserve-3d',
      }}
    >
      <img
        src={item.src}
        alt={item.alt}
        loading="lazy"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          filter: 'grayscale(100%) contrast(1.3) brightness(0.85)',
          transition: 'filter 0.5s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(0%) contrast(1.1) brightness(1.0)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(100%) contrast(1.3) brightness(0.85)' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,191,255,0.06)', pointerEvents: 'none' }} />
      {isFeatured && (
        <div aria-hidden style={{
          position: 'absolute', bottom: '16px', left: '16px',
          fontFamily: "'Space Mono', monospace", fontSize: '56px', fontWeight: 700,
          color: '#d4bfff', opacity: 0.4, lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none',
        }}>
          01
        </div>
      )}
    </div>
  )
}

function VideoTile({ item }: { item: GalleryItem }) {
  return (
    <div style={{ position: 'relative', lineHeight: 0, background: '#0f0d18' }}>
      <video
        src={item.src}
        autoPlay
        muted
        loop
        playsInline
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,191,255,0.04)', pointerEvents: 'none' }} />
    </div>
  )
}

function Tile({ item, isFeatured }: { item: GalleryItem; isFeatured?: boolean }) {
  return item.type === 'video'
    ? <VideoTile item={item} />
    : <ImageTile item={item} isFeatured={isFeatured} />
}

export default function StudioGallery() {
  const { studioGallery } = loadSettings()

  if (!studioGallery || studioGallery.length === 0) return null

  return (
    <section style={{ background: '#050505' }}>
      <style>{`
        .gallery-masonry {
          columns: 2;
          column-gap: 2px;
        }
        .gallery-item {
          break-inside: avoid;
          margin-bottom: 2px;
          display: block;
        }
        @media (max-width: 479px) {
          .gallery-masonry { columns: 1; }
        }
      `}</style>

      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px 32px', maxWidth: '1152px', margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeUp}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '14px' }}>
            From our sessions
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            What a session<br />actually looks like.
          </h2>
        </motion.div>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeIn}
        style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px clamp(48px, 8vw, 80px)' }}
      >
        <div className="gallery-masonry">
          {studioGallery.map((item, i) => (
            <div key={i} className="gallery-item">
              <Tile item={item} isFeatured={i === 0} />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
