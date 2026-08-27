import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  value: string // HH:MM 24h
  onChange: (v: string) => void
  placeholder?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

function fmt12(value: string) {
  if (!value) return ''
  const [hh, mm] = value.split(':')
  const h = parseInt(hh, 10)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${mm} ${suffix}`
}

export default function TimePicker({ value, onChange, placeholder = 'Select time' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hourListRef = useRef<HTMLDivElement>(null)

  const [selH, selM] = value ? value.split(':') : ['', '']

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Scroll selected hour into view when opened
  useEffect(() => {
    if (open && selH && hourListRef.current) {
      const el = hourListRef.current.querySelector<HTMLElement>(`[data-h="${selH}"]`)
      if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [open, selH])

  function pickHour(h: string) {
    onChange(`${h}:${selM || '00'}`)
  }
  function pickMinute(m: string) {
    onChange(`${selH || '09'}:${m}`)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 bg-[#0d0d0d] border px-3 py-2.5 text-sm transition-colors text-left ${
          open ? 'border-[#d4bfff]/50' : 'border-white/10 hover:border-white/25'
        }`}
      >
        <Clock size={13} className={value ? 'text-[#d4bfff]/60' : 'text-white/20'} />
        <span className={`font-mono ${value ? 'text-white/80' : 'text-white/30'}`}>
          {value ? fmt12(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#111] border border-white/12 shadow-2xl flex" style={{ minWidth: '168px' }}>
          {/* Hours */}
          <div ref={hourListRef} className="border-r border-white/8 overflow-y-auto" style={{ width: '84px', maxHeight: '220px' }}>
            <div className="sticky top-0 bg-[#111] px-3 py-2 text-[9px] font-mono text-white/25 tracking-widest uppercase border-b border-white/6">Hour</div>
            {HOURS.map(h => (
              <button
                key={h}
                type="button"
                data-h={h}
                onClick={() => pickHour(h)}
                className={`w-full text-left px-3 py-2 text-sm font-mono transition-colors ${
                  h === selH ? 'bg-[#d4bfff]/15 text-[#d4bfff]' : 'text-white/50 hover:bg-white/6 hover:text-white/80'
                }`}
              >
                {fmt12(`${h}:00`).replace(':00', '').trim()}
                <span className="text-[10px] text-white/20 ml-1">{h}</span>
              </button>
            ))}
          </div>

          {/* Minutes */}
          <div style={{ width: '84px' }}>
            <div className="px-3 py-2 text-[9px] font-mono text-white/25 tracking-widest uppercase border-b border-white/6">Min</div>
            {MINUTES.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => pickMinute(m)}
                className={`w-full text-left px-3 py-2.5 text-sm font-mono transition-colors ${
                  m === selM ? 'bg-[#d4bfff]/15 text-[#d4bfff]' : 'text-white/50 hover:bg-white/6 hover:text-white/80'
                }`}
              >
                :{m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
