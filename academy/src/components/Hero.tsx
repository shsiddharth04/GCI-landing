import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.1 + 0.25,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.16 + 0.04,
    }));

    let rafId: number;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226,169,241,${p.alpha})`;
        ctx.fill();
      }
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

export default function Hero() {
  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="grain relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050505]">

      <ParticleField />

      {/* Soft radial glow at center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(226,169,241,0.045) 0%, transparent 72%)',
        }}
      />

      {/* Top hairline */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          zIndex: 10,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(226,169,241,0.2) 50%, transparent 100%)',
        }}
      />

      {/* Bottom hairline */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          zIndex: 10,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(226,169,241,0.07) 50%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center" style={{ zIndex: 10 }}>

        {/* Logo + tagline — appears almost instantly */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12, ease: 'easeOut' }}
        >
          {/* Breathing glow halo */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              width: '480px',
              height: '480px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(226,169,241,0.11) 0%, transparent 68%)',
              filter: 'blur(28px)',
            }}
            animate={{ opacity: [0.25, 0.7, 0.25], scale: [0.9, 1.08, 0.9] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.4,
            }}
          />

          {/* SVG — logo mark + "ORGANISING THE UNDERGROUND" tagline */}
          <div className="relative overflow-hidden">
            <img
              src="/logo-full.svg"
              alt="Gig Culture India"
              draggable={false}
              style={{
                width: 'clamp(220px, 36vw, 340px)',
                height: 'auto',
                display: 'block',
                userSelect: 'none',
              }}
            />
            {/* One-time shimmer sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(108deg, transparent 28%, rgba(226,169,241,0.22) 50%, transparent 72%)',
              }}
              initial={{ x: '-110%' }}
              animate={{ x: '260%' }}
              transition={{ duration: 0.85, delay: 0.55, ease: [0.22, 0, 0.1, 1] }}
            />
          </div>
        </motion.div>

        {/* JOIN NOW button */}
        <motion.button
          onClick={scrollToWaitlist}
          className="group relative mt-14 overflow-hidden cursor-pointer"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55, ease: 'easeOut' }}
          style={{
            padding: '14px 62px',
            background: 'transparent',
            border: '1px solid rgba(226,169,241,0.32)',
            fontSize: '10px',
            letterSpacing: '0.46em',
            fontFamily: "'Space Mono', monospace",
            cursor: 'pointer',
          }}
        >
          {/* Fill that slides up on hover */}
          <span
            className="absolute inset-0 bg-[#e2a9f1] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
            aria-hidden="true"
          />
          {/* Text — changes to dark on fill */}
          <span className="relative z-10 text-[#e2a9f1] group-hover:text-[#050505] transition-colors duration-300">
            JOIN NOW
          </span>
        </motion.button>
      </div>
    </section>
  );
}
