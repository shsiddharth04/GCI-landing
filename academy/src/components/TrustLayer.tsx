const MONO = "'Space Mono', monospace"
const SANS = "'Plus Jakarta Sans', sans-serif"

const BLOCKS = [
  {
    title: 'GCI ARTIST',
    name: 'Viraj Shah',
    line: 'Tomorrowland today, GCI always.',
    photo: '/viraj.jpg',
    grayscale: false,
  },
  {
    title: 'ACADEMY ADVISOR',
    name: 'Zoheb Khan',
    line: "Produced 'Bang Bang', remixed Chennai Express, now backing GCI.",
    photo: '/zoheb.jpg',
    grayscale: true,
  },
]

export default function TrustLayer() {
  return (
    <section style={{ background: '#050505', padding: 'clamp(40px, 5vw, 64px) 24px' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ marginBottom: 'clamp(20px, 3vw, 36px)' }}>
          <div style={{
            fontFamily: MONO, fontSize: 9, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: '#d4bfff',
            marginBottom: 16,
          }}>
            // TRUST_LAYER
          </div>
          <h2 style={{
            fontFamily: SANS, fontWeight: 700,
            fontSize: 'clamp(36px, 6vw, 64px)',
            color: '#ffffff', margin: 0,
            letterSpacing: '-0.02em', lineHeight: 1.05,
          }}>
            Vouched By The Underground
          </h2>
        </div>

        {/* Two-block row */}
        <div style={{ position: 'relative' }}>
          {/* Blueprint bridge line across the center join */}
          <div style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 48,
            height: 1,
            background: 'rgba(212,191,255,0.25)',
            zIndex: 2,
          }} />

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
          }}>
            {BLOCKS.map((b) => (
              <div
                key={b.name}
                style={{
                  flex: '1 1 320px',
                  border: '1px solid rgba(212,191,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Photo */}
                <img
                  src={b.photo}
                  alt={b.name}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: 280,
                    objectFit: 'scale-down',
                    filter: b.grayscale ? 'grayscale(100%)' : 'none',
                  }}
                />

                {/* Text */}
                <div style={{ padding: '20px 24px 28px', borderTop: '1px solid rgba(212,191,255,0.1)' }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 9,
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: '#d4bfff', marginBottom: 10,
                  }}>
                    {b.title}
                  </div>
                  <div style={{
                    fontFamily: SANS, fontWeight: 700,
                    fontSize: 'clamp(20px, 3vw, 26px)',
                    color: '#ffffff', marginBottom: 8,
                    letterSpacing: '-0.01em', lineHeight: 1.1,
                  }}>
                    {b.name}
                  </div>
                  <div style={{
                    fontFamily: SANS, fontSize: 14,
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.65,
                  }}>
                    {b.line}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
