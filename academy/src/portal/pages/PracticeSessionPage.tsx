const MONO = "'JetBrains Mono', 'Space Mono', monospace"
const SANS = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"

function WaveformBars() {
  const heights = [0.2, 0.6, 1.0, 0.45, 0.8, 0.35, 0.9, 0.5, 0.7, 0.3, 0.85, 0.55, 0.75, 0.4, 0.65]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 48 }}>
      {heights.map((h, i) => (
        <div key={i} className="practice-wave-bar" style={{
          width: 3, background: 'rgba(232,222,250,0.25)', borderRadius: 2,
          height: `${h * 100}%`,
          animationDelay: `${i * 0.1}s`,
          animationDuration: `${0.9 + (i % 3) * 0.3}s`,
        }} />
      ))}
    </div>
  )
}

export default function PracticeSessionPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: SANS, padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 420 }}>
        <WaveformBars />

        <div style={{ marginTop: 36 }}>
          <div style={{
            display: 'inline-block',
            fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#0a0a0a', background: '#E8DEFA',
            padding: '4px 10px', marginBottom: 28,
          }}>
            Coming soon
          </div>
        </div>

        <h1 style={{
          fontFamily: SANS, fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 700,
          color: '#E8DEFA', letterSpacing: '-0.025em',
          lineHeight: 1.1, margin: '0 0 20px',
        }}>
          Book a practice slot.
        </h1>

        <p style={{
          fontSize: 15, color: 'rgba(232,222,250,0.6)',
          lineHeight: 1.7, margin: '0 0 40px', fontFamily: SANS,
        }}>
          Reserve studio time outside of class hours. Drop in, run your sets,
          and get reps on the decks — at your pace.
        </p>

        <div style={{
          borderTop: '1px solid rgba(232,222,250,0.08)',
          paddingTop: 28,
          fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(232,222,250,0.3)',
        }}>
          We'll notify you when booking opens.
        </div>
      </div>

      <style>{`
        @keyframes practice-wave-pulse {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        .practice-wave-bar { animation: practice-wave-pulse 1s ease-in-out infinite; transform-origin: bottom; }
      `}</style>
    </div>
  )
}
