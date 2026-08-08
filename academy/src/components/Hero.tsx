import { useEffect, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'motion/react';

// Text slam timings (ms from mount)
const GIG_T     = 500;
const CULTURE_T = 950;
const INDIA_T   = 1380;

const TICKER_ITEMS = [
  'Underground Music', 'Live Events', 'India', 'Independent Artists',
  'Gig Culture', 'Raw Sound', 'Authentic Talent', 'Stage Ready',
  'Unfiltered', 'Born Underground',
];

function LogoMark() {
  const heights = [8, 14, 20, 12, 28, 22, 16, 24, 10, 18];
  const barW = 3.5, gap = 2.5;
  const totalW = heights.length * barW + (heights.length - 1) * gap;
  const startX = (72 - totalW) / 2;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="33" stroke="#CBA6F7" strokeWidth="0.75" opacity="0.65" />
      <circle cx="36" cy="36" r="27.5" stroke="#CBA6F7" strokeWidth="0.5" opacity="0.2" />
      {heights.map((h, i) => (
        <rect
          key={i}
          x={startX + i * (barW + gap)}
          y={36 - h / 2}
          width={barW}
          height={h}
          rx="1.75"
          fill="#CBA6F7"
          opacity={0.35 + (h / 28) * 0.55}
        />
      ))}
    </svg>
  );
}

