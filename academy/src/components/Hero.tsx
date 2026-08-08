import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

/* ─── Floating particles ─────────────────────────────────────── */
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

    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.0 + 0.2,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.14 + 0.03,
    }));

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226,169,241,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
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

/* ─── Drifting aurora blobs ───────────────────────────────────── */
function AuroraBlobs() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Centre blob */}
      <motion.div
        style={{
          position: 'absolute',
          width: '70vw',
          height: '70vw',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(226,169,241,0.1) 0%, transparent 62%)',
          filter: 'blur(90px)',
          left: '15%',
          top: '8%',
        }}
        animate={{ x: [0, 80, -45, 0], y: [0, -55, 65, 0], scale: [1, 1.1, 0.93, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Top-right blob — cooler purple */}
      <motion.div
        style={{
          position: 'absolute',
          width: '50vw',
          height: '55vh',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(170,130,255,0.07) 0%, transparent 62%)',
          filter: 'blur(80px)',
          right: '-8%',
          top: '-5%',
        }}
        animate={{ x: [0, -55, 35, 0], y: [0, 60, -35, 0], scale: [1, 0.92, 1.08, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />
      {/* Bottom-left blob — warm pink */}
      <motion.div
        style={{
          position: 'absolute',
          width: '42vw',
          height: '48vh',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(220,160,255,0.06) 0%, transparent 62%)',
          filter: 'blur(85px)',
          left: '-6%',
          bottom: '-5%',
        }}
        animate={{ x: [0, 45, -60, 0], y: [0, -45, 55, 0], scale: [1, 1.07, 0.95, 1] }}
        transition={{ duration: 27, repeat: Infinity, ease: 'easeInOut', delay: 14 }}
      />
    </div>
  );
}

/* ─── JOIN NOW button with breathing corner brackets ─────────── */
function JoinButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  const bracket = (pos: React.CSSProperties, borders: React.CSSProperties) => (
    <motion.span
      style={{
        position: 'absolute',
        width: '14px',
        height: '14px',
        pointerEvents: 'none',
        borderColor: '#e2a9f1',
        ...pos,
        ...borders,
      }}
      animate={{ opacity: hovered ? 0.9 : [0.35, 0.62, 0.35] }}
      transition={
        hovered
          ? { duration: 0.2 }
          : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
    />
  );

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.52, ease: 'easeOut' }}
      style={{
        background: 'none',
        border: 'none',
        padding: '18px 62px',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Corner brackets */}
      {bracket({ top: 0, left: 0 }, { borderTopWidth: '1px', borderLeftWidth: '1px', borderTopStyle: 'solid', borderLeftStyle: 'solid' })}
      {bracket({ top: 0, right: 0 }, { borderTopWidth: '1px', borderRightWidth: '1px', borderTopStyle: 'solid', borderRightStyle: 'solid' })}
      {bracket({ bottom: 0, left: 0 }, { borderBottomWidth: '1px', borderLeftWidth: '1px', borderBottomStyle: 'solid', borderLeftStyle: 'solid' })}
      {bracket({ bottom: 0, right: 0 }, { borderBottomWidth: '1px', borderRightWidth: '1px', borderBottomStyle: 'solid', borderRightStyle: 'solid' })}

      {/* Hover background fill */}
      <motion.span
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(226,169,241,0.07)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Hover outer glow */}
      <motion.span
        style={{
          position: 'absolute',
          inset: '-16px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(226,169,241,0.1) 0%, transparent 70%)',
          filter: 'blur(12px)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Text — letter-spacing expands on hover */}
      <span
        style={{
          position: 'relative',
          zIndex: 10,
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px',
          letterSpacing: hovered ? '0.56em' : '0.44em',
          color: '#e2a9f1',
          display: 'block',
          transition: 'letter-spacing 0.35s ease',
          paddingLeft: '0.12em', // optical centering for letter-spacing
        }}
      >
        JOIN NOW
      </span>
    </motion.button>
  );
}

/* ─── Fade-in helper ──────────────────────────────────────────── */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, delay, ease: 'easeOut' as const },
});

