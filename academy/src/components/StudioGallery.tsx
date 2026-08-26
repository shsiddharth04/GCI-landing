import { useState } from 'react'
import { motion } from 'motion/react'
import { loadSettings } from '../admin/settings'
import { fadeIn, fadeUp, staggerContainer, viewportOnce } from '../lib/motion'
import type { GalleryItem } from '../admin/settings'
import type { MouseEvent } from 'react'

function tilt(e: MouseEvent<HTMLDivElement>, strength = 8) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  e.currentTarget.style.transform = `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) scale(1.01)`
}
function resetTilt(e: MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)'
}

function ImageTile({ item, tall, isFeatured }: { item: GalleryItem; tall?: boolean; isFeatured?: boolean }) {
  return (
    <motion.div
      variants={fadeIn}
      onMouseMove={tilt}
      onMouseLeave={resetTilt}
      style={{
        position: 'relative', overflow: 'hidden',
        height: tall ? '480px' : '280px', background: '#0f0d18',
        transition: 'transform 0.18s ease',
        transformStyle: 'preserve-3d',
      }}
    >
      <img
        src={item.src}
        alt={item.alt}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          display: 'block',
          filter: 'grayscale(100%) contrast(1.3) brightness(0.85)',
          transition: 'filter 0.5s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(0%) contrast(1.1) brightness(1.0)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(100%) contrast(1.3) brightness(0.85)' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,191,255,0.06)', pointerEvents: 'none' }} />
      {isFeatured && (
        <>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent 55%, rgba(5,5,5,0.75) 100%)',
          }} />
          {/* Exhibition caption number */}
          <div aria-hidden style={{
            position: 'absolute', bottom: '20px', left: '24px',
            fontFamily: "'Space Mono', monospace", fontSize: '80px', fontWeight: 700,
            color: '#d4bfff', opacity: 0.5, lineHeight: 1,
            userSelect: 'none', pointerEvents: 'none',
          }}>
            01
          </div>
        </>
      )}
    </motion.div>
  )
}

function VideoTile({ item, tall }: { item: GalleryItem; tall?: boolean }) {
  const [playing, setPlaying] = useState(false)

  return (
    <motion.div
      variants={fadeIn}
      style={{ position: 'relative', overflow: 'hidden', height: tall ? '480px' : '280px', background: '#0f0d18', cursor: 'pointer' }}
      onClick={() => setPlaying(true)}
    >
      {!playing ? (
        <>
          {item.poster ? (
            <img src={item.poster} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(90%) contrast(1.12) brightness(1.05)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#0f0d18' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,191,255,0.10)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(212,191,255,0.15)',
              border: '1px solid rgba(212,191,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '16px solid #d4bfff', marginLeft: '4px' }} />
            </div>
          </div>
        </>
      ) : (
        <video
          src={item.src}
          poster={item.poster}
          autoPlay
          controls
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </motion.div>
  )
}

function Tile({ item, tall, isFeatured }: { item: GalleryItem; tall?: boolean; isFeatured?: boolean }) {
  return item.type === 'video'
    ? <VideoTile item={item} tall={tall} />
    : <ImageTile item={item} tall={tall} isFeatured={isFeatured} />
}

export default function StudioGallery() {
  const { studioGallery } = loadSettings()

  if (!studioGallery || studioGallery.length === 0) return null

  const [first, second, ...rest] = studioGallery

  return (
    <section style={{ padding: '0 0 0 0', background: '#050505' }}>
      <style>{`
        @media (max-width: 639px) {
          .gallery-first-row { grid-template-columns: 1fr !important; }
          .gallery-first-row .gallery-stack { display: contents !important; }
          .gallery-rest { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{ padding: '80px 24px 40px', maxWidth: '1152px', margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeUp}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(212,191,255,0.4)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '14px' }}>
            From our sessions
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            What a session<br />actually looks like.
          </h2>
        </motion.div>
      </div>

      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 80px' }}>
        {first && (
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewportOnce}
            variants={staggerContainer(0.06)}
            className="gallery-first-row"
            style={{ display: 'grid', gridTemplateColumns: second ? '3fr 2fr' : '1fr', gap: '2px', marginBottom: '2px' }}
          >
            <Tile item={first} tall isFeatured />
            {second && (
              <div className="gallery-stack" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Tile item={second} />
                {rest[0] && <Tile item={rest[0]} />}
              </div>
            )}
          </motion.div>
        )}

        {rest.length > (rest[0] ? 1 : 0) && (
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewportOnce}
            variants={staggerContainer(0.06)}
            className="gallery-rest"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(rest.slice(rest[0] ? 1 : 0).length, 3)}, 1fr)`, gap: '2px' }}
          >
            {rest.slice(rest[0] ? 1 : 0).map((item, i) => (
              <Tile key={i} item={item} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