function SpotlightBeam({ left, color, sweep, duration, delay, initialRotate = 0 }: {
  left: string; color: string; sweep: number;
  duration: number; delay: number; initialRotate?: number;
}) {
  return (
    <motion.div
      className="absolute top-0 pointer-events-none"
      style={{ left, translateX: '-50%', transformOrigin: '50% 0px', width: 1, height: 1 }}
      initial={{ rotate: initialRotate }}
      animate={{ rotate: [initialRotate - sweep, initialRotate + sweep, initialRotate - sweep] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '-280px', width: '560px', height: '100vh',
        background: `linear-gradient(180deg, ${color} 0%, transparent 76%)`,
        clipPath: 'polygon(48.5% 0%, 51.5% 0%, 100% 100%, 0% 100%)',
      }} />
    </motion.div>
  );
}

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strobeRef = useRef<HTMLDivElement>(null);
  const waveBoost = useRef(1);
  const shakeCtrl = useAnimationControls();

  // ── Background waveforms — amplitude driven by waveBoost ref ─────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const WAVES = [
      { freq: 0.006, amp: 65,  speed: 0.22, op: 0.045, yPos: 0.10 },
      { freq: 0.009, amp: 45,  speed: 0.38, op: 0.060, yPos: 0.30 },
      { freq: 0.005, amp: 82,  speed: 0.18, op: 0.032, yPos: 0.52 },
      { freq: 0.011, amp: 34,  speed: 0.52, op: 0.070, yPos: 0.70 },
      { freq: 0.007, amp: 58,  speed: 0.28, op: 0.042, yPos: 0.88 },
    ];

    let t = 0, animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const b = waveBoost.current;

      WAVES.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(203,166,247,${Math.min(w.op * b, 0.45)})`;
        ctx.lineWidth = b > 2 ? 2.5 : 1.5;
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = canvas.height * w.yPos + Math.sin(x * w.freq + t * w.speed) * w.amp * b;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      t += 0.012;
      if (waveBoost.current > 1) waveBoost.current = Math.max(1, waveBoost.current - 0.05);
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // ── Impact: strobe + shake + wave spike — all fire simultaneously ─────────
  const fireImpact = useCallback((level: 1 | 2 | 3) => {
    const flashCount = [0, 2, 3, 4][level];
    const flashOp    = [0, '0.10', '0.16', '0.24'][level] as string;
    const shakeAmp   = [0, 4, 7, 11][level];
    const boost      = [0, 2, 3.5, 5.5][level];

    // Strobe — direct DOM, no React scheduler lag
    const el = strobeRef.current;
    if (el) {
      const flash = (n: number) => {
        el.style.opacity = flashOp;
        setTimeout(() => { el.style.opacity = '0'; }, 50);
        if (n > 1) setTimeout(() => flash(n - 1), 110);
      };
      flash(flashCount);
    }

    // Wave amplitude spike — decays in draw loop
    waveBoost.current = boost;

    // Shake — escalating keyframes
    const s = shakeAmp;
    shakeCtrl.start({
      x: [-s, s * 1.2, -s * 0.9, s * 0.65, -s * 0.4, s * 0.2, -s * 0.1, 0],
      y: [-s * 0.5, s * 0.4, -s * 0.7, s * 0.35, -s * 0.25, s * 0.1, 0],
      transition: { duration: 0.55, ease: 'easeOut' },
    });
  }, [shakeCtrl]);

  // Tie each impact to the exact frame each word slams in
  useEffect(() => {
    const ts = [
      setTimeout(() => fireImpact(1), GIG_T),
      setTimeout(() => fireImpact(2), CULTURE_T),
      setTimeout(() => fireImpact(3), INDIA_T),
    ];
    return () => ts.forEach(clearTimeout);
  }, [fireImpact]);

  // Ambient impacts after the intro settles
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => { fireImpact(1); loop(); }, 9000 + Math.random() * 11000);
    };
    const init = setTimeout(loop, 6500);
    return () => { clearTimeout(t); clearTimeout(init); };
  }, [fireImpact]);

  // Auto-scroll to waitlist
  useEffect(() => {
    const t = setTimeout(() => {
      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
    }, 7000);
    return () => clearTimeout(t);
  }, []);

  // Per-word spring slam + chromatic aberration glitch
  const slam = (delayS: number) => ({
    initial: { opacity: 0, y: 90, scale: 0.86 },
    animate: {
      opacity: 1, y: 0, scale: 1,
      textShadow: [
        '10px 0 rgba(203,166,247,0.95), -10px 0 rgba(100,220,255,0.85)',
        '5px 0 rgba(203,166,247,0.5),  -5px 0 rgba(100,220,255,0.4)',
        '0px 0 rgba(203,166,247,0),     0px 0 rgba(100,220,255,0)',
      ],
    },
    transition: {
      y:          { type: 'spring' as const, stiffness: 800, damping: 16, delay: delayS },
      scale:      { type: 'spring' as const, stiffness: 800, damping: 16, delay: delayS },
      opacity:    { duration: 0.01, delay: delayS },
      textShadow: { duration: 0.45, delay: delayS, ease: 'easeOut' as const },
    },
  });

  return (
    <section className="grain relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-[#070708]">

      {/* Layer 0 — canvas waveforms */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Layer 1 — sweeping spotlight beams */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <SpotlightBeam left="16%" color="rgba(203,166,247,0.12)" sweep={15} duration={9}  delay={0}   initialRotate={-7} />
        <SpotlightBeam left="50%" color="rgba(255,255,255,0.048)" sweep={11} duration={14} delay={3}   initialRotate={0}  />
        <SpotlightBeam left="84%" color="rgba(203,166,247,0.12)" sweep={17} duration={11} delay={1.5} initialRotate={7}  />
      </div>

      {/* Layer 2 — pulsing vignette (breathing bass feel) */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{ background: 'radial-gradient(ellipse 75% 75% at 50% 55%, transparent 20%, rgba(0,0,0,0.92) 100%)' }}
        animate={{ opacity: [0.45, 1, 0.55, 0.92, 0.45] }}
        transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Layer 3 — strobe (direct DOM) */}
      <div
        ref={strobeRef}
        className="absolute inset-0 bg-white pointer-events-none z-[3]"
        style={{ opacity: 0 }}
      />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#CBA6F7]/30 to-transparent z-10" />

      {/* Constant bass tremor on the entire content block */}
      <motion.div
        className="relative z-10 w-full flex flex-col items-center text-center px-6"
        animate={{
          x: [-0.9, 0.7, -1.0, 0.6, -0.7, 0.9, -0.9],
          y: [-0.5, 0.7, -0.8, 0.4, -0.6, 0.5, -0.5],
        }}
        transition={{ duration: 0.42, repeat: Infinity, ease: 'linear' }}
      >
        {/* Impact shakes ride on top of the tremor */}
        <motion.div animate={shakeCtrl} className="flex flex-col items-center">

          {/* Logo slams in first */}
          <motion.div
            className="mb-10 relative"
            initial={{ opacity: 0, scale: 0.25 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 550, damping: 20, delay: 0.15 }}
          >
            <div className="absolute inset-0 scale-[2.4] blur-3xl bg-[#CBA6F7]/15 rounded-full pointer-events-none" />
            <div className="relative"><LogoMark /></div>
          </motion.div>

          {/* GIG */}
          <motion.span
            className="block font-black uppercase text-white select-none"
            style={{ fontSize: 'clamp(5rem, 16vw, 11rem)', letterSpacing: '-0.015em', lineHeight: 0.85 }}
            {...slam(GIG_T / 1000)}
          >
            GIG
          </motion.span>

          {/* CULTURE */}
          <motion.span
            className="block font-black uppercase text-white select-none"
            style={{ fontSize: 'clamp(3.2rem, 10.5vw, 7rem)', letterSpacing: '-0.015em', lineHeight: 0.85 }}
            {...slam(CULTURE_T / 1000)}
          >
            CULTURE
          </motion.span>

          {/* INDIA — accent colour, tighter to CULTURE, wider tracking */}
          <motion.span
            className="block font-black uppercase text-[#CBA6F7] select-none"
            style={{ fontSize: 'clamp(2.4rem, 7.5vw, 5.2rem)', letterSpacing: '0.22em', lineHeight: 1, marginTop: '4px' }}
            {...slam(INDIA_T / 1000)}
          >
            INDIA
          </motion.span>

          {/* Music Academy label */}
          <motion.div
            className="flex items-center gap-4 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.1 }}
          >
            <div className="h-px w-8 bg-[#CBA6F7]/35" />
            <span className="text-[#CBA6F7]/60 font-bold uppercase tracking-[0.45em]" style={{ fontSize: '9px' }}>
              Music Academy
            </span>
            <div className="h-px w-8 bg-[#CBA6F7]/35" />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="mt-4 text-zinc-500 text-sm tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.5 }}
          >
            India's underground music scene, formalized.
          </motion.p>

          {/* Scroll cue */}
          <motion.div
            className="mt-14 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 3.2 }}
          >
            <span className="text-zinc-700 font-semibold uppercase tracking-[0.3em]" style={{ fontSize: '9px' }}>
              Scroll to Register
            </span>
            <motion.div
              className="w-px h-9 bg-gradient-to-b from-[#CBA6F7]/55 to-transparent"
              animate={{ opacity: [0.4, 1, 0.4], scaleY: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

        </motion.div>
      </motion.div>

      {/* Scrolling ticker */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 border-t border-zinc-900/70 overflow-hidden py-2.5 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.8 }}
      >
        <motion.div
          className="flex"
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 1].map(set =>
            TICKER_ITEMS.flatMap((item, i) => [
              <span
                key={`${set}-t-${i}`}
                className="whitespace-nowrap px-5 text-zinc-700 font-semibold uppercase tracking-[0.2em]"
                style={{ fontSize: '9px' }}
              >
                {item}
              </span>,
              <span key={`${set}-d-${i}`} className="text-[#CBA6F7]/20 px-1 select-none" style={{ fontSize: '9px' }}>
                •
              </span>,
            ])
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
