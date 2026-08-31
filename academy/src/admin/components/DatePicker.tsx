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
        className={`w-full flex items-center gap-2 bg-[#F9F6FF] px-3 py-2.5 text-sm transition-colors text-left ${
          open ? 'border border-[#9C7CE0]' : 'border border-[#D4C6EF] hover:border-[#9C7CE0]'
        }`}
      >
        <CalendarDays size={13} className={value ? 'text-[#7548B8]' : 'text-[#C4B4E4]'} />
        <span className={value ? 'text-[#190F30]' : 'text-[#C4B4E4]'}>{display || placeholder}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white shadow-lg" style={{ minWidth: '252px', border: '1px solid #E3D9F7' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center text-[#8B73B3] hover:text-[#6B40A8] hover:bg-[#EDE6FF] transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-mono font-medium text-[#190F30] tracking-widest uppercase">
              {MONTHS[view.month]} {view.year}
            </span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center text-[#8B73B3] hover:text-[#6B40A8] hover:bg-[#EDE6FF] transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 px-2 pb-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[9px] font-mono text-[#C4B4E4] py-1">{d}</div>
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
                      ? 'bg-[#6B40A8] text-white font-bold'
                      : isToday
                        ? 'ring-1 ring-[#9C7CE0] text-[#6B40A8]'
                        : isPast
                          ? 'text-[#D4C6EF] cursor-not-allowed'
                          : 'text-[#3D2570] hover:bg-[#EDE6FF]'
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