/* ─── Hero ────────────────────────────────────────────────────── */
export default function Hero() {
  const scrollToWaitlist = () =>
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="grain relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050505]">

      <ParticleField />
      <AuroraBlobs />

      {/* Edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(5,5,5,0.7) 100%)',
        }}
      />

      {/* Top hairline */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          zIndex: 10,
          background:
            'linear-gradient(90deg, transparent, rgba(226,169,241,0.22), transparent)',
        }}
      />

      {/* Decorative corner coordinates */}
      <span
        className="absolute font-mono pointer-events-none select-none"
        style={{
          top: '24px', left: '28px', zIndex: 10,
          fontSize: '8px', letterSpacing: '0.18em',
          color: 'rgba(226,169,241,0.18)',
        }}
      >
        28.6139° N
      </span>
      <span
        className="absolute font-mono pointer-events-none select-none"
        style={{
          top: '24px', right: '28px', zIndex: 10,
          fontSize: '8px', letterSpacing: '0.18em',
          color: 'rgba(226,169,241,0.18)',
        }}
      >
        77.2090° E
      </span>
      <span
        className="absolute font-mono pointer-events-none select-none"
        style={{
          bottom: '24px', left: '28px', zIndex: 10,
          fontSize: '8px', letterSpacing: '0.18em',
          color: 'rgba(226,169,241,0.12)',
        }}
      >
        GCI.001
      </span>

      {/* Very subtle horizontal accent lines */}
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 3, top: '28%', left: '5%', right: '5%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.05) 30%, rgba(226,169,241,0.05) 70%, transparent)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 3, top: '72%', left: '5%', right: '5%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.04) 30%, rgba(226,169,241,0.04) 70%, transparent)',
        }}
      />

      {/* ── Main content ─────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center text-center"
        style={{ zIndex: 10 }}
      >
        {/* Logo mark */}
        <motion.div className="relative" {...fadeUp(0.1)}>
          {/* Breathing glow */}
          <motion.div
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: '320px', height: '320px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(226,169,241,0.13) 0%, transparent 68%)',
              filter: 'blur(32px)',
              pointerEvents: 'none',
            }}
            animate={{ opacity: [0.3, 0.75, 0.3], scale: [0.88, 1.08, 0.88] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <div className="relative overflow-hidden">
            <img
              src="/logo-mark.svg"
              alt=""
              draggable={false}
              style={{
                width: 'clamp(72px, 8vw, 100px)',
                height: 'auto',
                display: 'block',
                userSelect: 'none',
              }}
            />
            {/* One-time shimmer */}
            <motion.div
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background:
                  'linear-gradient(108deg, transparent 28%, rgba(226,169,241,0.28) 50%, transparent 72%)',
              }}
              initial={{ x: '-110%' }}
              animate={{ x: '260%' }}
              transition={{ duration: 0.85, delay: 0.5, ease: [0.22, 0, 0.1, 1] }}
            />
          </div>
        </motion.div>

        {/* GIG */}
        <motion.span
          {...fadeUp(0.16)}
          style={{
            display: 'block',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(3.8rem, 11.5vw, 8.5rem)',
            lineHeight: 0.88,
            letterSpacing: '-0.02em',
            color: 'white',
            marginTop: '20px',
            userSelect: 'none',
          }}
        >
          GIG
        </motion.span>

        {/* CULTURE */}
        <motion.span
          {...fadeUp(0.2)}
          style={{
            display: 'block',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(3.8rem, 11.5vw, 8.5rem)',
            lineHeight: 0.88,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.93)',
            userSelect: 'none',
          }}
        >
          CULTURE
        </motion.span>

        {/* INDIA */}
        <motion.span
          {...fadeUp(0.24)}
          style={{
            display: 'block',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(3.8rem, 11.5vw, 8.5rem)',
            lineHeight: 0.88,
            letterSpacing: '-0.02em',
            color: '#e2a9f1',
            userSelect: 'none',
          }}
        >
          INDIA
        </motion.span>

        {/* Tagline */}
        <motion.p
          {...fadeUp(0.3)}
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '8.5px',
            letterSpacing: '0.42em',
            color: 'rgba(226,169,241,0.38)',
            marginTop: '20px',
            userSelect: 'none',
          }}
        >
          ORGANISING THE UNDERGROUND
        </motion.p>

        {/* Button */}
        <div style={{ marginTop: '40px' }}>
          <JoinButton onClick={scrollToWaitlist} />
        </div>
      </div>
    </section>
  );
}
