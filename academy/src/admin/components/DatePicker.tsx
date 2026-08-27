import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface Props {
  value: string // YYYY-MM-DD
  onChange: (v: string) => void
  placeholder?: string
  minDate?: string
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default function DatePicker({ value, onChange, placeholder = 'Pick a date', minDate }: Props) {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const min = minDate ?? ''

  const initView = () => {
    const d = value ? new Date(value + 'T00:00:00') : today
    return { year: d.getFullYear(), month: d.getMonth() }
  }

  const [open, setOpen] = useState(false)
  const [view, setView] = useState(initView)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Sync view to value when it changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      setView({ year: d.getFullYear(), month: d.getMonth() })
    }
  }, [value])

  function prevMonth() {
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  }
  function nextMonth() {
    setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })
  }

  function selectDay(day: number) {
    const d = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(d)
    setOpen(false)
  }

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const firstDay = new Date(view.year, view.month, 1).getDay()

  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 bg-[#0d0d0d] border px-3 py-2.5 text-sm transition-colors text-left ${
          open ? 'border-[#d4bfff]/50' : 'border-white/10 hover:border-white/25'
        }`}
      >
        <CalendarDays size={13} className={value ? 'text-[#d4bfff]/60' : 'text-white/20'} />
        <span className={value ? 'text-white/80' : 'text-white/30'}>{display || placeholder}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#111] border border-white/12 shadow-2xl" style={{ minWidth: '252px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-mono font-medium text-white/70 tracking-widest uppercase">
              {MONTHS[view.month]} {view.year}
            </span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 px-2 pb-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[9px] font-mono text-white/22 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`gap-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = dateStr === value
              const isToday = dateStr === todayStr
              const isPast = min && dateStr < min

              return (
                <button
                  key={day}
                  type="button"
                  disabled={!!isPast}
                  onClick={() => selectDay(day)}
                  className={`h-8 w-full text-xs transition-colors font-mono ${
                    isSelected
                      ? 'bg-[#d4bfff] text-[#050505] font-bold'
                      : isToday
                        ? 'ring-1 ring-[#d4bfff]/50 text-[#d4bfff]'
                        : isPast
                          ? 'text-white/15 cursor-not-allowed'
                          : 'text-white/55 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
