import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

const TICKER_ITEMS = [
  'Underground Music',
  'Live Events',
  'India',
  'Independent Artists',
  'Gig Culture',
  'Raw Sound',
  'Authentic Talent',
  'Stage Ready',
  'Unfiltered',
  'Born Underground',
];

function LogoMark() {
  // EQ bar heights — asymmetric for an organic feel
  const heights = [8, 14, 20, 12, 28, 22, 16, 24, 10, 18];
  const barW = 3.5;
  const gap = 2.5;
  const totalW = heights.length * barW + (heights.length - 1) * gap;
  const startX = (72 - totalW) / 2;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="33" stroke="#CBA6F7" strokeWidth="0.75" opacity="0.65" />
      <circle cx="36" cy="36" r="27.5" stroke="#CBA6F7" strokeWidth="0.5" opacity="0.2" />
      {heights.map((h, i) => {
        const x = startX + i * (barW + gap);
        return (
          <rect
            key={i}
            x={x}
            y={36 - h / 2}
            width={barW}
            height={h}
            rx="1.75"
            fill="#CBA6F7"
            opacity={0.35 + (h / 28) * 0.55}
          />
        );
      })}
    </svg>
  );
}

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Continuous ambient waveform in the background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const WAVES = [
      { freq: 0.006, amp: 70, speed: 0.22, op: 0.045, yPos: 0.10 },
      { freq: 0.009, amp: 48, speed: 0.38, op: 0.065, yPos: 0.30 },
      { freq: 0.005, amp: 88, speed: 0.18, op: 0.035, yPos: 0.52 },
      { freq: 0.011, amp: 36, speed: 0.52, op: 0.075, yPos: 0.70 },
      { freq: 0.007, amp: 62, speed: 0.28, op: 0.045, yPos: 0.88 },
    ];

    let t = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      WAVES.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(203, 166, 247, ${w.op})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x <= canvas.width; x += 4) {
          const y = canvas.height * w.yPos + Math.sin(x * w.freq + t * w.speed) * w.amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }

        ctx.stroke();
      });

      t += 0.012;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Auto-scroll to the waitlist section after the hero animation finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="grain relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-[#070708]">

      {/* Live waveform canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Central ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#CBA6F7]/5 rounded-full blur-[180px] pointer-events-none z-[1]" />

      {/* Top hairline accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#CBA6F7]/30 to-transparent z-10" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">

        {/* Logo mark — scales in first */}
        <motion.div
          className="mb-10 relative"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Soft glow ring behind the logo */}
          <div className="absolute inset-0 scale-[2] blur-3xl bg-[#CBA6F7]/12 rounded-full pointer-events-none" />
          <div className="relative">
            <LogoMark />
          </div>
        </motion.div>

        {/* GIG */}
        <motion.span
          className="block font-black uppercase text-white tracking-[0.06em] leading-[0.88] select-none"
          style={{ fontSize: 'clamp(4.5rem, 14vw, 9.5rem)' }}
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
        >
          GIG
        </motion.span>

        {/* CULTURE */}
        <motion.span
          className="block font-black uppercase text-white tracking-[0.06em] leading-[0.88] select-none"
          style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)' }}
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.65, ease: [0.16, 1, 0.3, 1] }}
        >
          CULTURE
        </motion.span>

        {/* INDIA — accent colour, extra letter-spacing */}
        <motion.span
          className="block font-black uppercase text-[#CBA6F7] leading-none mt-1 select-none"
          style={{ fontSize: 'clamp(2.2rem, 7vw, 5rem)', letterSpacing: '0.24em' }}
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 2.15, ease: [0.16, 1, 0.3, 1] }}
        >
          INDIA
        </motion.span>

        {/* Music Academy label */}
        <motion.div
          className="flex items-center gap-4 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 2.9 }}
        >
          <div className="h-px w-8 bg-[#CBA6F7]/35" />
          <span className="text-[#CBA6F7]/65 font-bold uppercase tracking-[0.45em]" style={{ fontSize: '9px' }}>
            Music Academy
          </span>
          <div className="h-px w-8 bg-[#CBA6F7]/35" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="mt-4 text-zinc-500 text-sm tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 3.3 }}
        >
          India's underground music scene, formalized.
        </motion.p>

        {/* Scroll cue */}
        <motion.div
          className="mt-16 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 4.0 }}
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
      </div>

      {/* Scrolling ticker at the bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 border-t border-zinc-900/70 overflow-hidden py-2.5 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 3.6 }}
      >
        {/* Content doubled so the loop is seamless */}
        <motion.div
          className="flex"
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 1].map(set =>
            TICKER_ITEMS.flatMap((item, i) => [
              <span
                key={`${set}-item-${i}`}
                className="whitespace-nowrap px-5 text-zinc-700 font-semibold uppercase tracking-[0.2em]"
                style={{ fontSize: '9px' }}
              >
                {item}
              </span>,
              <span
                key={`${set}-dot-${i}`}
                className="text-[#CBA6F7]/22 px-1 select-none"
                style={{ fontSize: '9px' }}
              >
                •
              </span>,
            ])
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
