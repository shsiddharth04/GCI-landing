import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, UserCheck, AlertCircle, Trash2, Calendar, Repeat, Lock, Unlock, LayoutGrid, BookOpen } from 'lucide-react'
import {
  fetchAllSessions, fetchSessionRegistrations, createSession,
  rescheduleSession, reassignRegistration, fetchInstructors, cancelSession,
  fetchMasterclassSlotData, upsertSlotOverride, deleteSlotOverride, fetchMasterclassBookings,
  fetchCourseClassBlocks, addCourseClassBlock, deleteCourseClassBlock,
} from '../../lib/db'
import type { Session, Registration, Instructor, SlotOverride, MasterclassBooking, BlockedWindow, CourseClassBlock } from '../../lib/db'
import DatePicker from '../components/DatePicker'
import TimePicker from '../components/TimePicker'
import { loadSettings } from '../settings'

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':')
  const d = new Date(); d.setHours(+h, +m)
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function todayStr() { return new Date().toISOString().slice(0, 10) }

function generateRecurring(from: string, to: string, days: number[]): string[] {
  const out: string[] = []
  if (!from || !to || days.length === 0) return out
  const cur = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (cur <= end) {
    if (days.includes(cur.getDay())) {
      out.push(cur.toISOString().slice(0, 10))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open:        'bg-emerald-50 text-emerald-700',
    full:        'bg-amber-50 text-amber-700',
    rescheduled: 'bg-[#EDE6FF] text-[#6B40A8]',
    cancelled:   'bg-red-50 text-red-600',
  }
  return (
    <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 ${map[status] ?? 'bg-[#F0EAFF] text-[#8B73B3]'}`}>
      {status}
    </span>
  )
}

function RegBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed:  'text-emerald-600',
    waitlisted: 'text-amber-600',
    cancelled:  'text-red-500',
  }
  return (
    <span className={`font-mono text-[8px] tracking-widest uppercase ${map[status] ?? 'text-[#B5A3D4]'}`}>
      {status}
    </span>
  )
}

// ── Shared field styles ───────────────────────────────────────────────────────

const labelCls = 'text-[10px] text-[#8B73B3] font-mono tracking-widest uppercase mb-1.5 block'
const inputCls = 'bg-[#F9F6FF] border border-[#D4C6EF] hover:border-[#9C7CE0] focus:border-[#9C7CE0] text-[#190F30] text-sm px-3 py-2.5 w-full outline-none transition-colors'

// ── Capacity bar ──────────────────────────────────────────────────────────────

function CapacityBar({ booked, cap }: { booked: number; cap: number }) {
  const pct = Math.min(100, Math.round((booked / cap) * 100))
  const color = pct >= 100 ? 'bg-amber-400' : pct >= 75 ? 'bg-[#9C7CE0]' : 'bg-emerald-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[#E3D9F7] overflow-hidden">
        <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-[#B5A3D4] shrink-0">{booked}/{cap}</span>
    </div>
  )
}

// ── Day picker (for recurring) ────────────────────────────────────────────────

const WEEKDAYS = [
  { label: 'Su', value: 0 }, { label: 'Mo', value: 1 }, { label: 'Tu', value: 2 },
  { label: 'We', value: 3 }, { label: 'Th', value: 4 }, { label: 'Fr', value: 5 },
  { label: 'Sa', value: 6 },
]

function DayPicker({ selected, onChange }: { selected: number[]; onChange: (d: number[]) => void }) {
  function toggle(day: number) {
    onChange(selected.includes(day) ? selected.filter(d => d !== day) : [...selected, day])
  }
  return (
    <div className="flex gap-1.5">
      {WEEKDAYS.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          onClick={() => toggle(value)}
          className={`h-9 w-9 text-xs font-mono font-bold transition-colors ${
            selected.includes(value)
              ? 'bg-[#6B40A8] text-white'
              : 'bg-white text-[#8B73B3] hover:text-[#6B40A8] hover:bg-[#EDE6FF]'
          }`}
          style={{ border: selected.includes(value) ? 'none' : '1px solid #D4C6EF' }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Single session form ───────────────────────────────────────────────────────

function SingleForm({
  instructors, defaultLocation,
  onCreated, onCancel,
}: {
  instructors: Instructor[]
  defaultLocation: string
  onCreated: () => void
  onCancel: () => void
}) {
  const [instructorId, setInstructorId] = useState(instructors[0]?.id ?? '')
  const [sessionType, setSessionType] = useState<'masterclass' | 'course_class'>('masterclass')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState(defaultLocation)
  const [capacity, setCapacity] = useState('20')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !startTime || !endTime) { setError('Date and time are required.'); return }
    if (startTime >= endTime) { setError('End time must be after start time.'); return }
    setSaving(true); setError(null)
    try {
      await createSession({
        instructor_id: instructorId,
        session_type: sessionType,
        course_id: null,
        session_date: date,
        start_time: startTime,
        end_time: endTime,
        location,
        capacity: Math.max(1, parseInt(capacity, 10) || 20),
      })
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create session.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select value={sessionType} onChange={e => setSessionType(e.target.value as typeof sessionType)} className={inputCls}>
            <option value="masterclass">Masterclass</option>
            <option value="course_class">Course class</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Instructor</label>
          <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className={inputCls}>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <DatePicker value={date} onChange={setDate} minDate={todayStr()} placeholder="Pick a date" />
        </div>
        <div>
          <label className={labelCls}>Capacity</label>
          <input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Start time</label>
          <TimePicker value={startTime} onChange={setStartTime} placeholder="Start" />
        </div>
        <div>
          <label className={labelCls}>End time</label>
          <TimePicker value={endTime} onChange={setEndTime} placeholder="End" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Location</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="Studio address" />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-5 py-2.5 disabled:opacity-50 transition-colors">
          {saving ? 'Creating…' : 'Create session'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-[#8B73B3] hover:text-[#6B40A8] px-3 transition-colors">Cancel</button>
      </div>
    </form>
  )
}

// ── Recurring sessions form ───────────────────────────────────────────────────

function RecurringForm({
  instructors, defaultLocation,
  onCreated, onCancel,
}: {
  instructors: Instructor[]
  defaultLocation: string
  onCreated: () => void
  onCancel: () => void
}) {
  const [instructorId, setInstructorId] = useState(instructors[0]?.id ?? '')
  const [sessionType, setSessionType] = useState<'masterclass' | 'course_class'>('masterclass')
  const [days, setDays] = useState<number[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState(defaultLocation)
  const [capacity, setCapacity] = useState('20')
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const preview = generateRecurring(fromDate, toDate, days)

  async function handleCreate() {
    if (preview.length === 0) return
    if (!startTime || !endTime) { setError('Start and end time are required.'); return }
    if (startTime >= endTime) { setError('End time must be after start time.'); return }
    setCreating(true); setError(null)
    setProgress({ done: 0, total: preview.length })

    let succeeded = 0
    for (const date of preview) {
      try {
        await createSession({
          instructor_id: instructorId,
          session_type: sessionType,
          course_id: null,
          session_date: date,
          start_time: startTime,
          end_time: endTime,
          location,
          capacity: Math.max(1, parseInt(capacity, 10) || 20),
        })
        succeeded++
        setProgress({ done: succeeded, total: preview.length })
      } catch {
        // continue — skip failed dates
      }
    }
    setCreating(false)
    setProgress(null)
    if (succeeded > 0) { setDone(true); setTimeout(onCreated, 1200) }
    else setError('All session creates failed. Check your Supabase RLS policies.')
  }

  if (done) {
    return (
      <div className="py-8 text-center">
        <div className="text-2xl font-bold text-[#6B40A8] mb-2">{preview.length}</div>
        <div className="text-sm text-[#8B73B3]">Sessions created successfully.</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select value={sessionType} onChange={e => setSessionType(e.target.value as typeof sessionType)} className={inputCls}>
            <option value="masterclass">Masterclass</option>
            <option value="course_class">Course class</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Instructor</label>
          <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className={inputCls}>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Which days</label>
          <DayPicker selected={days} onChange={setDays} />
          {days.length === 0 && <p className="text-[10px] text-[#C4B4E4] mt-1.5 font-mono">Select one or more days of the week</p>}
        </div>
        <div>
          <label className={labelCls}>From date</label>
          <DatePicker value={fromDate} onChange={setFromDate} minDate={todayStr()} placeholder="Start of range" />
        </div>
        <div>
          <label className={labelCls}>To date</label>
          <DatePicker value={toDate} onChange={d => { if (!fromDate || d >= fromDate) setToDate(d) }} minDate={fromDate || todayStr()} placeholder="End of range" />
        </div>
        <div>
          <label className={labelCls}>Start time</label>
          <TimePicker value={startTime} onChange={setStartTime} placeholder="Start" />
        </div>
        <div>
          <label className={labelCls}>End time</label>
          <TimePicker value={endTime} onChange={setEndTime} placeholder="End" />
        </div>
        <div>
          <label className={labelCls}>Capacity per session</label>
          <input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Location</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="Studio address" />
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-[#F9F6FF]" style={{ border: '1px solid #E3D9F7' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #E3D9F7' }}>
            <span className="text-[10px] font-mono text-[#B5A3D4] tracking-widest uppercase">Preview</span>
            <span className="text-[10px] font-mono text-[#7548B8]">{preview.length} session{preview.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {preview.slice(0, 30).map((d, i) => (
              <div key={d} className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #F0EAFF' }}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-[#C4B4E4] w-5 text-right">{i + 1}</span>
                  <span className="text-sm text-[#190F30]">{fmtDate(d)}</span>
                </div>
                {startTime && endTime && (
                  <span className="font-mono text-[10px] text-[#B5A3D4]">{fmtTime(startTime)} – {fmtTime(endTime)}</span>
                )}
              </div>
            ))}
            {preview.length > 30 && (
              <div className="px-4 py-2 text-[10px] font-mono text-[#C4B4E4] text-center">
                +{preview.length - 30} more
              </div>
            )}
          </div>
        </div>
      )}

      {preview.length === 0 && days.length > 0 && fromDate && toDate && (
        <p className="text-xs text-[#B5A3D4] font-mono">No matching dates in that range.</p>
      )}

      {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

      {progress && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B73B3]">Creating sessions…</span>
            <span className="font-mono text-xs text-[#7548B8]">{progress.done} / {progress.total}</span>
          </div>
          <div className="h-1 bg-[#E3D9F7]">
            <div className="h-full bg-[#6B40A8] transition-all" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={preview.length === 0 || creating}
          onClick={handleCreate}
          className="bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-5 py-2.5 disabled:opacity-40 transition-colors"
        >
          {creating ? `Creating ${progress?.done ?? 0} of ${progress?.total}…` : `Create ${preview.length || 0} session${preview.length !== 1 ? 's' : ''}`}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-[#8B73B3] hover:text-[#6B40A8] px-3 transition-colors">Cancel</button>
      </div>
    </div>
  )
}

// ── Create panel (tabs) ───────────────────────────────────────────────────────

function CreatePanel({
  instructors,
  defaultLocation,
  onCreated,
  onClose,
}: {
  instructors: Instructor[]
  defaultLocation: string
  onCreated: () => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'single' | 'recurring'>('single')

  if (instructors.length === 0) {
    return (
      <div className="mb-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        No instructors found. Run the SQL migration first — it seeds Divith automatically.
      </div>
    )
  }

  return (
    <div className="mb-6 bg-white" style={{ border: '1px solid #E3D9F7' }}>
      {/* Tab bar */}
      <div className="flex" style={{ borderBottom: '1px solid #E3D9F7' }}>
        {([['single', 'One-off', Calendar], ['recurring', 'Recurring', Repeat]] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase transition-colors ${
              tab === t
                ? 'border-b-2 border-[#6B40A8] text-[#6B40A8] -mb-px'
                : 'text-[#B5A3D4] hover:text-[#7548B8]'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'single' ? (
          <SingleForm instructors={instructors} defaultLocation={defaultLocation} onCreated={onCreated} onCancel={onClose} />
        ) : (
          <RecurringForm instructors={instructors} defaultLocation={defaultLocation} onCreated={onCreated} onCancel={onClose} />
        )}
      </div>
    </div>
  )
}

// ── Reschedule inline form ────────────────────────────────────────────────────

function RescheduleForm({ session, onDone, onCancel }: { session: Session; onDone: () => void; onCancel: () => void }) {
  const [date, setDate] = useState(session.session_date)
  const [startTime, setStartTime] = useState(session.start_time.slice(0, 5))
  const [endTime, setEndTime] = useState(session.end_time.slice(0, 5))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (startTime >= endTime) { setError('End must be after start.'); return }
    setSaving(true); setError(null)
    try {
      await rescheduleSession(session.id, date, startTime, endTime)
      onDone()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-[#F9F6FF]" style={{ border: '1px solid #E3D9F7' }}>
      <p className="text-[10px] font-mono text-[#B5A3D4] tracking-widest uppercase mb-3">New date & time</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Date</label>
          <DatePicker value={date} onChange={setDate} />
        </div>
        <div>
          <label className={labelCls}>Start</label>
          <TimePicker value={startTime} onChange={setStartTime} />
        </div>
        <div>
          <label className={labelCls}>End</label>
          <TimePicker value={endTime} onChange={setEndTime} />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500 font-mono">{error}</p>}
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={saving} className="bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-4 py-2 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Confirm reschedule'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-[#8B73B3] hover:text-[#6B40A8] px-2 transition-colors">Cancel</button>
      </div>
    </form>
  )
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({ session, allSessions, onRefresh, onRemove }: { session: Session; allSessions: Session[]; onRefresh: () => void; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [regs, setRegs] = useState<Registration[]>([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [reassignTarget, setReassignTarget] = useState<Record<string, string>>({})
  const [reassigning, setReassigning] = useState<string | null>(null)
  const [forceIds, setForceIds] = useState<Set<string>>(new Set())
  const [reassignError, setReassignError] = useState<string | null>(null)

  async function loadRegs() {
    setLoadingRegs(true)
    try { setRegs(await fetchSessionRegistrations(session.id)) }
    catch { /* silent */ }
    finally { setLoadingRegs(false) }
  }

  function toggle() {
    if (!expanded) loadRegs()
    setExpanded(v => !v)
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      await cancelSession(session.id)
      onRemove()
    } catch {
      setCancelling(false)
      setConfirmCancel(false)
    }
  }

  async function handleReassign(regId: string, force = false) {
    const target = reassignTarget[regId]
    if (!target) return
    setReassigning(regId); setReassignError(null)
    try {
      const result = await reassignRegistration(regId, target, force)
      if (!result.success) {
        setReassignError(`${result.reason ?? 'failed'}`)
        setForceIds(s => new Set([...s, regId]))
      } else {
        setForceIds(s => { const n = new Set(s); n.delete(regId); return n })
        await loadRegs(); onRefresh()
      }
    } catch (e: unknown) {
      setReassignError(e instanceof Error ? e.message : 'Reassignment failed.')
    } finally {
      setReassigning(null)
    }
  }

  const seatsLeft = Math.max(0, session.capacity - session.seats_booked)
  const others = allSessions.filter(s => s.id !== session.id && s.session_type === session.session_type)
  const typeBadge = session.session_type === 'masterclass' ? 'Masterclass' : 'Course'

  return (
    <div className="bg-white" style={{ border: '1px solid #E3D9F7' }}>
      {/* Row header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F9F6FF] transition-colors select-none"
        onClick={toggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <span className="text-sm font-semibold text-[#190F30]">{fmtDate(session.session_date)}</span>
            <span className="font-mono text-[10px] text-[#B5A3D4]">{fmtTime(session.start_time.slice(0,5))} – {fmtTime(session.end_time.slice(0,5))}</span>
            <StatusBadge status={session.status} />
            <span className="font-mono text-[9px] text-[#9C7CE0] tracking-widest uppercase">{typeBadge}</span>
          </div>
          <div className="flex items-center gap-3">
            <CapacityBar booked={session.seats_booked} cap={session.capacity} />
            <span className="text-[10px] text-[#C4B4E4] truncate max-w-48">{session.location}</span>
          </div>
        </div>
        <div className="text-[#C4B4E4] shrink-0 text-xs font-mono">
          {seatsLeft === 0 ? 'full' : `${seatsLeft} left`}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 py-4 space-y-4" style={{ borderTop: '1px solid #F0EAFF' }}>

          {/* Actions bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => setShowReschedule(v => !v)}
              className="text-[10px] font-mono tracking-widest uppercase text-[#8B73B3] hover:text-[#6B40A8] transition-colors">
              {showReschedule ? 'Cancel' : 'Reschedule'}
            </button>
            {!confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)}
                className="text-[10px] font-mono tracking-widest uppercase text-[#C4B4E4] hover:text-red-500 transition-colors flex items-center gap-1.5">
                <Trash2 size={10} /> Cancel session
              </button>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-[10px] text-red-500 font-mono">Cancel this session?</span>
                <button onClick={handleCancel} disabled={cancelling}
                  className="text-[10px] font-mono font-bold tracking-widest uppercase text-red-500 hover:text-red-700 disabled:opacity-50">
                  {cancelling ? 'Cancelling…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirmCancel(false)} className="text-[10px] font-mono text-[#C4B4E4] hover:text-[#8B73B3]">No</button>
              </span>
            )}
          </div>

          {showReschedule && (
            <RescheduleForm
              session={session}
              onDone={() => { setShowReschedule(false); onRefresh() }}
              onCancel={() => setShowReschedule(false)}
            />
          )}

          {/* Registrations */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-mono text-[#B5A3D4] tracking-widest uppercase">
                Registrations ({regs.length})
              </span>
              <button onClick={loadRegs} className="text-[#C4B4E4] hover:text-[#7548B8] transition-colors">
                <RefreshCw size={11} className={loadingRegs ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingRegs && <p className="text-xs text-[#B5A3D4] font-mono">Loading…</p>}
            {!loadingRegs && regs.length === 0 && <p className="text-xs text-[#C4B4E4] font-mono">No registrations yet.</p>}

            {regs.length > 0 && (
              <div className="space-y-0">
                {regs.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 flex-wrap" style={{ borderBottom: '1px solid #F0EAFF' }}>
                    <UserCheck size={12} className="text-[#C4B4E4] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[#190F30] font-medium">{r.name}</span>
                      <span className="text-xs text-[#B5A3D4] ml-2 font-mono">{r.phone}</span>
                    </div>
                    <RegBadge status={r.status} />

                    {/* Reassign */}
                    {others.length > 0 && r.status !== 'cancelled' && (
                      <div className="flex items-center gap-2 ml-auto">
                        <select
                          value={reassignTarget[r.id] ?? ''}
                          onChange={e => setReassignTarget(prev => ({ ...prev, [r.id]: e.target.value }))}
                          className="bg-[#F9F6FF] border border-[#D4C6EF] text-[#190F30] text-xs px-2 py-1 outline-none"
                        >
                          <option value="">Move to…</option>
                          {others.map(s => (
                            <option key={s.id} value={s.id}>
                              {fmtDate(s.session_date)} ({s.status})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleReassign(r.id, forceIds.has(r.id))}
                          disabled={!reassignTarget[r.id] || reassigning === r.id}
                          className={`text-[10px] font-mono tracking-widest uppercase disabled:opacity-30 transition-colors ${
                            forceIds.has(r.id) ? 'text-amber-600 hover:text-amber-700' : 'text-[#7548B8] hover:text-[#6B40A8]'
                          }`}
                        >
                          {reassigning === r.id ? '…' : forceIds.has(r.id) ? 'Force move' : 'Move'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {reassignError && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 font-mono">
                    <AlertCircle size={11} />
                    {reassignError} — click "Force move" to override capacity
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Masterclass Slots panel ───────────────────────────────────────────────────

function toMinutes(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function fromMinutes(m: number) { return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }

function genSlots(open: string, close: string, mins: number) {
  const slots: { start: string; end: string }[] = []
  let cur = toMinutes(open); const end = toMinutes(close)
  while (cur + mins <= end) { slots.push({ start: fromMinutes(cur), end: fromMinutes(cur + mins) }); cur += mins }
  return slots
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function MasterclassSlotsPanel() {
  const { masterclass } = loadSettings()
  const open  = masterclass.scheduleOpenTime  ?? '10:00'
  const close = masterclass.scheduleCloseTime ?? '22:00'
  const mins  = masterclass.slotMinutes       ?? 30
  const cap   = masterclass.slotCapacity      ?? 3

  const todayStr = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(todayStr)
  const [counts, setCounts]     = useState<Record<string, number>>({})
  const [blocked, setBlocked]   = useState<BlockedWindow[]>([])
  const [overrides, setOverrides] = useState<SlotOverride[]>([])
  const [bookings, setBookings] = useState<MasterclassBooking[]>([])
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const slots = genSlots(open, close, mins)

  async function load(d: string) {
    setLoading(true)
    try {
      const [slotData, bks] = await Promise.all([
        fetchMasterclassSlotData(d, d),
        fetchMasterclassBookings(d),
      ])
      setCounts(slotData.counts)
      setBlocked(slotData.blocked.filter(b => b.session_date === d))
      setOverrides(slotData.overrides)
      setBookings(bks.filter(b => b.slot_date === d))
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { load(date) }, [date])

  function getOverride(start: string) { return overrides.find(o => o.slot_date === date && o.slot_start.slice(0, 5) === start) }
  function getClassBlock(start: string, end: string) {
    return blocked.find(b => b.start_time.slice(0, 5) < end && b.end_time.slice(0, 5) > start)
  }

  function slotState(s: { start: string; end: string }) {
    const ov = getOverride(s.start)
    if (ov?.override === 'blocked') return 'manually-blocked'
    if (!ov) {
      const w = getClassBlock(s.start, s.end)
      if (w) return w.cohort === 'C1' ? 'class-c1' : w.cohort === 'C2' ? 'class-c2' : 'class-blocked'
    }
    if (ov?.override === 'open') return 'forced-open'
    return 'available'
  }

  async function blockSlot(s: { start: string; end: string }, reason?: string) {
    setSaving(s.start)
    try { await upsertSlotOverride(date, s.start, s.end, 'blocked', reason); await load(date) }
    catch { /* silent */ } finally { setSaving(null) }
  }

  async function unblockSlot(s: { start: string; end: string }) {
    setSaving(s.start)
    const ov = getOverride(s.start)
    try {
      if (ov) await deleteSlotOverride(ov.id)
      await load(date)
    } catch { /* silent */ } finally { setSaving(null) }
  }

  async function forceOpenSlot(s: { start: string; end: string }) {
    setSaving(s.start)
    try { await upsertSlotOverride(date, s.start, s.end, 'open'); await load(date) }
    catch { /* silent */ } finally { setSaving(null) }
  }

  function slotBookings(start: string) { return bookings.filter(b => b.slot_start_time.slice(0, 5) === start) }

  return (
    <div>
      {/* Date nav */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10)) }}
          className="w-8 h-8 flex items-center justify-center text-[#8B73B3] hover:text-[#6B40A8] hover:bg-[#EDE6FF] transition-colors text-sm bg-white"
          style={{ border: '1px solid #D4C6EF' }}>‹</button>
        <div className="w-48">
          <DatePicker value={date} onChange={setDate} placeholder="Pick date" />
        </div>
        <button onClick={() => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + 1); setDate(d.toISOString().slice(0, 10)) }}
          className="w-8 h-8 flex items-center justify-center text-[#8B73B3] hover:text-[#6B40A8] hover:bg-[#EDE6FF] transition-colors text-sm bg-white"
          style={{ border: '1px solid #D4C6EF' }}>›</button>
        <button onClick={() => load(date)} className="text-[#C4B4E4] hover:text-[#7548B8] transition-colors ml-1">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="text-[10px] font-mono text-[#C4B4E4] ml-auto">{open} – {close} · {mins} min slots · cap {cap}</span>
      </div>

      {/* Slot grid */}
      <div className="flex flex-col gap-1">
        {slots.map(s => {
          const state = slotState(s)
          const bks = slotBookings(s.start)
          const booked = counts[`${date}|${s.start}`] ?? 0
          const isExp = expanded === s.start
          const isSaving = saving === s.start

          const stateStyle: Record<string, { border: string; background: string }> = {
            'available':        { border: '1px solid #E3D9F7', background: 'white' },
            'manually-blocked': { border: '1px solid #fca5a5', background: '#fef2f2' },
            'class-blocked':    { border: '1px solid #fcd34d', background: '#fffbeb' },
            'class-c1':         { border: '1px solid #fbbf24', background: '#fffbeb' },
            'class-c2':         { border: '1px solid #2dd4bf', background: '#f0fdfa' },
            'forced-open':      { border: '1px solid #6ee7b7', background: '#f0fdf4' },
          }
          const ss = stateStyle[state] ?? stateStyle['available']

          return (
            <div key={s.start} className="transition-colors" style={ss}>
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Time */}
                <div className="w-28 shrink-0">
                  <span className="font-mono text-sm text-[#190F30]">{fmt12(s.start)}</span>
                  <span className="font-mono text-[9px] text-[#C4B4E4] ml-1.5">–{fmt12(s.end)}</span>
                </div>

                {/* Booking count */}
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: cap }).map((_, i) => (
                      <div key={i} className={`w-2 h-2 ${i < booked ? 'bg-[#6B40A8]' : 'bg-[#E3D9F7]'}`} />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] text-[#B5A3D4]">{booked}/{cap}</span>
                </div>

                {/* State badge */}
                <div className="flex-1">
                  {state === 'manually-blocked' && (
                    <span className="font-mono text-[8px] text-red-500 tracking-widest uppercase">Blocked</span>
                  )}
                  {state === 'class-blocked' && (
                    <span className="font-mono text-[8px] text-amber-600 tracking-widest uppercase">Course class</span>
                  )}
                  {state === 'class-c1' && (
                    <span className="font-mono text-[8px] text-amber-700 tracking-widest uppercase">Cohort 1 · Class</span>
                  )}
                  {state === 'class-c2' && (
                    <span className="font-mono text-[8px] text-teal-600 tracking-widest uppercase">Cohort 2 · Class</span>
                  )}
                  {state === 'forced-open' && (
                    <span className="font-mono text-[8px] text-emerald-600 tracking-widest uppercase">Force-open</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {bks.length > 0 && (
                    <button onClick={() => setExpanded(isExp ? null : s.start)}
                      className="font-mono text-[9px] text-[#7548B8] hover:text-[#6B40A8] tracking-widest uppercase transition-colors">
                      {bks.length} booked {isExp ? '▲' : '▼'}
                    </button>
                  )}

                  {(state === 'available' || state === 'forced-open') && (
                    <button
                      onClick={() => blockSlot(s)}
                      disabled={isSaving}
                      className="flex items-center gap-1 font-mono text-[9px] text-[#C4B4E4] hover:text-red-500 tracking-widest uppercase transition-colors disabled:opacity-40"
                    >
                      <Lock size={9} />
                      {isSaving ? '…' : 'Block'}
                    </button>
                  )}

                  {state === 'manually-blocked' && (
                    <button
                      onClick={() => unblockSlot(s)}
                      disabled={isSaving}
                      className="flex items-center gap-1 font-mono text-[9px] text-[#C4B4E4] hover:text-emerald-600 tracking-widest uppercase transition-colors disabled:opacity-40"
                    >
                      <Unlock size={9} />
                      {isSaving ? '…' : 'Unblock'}
                    </button>
                  )}

                  {(state === 'class-blocked' || state === 'class-c1' || state === 'class-c2') && (
                    <button
                      onClick={() => forceOpenSlot(s)}
                      disabled={isSaving}
                      className="flex items-center gap-1 font-mono text-[9px] text-[#C4B4E4] hover:text-[#7548B8] tracking-widest uppercase transition-colors disabled:opacity-40"
                    >
                      <Unlock size={9} />
                      {isSaving ? '…' : 'Force open'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded bookings */}
              {isExp && bks.length > 0 && (
                <div className="px-4 py-3 space-y-2" style={{ borderTop: '1px solid #F0EAFF' }}>
                  {bks.map(b => (
                    <div key={b.id} className="flex items-center gap-3 text-sm">
                      <UserCheck size={11} className="text-[#C4B4E4] shrink-0" />
                      <span className="text-[#190F30] font-medium">{b.name}</span>
                      <span className="font-mono text-[10px] text-[#B5A3D4]">{b.phone}</span>
                      <span className="font-mono text-[10px] text-[#C4B4E4]">{b.email}</span>
                      <span className={`font-mono text-[8px] tracking-widest uppercase ml-auto ${b.status === 'confirmed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Course blocks panel (C1/C2 FOMO slot blocking) ───────────────────────────

function CourseBlocksPanel() {
  const today = new Date().toISOString().slice(0, 10)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const [selectedDate, setSelectedDate] = useState(today)
  const [blocks, setBlocks] = useState<CourseClassBlock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [cohort, setCohort] = useState<'C1' | 'C2'>('C1')
  const [blockLabel, setBlockLabel] = useState('')
  const [adding, setAdding] = useState(false)

  async function loadBlocks() {
    setLoading(true); setError(null)
    try { setBlocks(await fetchCourseClassBlocks(days[0], days[days.length - 1])) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load blocks.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadBlocks() }, [])

  async function handleAdd() {
    if (!startTime || !endTime) { setError('Select start and end times.'); return }
    if (startTime >= endTime) { setError('End must be after start.'); return }
    setAdding(true); setError(null)
    try {
      await addCourseClassBlock(selectedDate, startTime, endTime, cohort, blockLabel || undefined)
      await loadBlocks()
      setStartTime(''); setEndTime(''); setBlockLabel('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add block.')
    } finally { setAdding(false) }
  }

  async function handleDelete(id: string) {
    try { await deleteCourseClassBlock(id); setBlocks(prev => prev.filter(b => b.id !== id)) }
    catch { setError('Failed to delete block.') }
  }

  const dayBlocks = blocks.filter(b => b.block_date === selectedDate)

  return (
    <div>
      <p className="text-xs text-[#8B73B3] mb-5">
        Block masterclass slots for course class times. Blocked slots show as <strong>Cohort 1 · class</strong> or <strong>Cohort 2 · class</strong> on the booking page — students see the studio is active.
      </p>

      {/* Day selector — next 7 days */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {days.map(d => {
          const isActive = d === selectedDate
          const hasBlocks = blocks.some(b => b.block_date === d)
          const dateObj = new Date(d + 'T00:00:00')
          const dayLabel = d === today
            ? 'Today'
            : dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`relative px-3 py-2 text-xs font-mono transition-colors ${
                isActive ? 'bg-[#6B40A8] text-white' : 'bg-white text-[#8B73B3] hover:text-[#6B40A8]'
              }`}
              style={{ border: isActive ? 'none' : '1px solid #D4C6EF' }}
            >
              {dayLabel}
              {hasBlocks && !isActive && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          )
        })}
      </div>

      {/* Existing blocks for selected day */}
      {loading && <p className="text-xs text-[#C4B4E4] font-mono mb-4">Loading…</p>}

      {dayBlocks.length > 0 && (
        <div className="mb-5 space-y-1.5">
          {dayBlocks.map(b => (
            <div key={b.id} className="flex items-center gap-3 bg-white px-4 py-3" style={{ border: '1px solid #E3D9F7' }}>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                b.cohort === 'C1'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-teal-50 text-teal-700 border-teal-200'
              }`}>{b.cohort}</span>
              <span className="font-mono text-sm text-[#190F30]">
                {fmt12(b.start_time.slice(0, 5))} – {fmt12(b.end_time.slice(0, 5))}
              </span>
              {b.label && <span className="text-xs text-[#8B73B3] flex-1 truncate">{b.label}</span>}
              <button
                onClick={() => handleDelete(b.id)}
                className="ml-auto text-[#C4B4E4] hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {dayBlocks.length === 0 && !loading && (
        <p className="text-xs text-[#C4B4E4] mb-5 font-mono">No class blocks on this day.</p>
      )}

      {/* Add form */}
      <div className="bg-white p-5 space-y-4" style={{ border: '1px solid #E3D9F7' }}>
        <p className="text-[10px] font-mono text-[#B5A3D4] uppercase tracking-widest">Add class block</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start time</label>
            <TimePicker value={startTime} onChange={setStartTime} placeholder="Start" />
          </div>
          <div>
            <label className={labelCls}>End time</label>
            <TimePicker value={endTime} onChange={setEndTime} placeholder="End" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Cohort</label>
          <div className="flex gap-2">
            {(['C1', 'C2'] as const).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCohort(c)}
                className={`px-5 py-2 text-xs font-mono font-bold transition-colors ${
                  cohort === c
                    ? c === 'C1' ? 'bg-amber-500 text-white' : 'bg-teal-500 text-white'
                    : 'bg-white text-[#8B73B3] hover:text-[#6B40A8]'
                }`}
                style={{ border: cohort === c ? 'none' : '1px solid #D4C6EF' }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>
            Label <span className="normal-case text-[#C4B4E4] ml-1">(optional — e.g. "Module 3 · Rekordbox")</span>
          </label>
          <input
            className={inputCls}
            placeholder="Module 3 · Rekordbox"
            value={blockLabel}
            onChange={e => setBlockLabel(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-5 py-2.5 disabled:opacity-50 transition-colors"
        >
          {adding ? 'Adding…' : 'Add block'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Schedule() {
  const [tab, setTab] = useState<'sessions' | 'slots' | 'blocks'>('slots')
  const [sessions, setSessions] = useState<Session[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'masterclass' | 'course_class'>('all')

  const defaultLocation = '11th Floor, Capital Tower, Sector 20, Gurugram'

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [s, i] = await Promise.all([fetchAllSessions(), fetchInstructors()])
      setSessions(s); setInstructors(i)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = typeFilter === 'all' ? sessions : sessions.filter(s => s.session_type === typeFilter)

  return (
    <div className="p-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-xl font-semibold text-[#190F30]">Schedule</h1>
        {tab === 'sessions' && (
          <div className="flex items-center gap-3">
            <button onClick={load} className="text-[#C4B4E4] hover:text-[#7548B8] transition-colors p-1">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowCreate(v => !v)}
              className="flex items-center gap-2 bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-4 py-2.5 transition-colors"
            >
              <Plus size={13} />
              New session
            </button>
          </div>
        )}
      </div>

      {/* Top tabs */}
      <div className="flex mb-6" style={{ borderBottom: '1px solid #E3D9F7' }}>
        {([
          ['slots',    'Masterclass slots', LayoutGrid],
          ['blocks',   'Course blocks',     BookOpen],
          ['sessions', 'Course sessions',   Calendar],
        ] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase transition-colors -mb-px ${
              tab === t
                ? 'border-b-2 border-[#6B40A8] text-[#6B40A8]'
                : 'text-[#B5A3D4] hover:text-[#7548B8]'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Masterclass slots tab */}
      {tab === 'slots' && <MasterclassSlotsPanel />}

      {/* Course blocks tab */}
      {tab === 'blocks' && <CourseBlocksPanel />}

      {/* Course sessions tab */}
      {tab === 'sessions' && (
        <>
          {showCreate && (
            <CreatePanel
              instructors={instructors}
              defaultLocation={defaultLocation}
              onCreated={() => { setShowCreate(false); load() }}
              onClose={() => setShowCreate(false)}
            />
          )}

          <div className="flex gap-0.5 mb-5">
            {(['all', 'masterclass', 'course_class'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-[10px] font-mono tracking-widest uppercase px-4 py-2 transition-colors rounded ${
                  typeFilter === t ? 'bg-[#EDE6FF] text-[#6B40A8]' : 'text-[#B5A3D4] hover:text-[#7548B8]'
                }`}
              >
                {t === 'all' ? 'All' : t === 'masterclass' ? 'Masterclass' : 'Course'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {!loading && filtered.length === 0 && !error && (
            <div className="py-20 text-center">
              <p className="text-[#C4B4E4] text-sm font-mono">No sessions yet.</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-[#7548B8] hover:text-[#6B40A8] text-xs font-mono transition-colors">
                + Create your first session
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {filtered.map(s => (
              <SessionRow
                key={s.id}
                session={s}
                allSessions={sessions}
                onRefresh={load}
                onRemove={() => setSessions(prev => prev.filter(x => x.id !== s.id))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
