import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { wheelSegments, spinConfig, copy } from './wheelConfig';

const LAVENDER = '#E8DEFA';
const LAVENDER_DIM = '#b6a9d6';
const INK = '#0a0a0a';
const INK2 = '#141414';

// Wheel geometry (in viewBox units, 320×320)
const CX = 160;
const CY = 160;
const R = 144;
const TEXT_R = 96;

function weightedRandom(): number {
  const total = wheelSegments.reduce((s, seg) => s + seg.weight, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < wheelSegments.length; i++) {
    rand -= wheelSegments[i].weight;
    if (rand <= 0) return i;
  }
  return wheelSegments.length - 1;
}

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

// Equalizer bar inline animation configs (avoids Tailwind dynamic class scanning issue)
const EQ_BARS = [
  { animation: 'eq-bar-1 0.8s ease-in-out infinite alternate' },
  { animation: 'eq-bar-2 1s ease-in-out infinite alternate' },
  { animation: 'eq-bar-3 0.6s ease-in-out infinite alternate' },
  { animation: 'eq-bar-1 0.8s ease-in-out infinite alternate 0.15s' },
  { animation: 'eq-bar-2 1s ease-in-out infinite alternate 0.3s' },
  { animation: 'eq-bar-3 0.6s ease-in-out infinite alternate 0.1s' },
  { animation: 'eq-bar-1 0.8s ease-in-out infinite alternate 0.2s' },
];

export default function Wheel() {
  const [currentDeg, setCurrentDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const n = wheelSegments.length;
  const segAngle = 360 / n;

  // Precompute static SVG slice geometry — only changes if config changes
  const slices = useMemo(() => {
    return wheelSegments.map((seg, i) => {
      // -90° offset: SVG 0° is 3 o'clock; we want segment 0 to start at 12 o'clock
      const startAngle = i * segAngle - 90;
      const endAngle = (i + 1) * segAngle - 90;

      const s = polar(startAngle, R);
      const e = polar(endAngle, R);
      const largeArc = segAngle > 180 ? 1 : 0;
      const d = `M ${CX} ${CY} L ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${R} ${R} 0 ${largeArc} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)} Z`;

      const midAngle = (i + 0.5) * segAngle - 90;
      const tp = polar(midAngle, TEXT_R);

      const even = i % 2 === 0;
      const fill = even ? LAVENDER : INK2;
      const textFill = even ? INK : LAVENDER;
      const fontSize = n > 10 ? 9 : 10;

      return (
        <g key={i}>
          <path d={d} fill={fill} stroke={INK} strokeWidth="1.5" />
          <text
            x={tp.x}
            y={tp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${midAngle + 90}, ${tp.x.toFixed(3)}, ${tp.y.toFixed(3)})`}
            fill={textFill}
            fontSize={fontSize}
            fontFamily="'Space Grotesk', sans-serif"
            fontWeight="700"
            letterSpacing="0.02em"
          >
            {seg.label}
          </text>
        </g>
      );
    });
  }, [n, segAngle]);

  const handleSpin = () => {
    if (spinning) return;

    const targetIndex = weightedRandom();
    const targetCenter = (targetIndex + 0.5) * segAngle;
    // slight random offset within segment — looks more natural than always hitting dead-center
    const jitter = (Math.random() - 0.5) * segAngle * 0.5;
    const targetPos = targetCenter + jitter;

    const currentMod = ((currentDeg % 360) + 360) % 360;
    const delta = ((targetPos - currentMod) + 360) % 360;
    const extraSpins =
      spinConfig.minSpins +
      Math.floor(Math.random() * (spinConfig.maxSpins - spinConfig.minSpins + 1));
    const newDeg = currentDeg + delta + extraSpins * 360;

    setSpinning(true);
    setResult(null);
    setCurrentDeg(newDeg);

    setTimeout(() => {
      setSpinning(false);
      setResult(wheelSegments[targetIndex].label);
    }, spinConfig.spinDurationMs + 80);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Wheel + pointer */}
      <div
        className="relative mx-auto select-none"
        style={{ width: 'min(340px, 85vw)', aspectRatio: '1' }}
      >
        {/* Fixed pointer (sits outside the rotating SVG) */}
        <div
          className="absolute z-10"
          style={{
            top: 0,
            left: '50%',
            transform: 'translateX(-50%) translateY(-10px)',
            width: 0,
            height: 0,
            borderLeft: '11px solid transparent',
            borderRight: '11px solid transparent',
            borderTop: `22px solid ${LAVENDER}`,
            filter: 'drop-shadow(0 0 8px rgba(232,222,250,0.7))',
          }}
        />

        {/* The wheel — only this element rotates */}
        <svg
          viewBox="0 0 320 320"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            transform: `rotate(${currentDeg}deg)`,
            transition: spinning
              ? `transform ${spinConfig.spinDurationMs}ms cubic-bezier(0.23, 1, 0.32, 1)`
              : 'none',
            transformOrigin: 'center',
            willChange: 'transform',
          }}
        >
          {slices}
          {/* Outer ring */}
          <circle
            cx="160" cy="160" r="144"
            fill="none"
            stroke={LAVENDER}
            strokeWidth="1.5"
            opacity="0.4"
          />
          {/* Center hub */}
          <circle cx="160" cy="160" r="15" fill={INK} stroke={LAVENDER} strokeWidth="1.5" />
          <circle cx="160" cy="160" r="5" fill={LAVENDER} />
        </svg>
      </div>

      {/* Controls / result */}
      <div className="flex flex-col items-center gap-4 w-full">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <p
                className="text-sm uppercase tracking-widest"
                style={{ color: LAVENDER_DIM, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {copy.resultPrefix}
              </p>
              <p
                className="text-4xl sm:text-5xl font-black tracking-tight"
                style={{ color: LAVENDER, fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {result}
              </p>

              {/* Equalizer bar pulse — reuses existing @keyframes from index.css */}
              <div className="flex items-end gap-[4px] mt-1" style={{ height: '24px' }}>
                {EQ_BARS.map((bar, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      width: '4px',
                      backgroundColor: LAVENDER,
                      borderRadius: '9999px',
                      animation: bar.animation,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setResult(null)}
                className="mt-1 px-8 py-3 border rounded-full text-sm font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer hover:bg-white/5"
                style={{
                  borderColor: `${LAVENDER}40`,
                  color: LAVENDER,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {copy.spinAgainLabel}
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="spin-btn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={handleSpin}
              disabled={spinning}
              className="w-full py-5 rounded-full text-xl font-black tracking-[0.2em] uppercase transition-all duration-200 cursor-pointer"
              style={{
                maxWidth: '280px',
                backgroundColor: spinning ? LAVENDER_DIM : LAVENDER,
                color: INK,
                fontFamily: "'JetBrains Mono', monospace",
                opacity: spinning ? 0.7 : 1,
                cursor: spinning ? 'not-allowed' : 'pointer',
                boxShadow: spinning
                  ? 'none'
                  : '0 0 32px rgba(232,222,250,0.25)',
              }}
            >
              {spinning ? '· · ·' : copy.spinButtonLabel}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
