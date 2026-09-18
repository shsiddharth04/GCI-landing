import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { loadSettings } from '../admin/settings'
import { fadeUp, fadeIn, viewportOnce } from '../lib/motion'
import type { GalleryItem } from '../admin/settings'
import type { MouseEvent } from 'react'

// Lazy-loads src via IntersectionObserver, plays only after canplay fires.
// Prevents autoPlay+preload="none" jitter (browser playing with 0 buffer).
function FilmVideo({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const video = videoRef.current
        if (!video || video.src) return
        video.src = src
        video.load()
      },
      { rootMargin: '300px' },
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [src])

  function handleCanPlay() {
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {})
    setReady(true)
  }

  return (
    <div ref={containerRef} style={{ height: '100%', position: 'relative' }}>
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,#0d0d0d 25%,#161616 50%,#0d0d0d 75%)',
          backgroundSize: '200% 100%',
          animation: 'gallery-shimmer 1.6s ease-in-out infinite',
        }} />
      )}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        onCanPlay={handleCanPlay}
        style={{
          display: 'block', height: '100%', width: 'auto', maxWidth: 'none',
          opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease',
          // GPU layer — prevents software-decode stutter on chromium/webkit
          transform: 'translateZ(0)', willChange: 'transform',
        }}
      />
    </div>
  )
}

function FilmItem({ item, index }: { item: GalleryItem; index: number }) {
  const num = String(index + 1).padStart(2, '0')
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
    >
      {item.type === 'video' ? (
        <FilmVideo src={item.src} />
      ) : (
        <img
          src={item.src}
          alt={item.alt}
          loading="lazy"
          style={{
            display: 'block',
            height: '100%',
            width: 'auto',
            maxWidth: 'none',
            filter: 'grayscale(90%) contrast(1.2) brightness(0.9)',
            transition: 'filter 0.4s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(0%) contrast(1.05) brightness(1.0)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(90%) contrast(1.2) brightness(0.9)' }}
        />
      )}

      {/* lavender tint overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,191,255,0.04)', pointerEvents: 'none' }} />

      {/* index label — bottom left */}
      <div aria-hidden style={{
        position: 'absolute', bottom: '12px', left: '14px',
        fontFamily: "'Space Mono', monospace", fontSize: '9px',
        letterSpacing: '0.2em', color: 'rgba(212,191,255,0.3)',
        pointerEvents: 'none',
      }}>
        {num}
      </div>

      {/* top-right sprocket holes as decorative detail */}
      <div aria-hidden style={{
        position: 'absolute', top: '10px', right: '14px',
        display: 'flex', flexDirection: 'column', gap: '5px',
        pointerEvents: 'none',
      }}>
        {[0, 1, 2].map(k => (
          <div key={k} style={{
            width: '5px', height: '4px',
            border: '1px solid rgba(212,191,255,0.18)',
            borderRadius: '1px',
          }} />
        ))}
      </div>
    </div>
  )
}

export default function StudioGallery() {
  const { studioGallery } = loadSettings()
  const trackRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 })

  if (!studioGallery || studioGallery.length === 0) return null

  // Mouse drag scroll (desktop only — touch uses native scroll)
  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    const el = trackRef.current
    if (!el) return
    dragState.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.style.cursor = 'grabbing'
  }
  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!dragState.current.active) return
    const el = trackRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    el.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX)
  }
  function onMouseUp() {
    dragState.current.active = false
    if (trackRef.current) trackRef.current.style.cursor = 'grab'
  }

  return (
    <section style={{ background: '#050505', userSelect: 'none' }}>
      <style>{`
        .filmstrip-track::-webkit-scrollbar { display: none; }
        .filmstrip-track { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes gallery-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Section header */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) 24px 28px', maxWidth: '1152px', margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeUp}>
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: '9px',
            color: 'rgba(212,191,255,0.4)', letterSpacing: '0.28em',
            textTransform: 'uppercase', marginBottom: '14px',
          }}>
            From our sessions
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800,
              lineHeight: 1.1, letterSpacing: '-0.025em',
              fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0,
            }}>
              What a session<br />actually looks like.
            </h2>
            <p style={{
              fontFamily: "'Space Mono', monospace", fontSize: '8px',
              color: 'rgba(212,191,255,0.25)', letterSpacing: '0.18em',
              textTransform: 'uppercase', margin: 0,
            }}>
              Drag to explore
            </p>
          </div>
        </motion.div>
      </div>

      {/* Filmstrip */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeIn}
      >
        {/* Top edge rule */}
        <div style={{ height: '1px', background: 'rgba(212,191,255,0.06)' }} />

        <div
          ref={trackRef}
          className="filmstrip-track"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{
            display: 'flex',
            gap: '2px',
            height: 'clamp(180px, 48vw, 600px)',
            overflowX: 'auto',
            overflowY: 'hidden',
            cursor: 'grab',
            paddingLeft: '24px',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            WebkitOverflowScrolling: 'touch' as any,
          }}
        >
          {studioGallery.map((item, i) => (
            <FilmItem key={i} item={item} index={i} />
          ))}
          {/* Trailing spacer — prevents right-padding being eaten on iOS */}
          <div style={{ flexShrink: 0, width: '24px' }} />
        </div>

        {/* Bottom edge rule */}
        <div style={{ height: '1px', background: 'rgba(212,191,255,0.06)' }} />
      </motion.div>

      {/* Footer */}
      <div style={{
        padding: '16px 24px',
        maxWidth: '1152px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: '8px',
          color: 'rgba(255,255,255,0.1)', letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          {studioGallery.length} frames
        </span>
        <Link to="/studio" style={{
          fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'rgba(212,191,255,0.45)',
          textDecoration: 'none', transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4bfff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.45)')}
        >
          Studio tour &rarr;
        </Link>
      </div>
    </section>
  )
}
