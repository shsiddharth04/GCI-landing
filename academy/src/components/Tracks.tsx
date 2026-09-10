const ITEMS = [
  'DJ COURSE', 'GURUGRAM', 'ORGANIC SINGULAR SOUND', 'MASTERCLASS',
  'IN-STUDIO', 'LIVE BOOKING PIPELINE', 'GCI ACADEMY', 'LEARN TO READ A ROOM',
]

const ITEMS_REVERSE = [
  'GCI ACADEMY', 'IN-STUDIO', 'GURUGRAM', 'BATCH OF 3',
  'PIONEER XDJ-RX3', 'REAL BOOKINGS', 'LEARN TO READ A ROOM', 'DJ COURSE',
]

function TickerItem({ text, dim }: { text: string; dim?: boolean }) {
  return (
    <span className="inline-flex items-center gap-6 px-3">
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: dim ? '9px' : '10px',
        fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
        color: dim ? 'rgba(5,5,5,0.45)' : '#050505', whiteSpace: 'nowrap',
      }}>
        {text}
      </span>
      <span style={{ color: dim ? 'rgba(5,5,5,0.2)' : 'rgba(5,5,5,0.35)', fontSize: '18px', lineHeight: 1 }}>·</span>
    </span>
  )
}

export default function Ticker() {
  const repeated = [...ITEMS, ...ITEMS]
  const repeatedReverse = [...ITEMS_REVERSE, ...ITEMS_REVERSE]
  return (
    <div style={{ background: '#d4bfff', overflow: 'hidden', borderTop: '2px solid #050505', borderBottom: '2px solid #050505' }}>
      <div style={{ padding: '13px 0', borderBottom: '1px solid rgba(5,5,5,0.12)' }}>
        <div className="ticker-track">
          {repeated.map((item, i) => <TickerItem key={i} text={item} />)}
        </div>
      </div>
      <div style={{ padding: '10px 0' }}>
        <div className="ticker-track-reverse">
          {repeatedReverse.map((item, i) => <TickerItem key={i} text={item} dim />)}
        </div>
      </div>
    </div>
  )
}
