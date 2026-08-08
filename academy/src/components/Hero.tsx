import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

// Scan line sweeps for 3200ms — element reveal timings align with scan position
const REVEAL_MS = {
  logo:    700,
  gig:     1050,
  culture: 1380,
  india:   1680,
  label:   1950,
  year:    2180,
  cue:     2600,
  ticker:  2900,
};

const TICKER_ITEMS = [
  'Underground', 'India', 'Music', 'Culture', 'Raw',
  'Unfiltered', 'Independent', 'Authentic', 'Live', 'Underground',
];

// EQ mark — same DNA, now rendered in Bebas Neue context
function LogoMark() {
  const heights = [7, 13, 19, 11, 26, 21, 15, 23, 9, 17];
  const barW = 3, gap = 2.5;
  const totalW = heights.length * barW + (heights.length - 1) * gap;
  const startX = (64 - totalW) / 2;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="29.5" stroke="#CBA6F7" strokeWidth="0.75" opacity="0.55" />
      {heights.map((h, i) => (
        <rect
          key={i}
          x={startX + i * (barW + gap)}
          y={32 - h / 2}
          width={barW}
          height={h}
          rx="1.5"
          fill="#CBA6F7"
          opacity={0.3 + (h / 26) * 0.6}
        />
      ))}
    </svg>
  );
}

function useReveal() {
  const [r, setR] = useState({
    logo: false, gig: false, culture: false,
    india: false, label: false, year: false,
    cue: false, ticker: false,
  });

  useEffect(() => {
    const ts = Object.entries(REVEAL_MS).map(([key, ms]) =>
      setTimeout(() => setR(p => ({ ...p, [key]: true })), ms)
    );
    return () => ts.forEach(clearTimeout);
  }, []);

  return r;
}

function fadeIn(revealed: boolean, delayMs = 0) {
  return {
    animate: { opacity: revealed ? 1 : 0, y: revealed ? 0 : 12 },
    transition: { duration: 0.5, delay: delayMs / 1000, ease: 'easeOut' as const },
  };
}

export default function Hero() {
  const scanRef    = useRef<HTMLDivElement>(null);
  const scanDoneRef = useRef(false);
  const r          = useReveal();

  // CRT scan line — rAF driven, no state updates = zero re-renders
  useEffect(() => {
    const el = scanRef.current;
    if (!el) return;
    const duration = 3400;
    const start = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      el.style.top = `${-2 + p * 104}vh`;

      if (p >= 1 && !scanDoneRef.current) {
        scanDoneRef.current = true;
        el.style.opacity = '0';
      }

      if (p < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Auto-scroll to waitlist
  useEffect(() => {
    const t = setTimeout(() => {
      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
    }, 7500);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="grain relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050505]">

      {/* CRT scan line */}
      <div
        ref={scanRef}
        className="absolute left-0 right-0 pointer-events-none z-20"
        style={{
          top: '-2vh',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(203,166,247,0.5) 15%, rgba(203,166,247,0.95) 50%, rgba(203,166,247,0.5) 85%, transparent 100%)',
          boxShadow: '0 0 24px 6px rgba(203,166,247,0.12)',
          transition: 'opacity 0.6s ease',
        }}
      />

      {/* Very dark radial gradient — keeps edges black, center slightly lifted */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(203,166,247,0.025) 0%, transparent 70%)' }}
      />

      {/* Top hairline */}
      <div className="absolute top-0 left-0 right-0 h-px z-10"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(203,166,247,0.2), transparent)' }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center">

        {/* Logo mark */}
        <motion.div
          className="mb-8 relative"
          {...fadeIn(r.logo)}
        >
          {/* Slow breathing glow — the only continuous animation on the page */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ scale: 2.5, filter: 'blur(24px)', background: 'rgba(203,166,247,0.1)' }}
            animate={{ opacity: r.logo ? [0.4, 0.9, 0.4] : 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <div className="relative"><LogoMark /></div>
        </motion.div>

        {/* GIG */}
        <motion.span
          className="font-display block text-white select-none"
          style={{ fontSize: 'clamp(6rem, 18vw, 13rem)', lineHeight: 0.88, letterSpacing: '0.02em' }}
          {...fadeIn(r.gig)}
        >
          GIG
        </motion.span>

        {/* CULTURE */}
        <motion.span
          className="font-display block text-white select-none"
          style={{ fontSize: 'clamp(6rem, 18vw, 13rem)', lineHeight: 0.88, letterSpacing: '0.02em' }}
          {...fadeIn(r.culture)}
        >
          CULTURE
        </motion.span>

        {/* INDIA */}
        <motion.span
          className="font-display block select-none"
          style={{
            fontSize: 'clamp(6rem, 18vw, 13rem)',
            lineHeight: 0.88,
            letterSpacing: '0.02em',
            color: '#CBA6F7',
          }}
          {...fadeIn(r.india)}
        >
          INDIA
        </motion.span>

        {/* Music Academy divider */}
        <motion.div
          className="flex items-center gap-4 mt-7"
          {...fadeIn(r.label)}
        >
          <div style={{ width: '32px', height: '1px', background: 'rgba(203,166,247,0.3)' }} />
          <span
            className="font-mono text-[#CBA6F7] uppercase"
            style={{ fontSize: '9px', letterSpacing: '0.45em', opacity: 0.6 }}
          >
            Music Academy
          </span>
          <div style={{ width: '32px', height: '1px', background: 'rgba(203,166,247,0.3)' }} />
        </motion.div>

        {/* Year — cryptic, reveals nothing */}
        <motion.p
          className="font-mono text-zinc-600 mt-3 select-none"
          style={{ fontSize: '11px', letterSpacing: '0.3em' }}
          {...fadeIn(r.year)}
        >
          MMXXVI
        </motion.p>

        {/* Scroll cue */}
        <motion.div
          className="mt-14 flex flex-col items-center gap-3"
          {...fadeIn(r.cue)}
        >
          <span className="font-mono text-zinc-700 uppercase" style={{ fontSize: '8px', letterSpacing: '0.35em' }}>
            Register Interest
          </span>
          <motion.div
            style={{ width: '1px', height: '36px', background: 'linear-gradient(180deg, rgba(203,166,247,0.5), transparent)' }}
            animate={{ opacity: r.cue ? [0.4, 1, 0.4] : 0, scaleY: r.cue ? [0.5, 1, 0.5] : 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Scrolling ticker */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 overflow-hidden py-2.5 z-10"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        {...fadeIn(r.ticker)}
      >
        <motion.div
          className="flex"
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 1].map(set =>
            TICKER_ITEMS.flatMap((item, i) => [
              <span
                key={`${set}-t-${i}`}
                className="font-mono whitespace-nowrap text-zinc-800 uppercase"
                style={{ fontSize: '8px', letterSpacing: '0.25em', padding: '0 20px' }}
              >
                {item}
              </span>,
              <span
                key={`${set}-d-${i}`}
                className="select-none"
                style={{ color: 'rgba(203,166,247,0.15)', fontSize: '8px' }}
              >
                /
              </span>,
            ])
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
