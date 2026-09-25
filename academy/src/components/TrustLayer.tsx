import { useRef, useEffect, useState } from 'react'

export default function TrustLayer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [muted, setMuted] = useState(true)
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container || !video) return

    // One-shot load: inject src only when container is near viewport.
    // 300px rootMargin gives the browser time to buffer before it's visible.
    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        loadObserver.disconnect()
        if (video.src) return
        video.src = '/media/virush-tomorrowland.mp4'
        video.load()
      },
      { rootMargin: '300px' },
    )
    loadObserver.observe(container)

    if (reducedMotion.current) return () => loadObserver.disconnect()

    // Continuous play/pause observer — only acts once src is loaded;
    // canplay handler covers the initial play when the video first becomes ready.
    const playObserver = new IntersectionObserver(
      ([entry]) => {
        if (!video.src) return
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.4 },
    )
    playObserver.observe(video)

    return () => {
      loadObserver.disconnect()
      playObserver.disconnect()
    }
  }, [])

  function handleCanPlay() {
    const video = videoRef.current
    if (!video) return
    setReady(true)
    if (!reducedMotion.current) video.play().catch(() => {})
  }

  const toggleSound = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  return (
    <section className="bg-[#0a0a0a] border-t border-[#1f1f1f]">

      {/* Section header */}
      <div className="border-b border-[#1f1f1f]">
        <div className="max-w-[1152px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
          <p className="font-label text-[9px] tracking-[0.28em] uppercase text-[#C9BFE0] mb-5">
            // trust_layer
          </p>
          <h2 className="font-display font-bold text-[clamp(32px,5vw,60px)] text-white leading-[1.05] tracking-[-0.02em]">
            Vouched By The Underground
          </h2>
        </div>
      </div>

      {/* Row 1 — Virush */}
      <div className="border-b border-[#1f1f1f]">
        <div className="max-w-[1152px] mx-auto grid lg:grid-cols-12">

          {/* Video */}
          <div ref={containerRef} className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#1f1f1f] relative">
            <div className="aspect-[9/16] relative bg-[#0a0a0a]">
              {/* Poster — visible until video is ready */}
              <img
                src="/media/virush-poster.jpg"
                alt=""
                aria-hidden
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Video — src injected by IntersectionObserver, fades in on canplay */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{
                  opacity: ready ? 1 : 0,
                  transform: 'translateZ(0)',
                  willChange: 'transform',
                }}
                muted
                loop
                playsInline
                preload="none"
                onCanPlay={handleCanPlay}
              />
              <button
                onClick={toggleSound}
                className="absolute bottom-3 left-3 font-label text-[9px] tracking-[0.2em] uppercase text-white border border-white/30 px-2.5 py-1 bg-transparent hover:border-white/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8DEFA] focus-visible:outline-offset-2"
                aria-label={muted ? 'Unmute video' : 'Mute video'}
              >
                {muted ? 'Sound off' : 'Sound on'}
              </button>
            </div>
          </div>

          {/* Text */}
          <div className="lg:col-span-8 flex flex-col justify-between p-8 lg:p-12 min-h-[220px] lg:min-h-0">
            <p className="font-label text-[9px] tracking-[0.28em] uppercase text-[#C9BFE0]">
              GCI artist
            </p>
            <div>
              <h3 className="font-display font-bold text-[clamp(22px,3vw,42px)] text-[#E8DEFA] leading-[1.05] tracking-[-0.02em] mb-4">
                One of ours just played Tomorrowland.
              </h3>
              <p className="font-display font-semibold text-base text-white mb-3">
                Virush Music
              </p>
              <p className="font-display text-sm text-white/60 leading-relaxed max-w-[52ch]">
                Virush is a GCI artist, and this year he took his sound to Tomorrowland. He started
                in the same underground rooms our artists play every week. Now he's on one of the
                biggest stages in the world. That's the journey GCI is built for.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Row 2 — Zoheb (mirrored: photo right on desktop, first on mobile) */}
      <div className="border-b border-[#1f1f1f]">
        <div className="max-w-[1152px] mx-auto grid lg:grid-cols-12">

          {/* Photo — first in HTML → first on mobile; placed right on desktop */}
          <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1 border-b lg:border-b-0 lg:border-l border-[#1f1f1f]">
            <div className="aspect-[4/5]">
              <img
                src="/zoheb.jpg"
                alt="Zoheb Khan"
                loading="lazy"
                className="w-full h-full object-cover grayscale"
              />
            </div>
          </div>

          {/* Text — second in HTML → second on mobile; placed left on desktop */}
          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1 flex flex-col justify-between p-8 lg:p-12 min-h-[220px] lg:min-h-0">
            <p className="font-label text-[9px] tracking-[0.28em] uppercase text-[#C9BFE0]">
              Academy advisor
            </p>
            <div>
              <h3 className="font-display font-bold text-[clamp(22px,3vw,42px)] text-[#E8DEFA] leading-[1.05] tracking-[-0.02em] mb-4">
                Two decades in Hindi film.
              </h3>
              <p className="font-display font-semibold text-base text-white mb-3">
                Zoheb Khan
              </p>
              <p className="font-display text-sm text-white/60 leading-relaxed max-w-[52ch]">
                Zoheb has been making music for Hindi films since 2004, with songs like Bang Bang,
                Rabba and Zinda. He's also done remixes for Sacred Games and Mirzapur, and jingles
                for brands like Microsoft and Lamborghini. He's taught over 200 students music
                production and DJing. Now he helps shape what we teach at the GCI Academy.
              </p>
            </div>
          </div>

        </div>
      </div>

    </section>
  )
}
