import { useState } from 'react'
import { loadSettings } from '../admin/settings'
import type { GalleryItem } from '../admin/settings'

function ImageTile({ item, tall }: { item: GalleryItem; tall?: boolean }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: tall ? '480px' : '320px', background: '#0f0d18' }}>
      <img
        src={item.src}
        alt={item.alt}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          display: 'block',
          filter: 'grayscale(75%) contrast(1.08)',
          transition: 'filter 0.4s, transform 0.4s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(35%) contrast(1.05)'; (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.02)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.filter = 'grayscale(75%) contrast(1.08)'; (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
      />
      {/* lavender tint overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(226,169,241,0.06)', pointerEvents: 'none' }} />
    </div>
  )
}

function VideoTile({ item, tall }: { item: GalleryItem; tall?: boolean }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: tall ? '480px' : '320px', background: '#0f0d18', cursor: 'pointer' }}
      onClick={() => setPlaying(true)}
    >
      {!playing ? (
        <>
          {item.poster ? (
            <img src={item.poster} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(75%) contrast(1.08)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#0f0d18' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(226,169,241,0.06)', pointerEvents: 'none' }} />
          {/* Play button */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(226,169,241,0.15)',
              border: '1px solid rgba(226,169,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '16px solid #e2a9f1', marginLeft: '4px' }} />
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
    </div>
  )
}

function Tile({ item, tall }: { item: GalleryItem; tall?: boolean }) {
  return item.type === 'video'
    ? <VideoTile item={item} tall={tall} />
    : <ImageTile item={item} tall={tall} />
}

export default function StudioGallery() {
  const { studioGallery } = loadSettings()

  if (!studioGallery || studioGallery.length === 0) return null

  const [first, second, ...rest] = studioGallery

  return (
    <section style={{ padding: '0 0 0 0', background: '#050505' }}>
      {/* Header */}
      <div style={{ padding: '80px 24px 40px', maxWidth: '1152px', margin: '0 auto' }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(226,169,241,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '14px' }}>
          From the studio
        </p>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Inside the room<br />where it happens.
        </h2>
      </div>

      {/* Asymmetric grid */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 80px' }}>
        {/* First row: large + small stacked */}
        {first && (
          <div style={{ display: 'grid', gridTemplateColumns: second ? '3fr 2fr' : '1fr', gap: '2px', marginBottom: '2px' }}>
            <Tile item={first} tall />
            {second && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Tile item={second} />
                {rest[0] && <Tile item={rest[0]} />}
              </div>
            )}
          </div>
        )}

        {/* Remaining items in a row */}
        {rest.length > (rest[0] ? 1 : 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(rest.slice(rest[0] ? 1 : 0).length, 3)}, 1fr)`, gap: '2px' }}>
            {rest.slice(rest[0] ? 1 : 0).map((item, i) => (
              <Tile key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
