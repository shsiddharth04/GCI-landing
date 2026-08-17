const ITEMS = [
  'DJ COURSE', 'GURUGRAM', 'ORGANIC SINGULAR SOUND', 'MASTERCLASS FREE',
  'IN-STUDIO', 'LIVE BOOKING PIPELINE', 'GCI MUSIC ACADEMY', 'LEARN TO READ A ROOM',
]

function TickerItem({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-6 px-3">
      <span className="text-[#0a0a0a] font-mono text-xs font-semibold tracking-[0.2em] uppercase whitespace-nowrap">
        {text}
      </span>
      <span className="text-[#0a0a0a]/40 text-lg leading-none">·</span>
    </span>
  )
}

export default function Ticker() {
  const repeated = [...ITEMS, ...ITEMS]

  return (
    <div className="bg-[#E8DEFA] overflow-hidden py-4 border-y border-[#E8DEFA]">
      <div className="ticker-track">
        {repeated.map((item, i) => (
          <TickerItem key={i} text={item} />
        ))}
      </div>
    </div>
  )
}
