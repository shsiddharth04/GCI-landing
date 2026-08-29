import { useRef } from 'react'
import { motion } from 'motion/react'
import { loadSettings } from '../admin/settings'
import { fadeUp, fadeIn, viewportOnce } from '../lib/motion'
import type { GalleryItem } from '../admin/settings'
import type { MouseEvent, TouchEvent } from 'react'

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
        <video
          src={item.src}
          autoPlay
          muted
          loop
          playsInline
          style={{ display: 'block', height: '100%', width: 'auto', maxWidth: 'none' }}
        />
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

  // Mouse drag scroll
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

  // Touch scroll (native, just remove default prevention)
  function onTouchStart(e: TouchEvent<HTMLDivElement>) {
    const el = trackRef.current
    if (!el) return
    dragState.current = { active: true, startX: e.touches[0].pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
  }
  function onTouchMove(e: TouchEvent<HTMLDivElement>) {
    if (!dragState.current.active) return
    const el = trackRef.current
    if (!el) return
    const x = e.touches[0].pageX - el.offsetLeft
    el.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX)
  }

  return (
    <section style={{ background: '#050505', userSelect: 'none' }}>
      <style>{`
        .filmstrip-track::-webkit-scrollbar { display: none; }
        .filmstrip-track { -ms-overflow-style: none; scrollbar-width: none; }
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
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { dragState.current.active = false }}
          style={{
            display: 'flex',
            gap: '2px',
            height: 'clamp(340px, 62vh, 680px)',
            overflowX: 'auto',
            overflowY: 'hidden',
            cursor: 'grab',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          {studioGallery.map((item, i) => (
            <FilmItem key={i} item={item} index={i} />
          ))}
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
        <a href="/studio" style={{
          fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'rgba(212,191,255,0.45)',
          textDecoration: 'none', transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4bfff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,191,255,0.45)')}
        >
          Studio tour &rarr;
        </a>
      </div>
    </section>
  )
}
