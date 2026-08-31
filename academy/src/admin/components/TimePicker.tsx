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
        className={`w-full flex items-center gap-2 bg-[#F9F6FF] px-3 py-2.5 text-sm transition-colors text-left ${
          open ? 'border border-[#9C7CE0]' : 'border border-[#D4C6EF] hover:border-[#9C7CE0]'
        }`}
      >
        <Clock size={13} className={value ? 'text-[#7548B8]' : 'text-[#C4B4E4]'} />
        <span className={`font-mono ${value ? 'text-[#190F30]' : 'text-[#C4B4E4]'}`}>
          {value ? fmt12(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white shadow-lg flex" style={{ minWidth: '168px', border: '1px solid #E3D9F7' }}>
          {/* Hours */}
          <div ref={hourListRef} className="overflow-y-auto" style={{ width: '84px', maxHeight: '220px', borderRight: '1px solid #F0EAFF' }}>
            <div className="sticky top-0 bg-white px-3 py-2 text-[9px] font-mono text-[#C4B4E4] tracking-widest uppercase" style={{ borderBottom: '1px solid #F0EAFF' }}>Hour</div>
            {HOURS.map(h => (
              <button
                key={h}
                type="button"
                data-h={h}
                onClick={() => pickHour(h)}
                className={`w-full text-left px-3 py-2 text-sm font-mono transition-colors ${
                  h === selH ? 'bg-[#EDE6FF] text-[#6B40A8]' : 'text-[#8B73B3] hover:bg-[#F9F6FF] hover:text-[#190F30]'
                }`}
              >
                {fmt12(`${h}:00`).replace(':00', '').trim()}
                <span className="text-[10px] text-[#C4B4E4] ml-1">{h}</span>
              </button>
            ))}
          </div>

          {/* Minutes */}
          <div style={{ width: '84px' }}>
            <div className="px-3 py-2 text-[9px] font-mono text-[#C4B4E4] tracking-widest uppercase" style={{ borderBottom: '1px solid #F0EAFF' }}>Min</div>
            {MINUTES.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => pickMinute(m)}
                className={`w-full text-left px-3 py-2.5 text-sm font-mono transition-colors ${
                  m === selM ? 'bg-[#EDE6FF] text-[#6B40A8]' : 'text-[#8B73B3] hover:bg-[#F9F6FF] hover:text-[#190F30]'
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
