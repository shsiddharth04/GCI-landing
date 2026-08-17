const ITEMS = [
  'DJ COURSE', 'GURUGRAM', 'ORGANIC SINGULAR SOUND', 'MASTERCLASS FREE',
  'IN-STUDIO', 'LIVE BOOKING PIPELINE', 'GCI MUSIC ACADEMY', 'LEARN TO READ A ROOM',
]

function TickerItem({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-6 px-3">
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#050505', whiteSpace: 'nowrap' }}>
        {text}
      </span>
      <span style={{ color: 'rgba(5,5,5,0.35)', fontSize: '18px', lineHeight: 1 }}>·</span>
    </span>
  )
}

export default function Ticker() {
  const repeated = [...ITEMS, ...ITEMS]
  return (
    <div style={{ background: '#e2a9f1', overflow: 'hidden', padding: '14px 0', borderTop: '1px solid rgba(226,169,241,0.3)', borderBottom: '1px solid rgba(226,169,241,0.3)' }}>
      <div className="ticker-track">
        {repeated.map((item, i) => <TickerItem key={i} text={item} />)}
      </div>
    </div>
  )
}
