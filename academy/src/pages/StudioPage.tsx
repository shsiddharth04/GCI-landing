import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

// NOTE: studio-v1.mov (14MB) and studio-v2.mov (40MB) are raw .mov files.
// For proper web performance, convert to H.264 .mp4 with fast-start:
//   ffmpeg -i input.mov -vcodec h264 -crf 23 -movflags faststart output.mp4
// Target: 2-5MB per file. The component below defers download and shows a
// captured frame as a static poster while the full video buffers.

type PanelState = 'loading' | 'poster' | 'playing'

function VideoPanel({ src, index }: { src: string; index: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const [panelState, setPanelState] = useState<PanelState>('loading')

  // Trigger load when panel enters viewport
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const video = videoRef.current
          if (video && !video.src) {
            video.src = src
            video.load()
          }
          observer.disconnect()
        }
      },
      { threshold: 0.05 },
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [src])

  function captureFrame() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    setPanelState('poster')
  }

  function handleLoadedMetadata() {
    const video = videoRef.current
    if (!video) return
    // Seek 0.5 s in for a more interesting first frame
    video.currentTime = 0.5
  }

  // Fires after seek — capture the frame and show it as the still
  function handleSeeked() {
    if (panelState === 'loading') captureFrame()
  }

  // Also try to capture on loadeddata in case seeked never fires (some browsers/formats)
  function handleLoadedData() {
    if (panelState === 'loading') captureFrame()
  }

  function handleCanPlay() {
    const video = videoRef.current
    if (!video) return
    video.play().then(() => setPanelState('playing')).catch(() => {})
  }

  return (
    <div ref={containerRef} className="studio-panel">

      {/* Animated eq-bar loader — visible while no frame yet */}
      {panelState === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, background: '#080808',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '14px',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
            {[0.5, 0.85, 1, 0.85, 0.5].map((h, k) => (
              <div key={k} style={{
                width: '3px', height: `${h * 18}px`,
                background: 'rgba(212,191,255,0.2)', borderRadius: '1px',
                animation: 'eqbar 1s ease-in-out infinite alternate',
                animationDelay: `${k * 0.14}s`,
              }} />
            ))}
          </div>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: '7px',
            color: 'rgba(212,191,255,0.2)', letterSpacing: '0.3em', textTransform: 'uppercase',
          }}>
            Loading
          </span>
        </div>
      )}

      {/* Captured still frame — cross-fades with video */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: panelState === 'poster' ? 1 : 0,
          transition: 'opacity 0.7s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Live video — fades in once playing, fades canvas out simultaneously */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onSeeked={handleSeeked}
        onLoadedData={handleLoadedData}
        onCanPlay={handleCanPlay}
        style={{
          display: 'block', width: '100%', height: 'auto',
          opacity: panelState === 'playing' ? 1 : 0,
          transition: 'opacity 0.7s ease',
        }}
      />

      <div aria-hidden style={{
        position: 'absolute', top: '10px', left: '12px',
        fontFamily: "'Space Mono', monospace",
        fontSize: 'clamp(22px, 3vw, 44px)', fontWeight: 700,
        color: 'rgba(212,191,255,0.2)', lineHeight: 1, letterSpacing: '-0.03em',
        pointerEvents: 'none',
      }}>
        0{index + 1}
      </div>
    </div>
  )
}

const STUDIO_VIDEOS = [
  { src: '/studio/studio-v1.mov', alt: 'GCI Studio — Pioneer XDJ-RX3' },
  { src: '/studio/studio-v2.mov', alt: 'GCI Studio — The booth' },
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
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo-mark.svg" alt="GCI" style={{ width: '26px', height: '26px', opacity: 0.75 }} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(212,191,255,0.35)', textTransform: 'uppercase', marginBottom: '2px' }}>
              Gig Culture India
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', color: 'white' }}>
              Music <span style={{ color: '#d4bfff' }}>Academy</span>
            </div>
          </div>
        </Link>
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

        {/* Diptych */}
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
              aspect-ratio: 16 / 9;
              overflow: hidden;
              background: #080808;
            }
            .studio-panel video {
              display: block;
              width: 100%;
              height: auto;
            }
            @keyframes eqbar {
              from { transform: scaleY(0.55); }
              to   { transform: scaleY(1); }
            }
            @media (max-width: 560px) {
              .studio-diptych { flex-direction: column; }
            }
          `}</style>

          <div className="studio-diptych">
            {STUDIO_VIDEOS.map((v, i) => (
              <VideoPanel key={i} src={v.src} index={i} />
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
