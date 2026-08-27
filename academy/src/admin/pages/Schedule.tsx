import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, UserCheck, AlertCircle, Trash2, Calendar, Repeat } from 'lucide-react'
import {
  fetchAllSessions, fetchSessionRegistrations, createSession,
  rescheduleSession, reassignRegistration, fetchInstructors, cancelSession,
} from '../../lib/db'
import type { Session, Registration, Instructor } from '../../lib/db'
import DatePicker from '../components/DatePicker'
import TimePicker from '../components/TimePicker'

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
    open:        'bg-emerald-500/12 text-emerald-400/80',
    full:        'bg-amber-500/12 text-amber-400/80',
    rescheduled: 'bg-[#d4bfff]/12 text-[#d4bfff]/80',
    cancelled:   'bg-red-500/10 text-red-400/60',
  }
  return (
    <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 ${map[status] ?? 'bg-white/6 text-white/35'}`}>
      {status}
    </span>
  )
}

function RegBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed:  'text-emerald-400/70',
    waitlisted: 'text-amber-400/70',
    cancelled:  'text-red-400/50',
  }
  return (
    <span className={`font-mono text-[8px] tracking-widest uppercase ${map[status] ?? 'text-white/30'}`}>
      {status}
    </span>
  )
}

// ── Shared field styles ───────────────────────────────────────────────────────

const labelCls = 'text-[10px] text-white/30 font-mono tracking-widest uppercase mb-1.5 block'
const inputCls = 'bg-[#0d0d0d] border border-white/10 hover:border-white/20 focus:border-[#d4bfff]/40 text-white/80 text-sm px-3 py-2.5 w-full outline-none transition-colors'

// ── Capacity bar ──────────────────────────────────────────────────────────────

function CapacityBar({ booked, cap }: { booked: number; cap: number }) {
  const pct = Math.min(100, Math.round((booked / cap) * 100))
  const color = pct >= 100 ? 'bg-amber-400/60' : pct >= 75 ? 'bg-[#d4bfff]/60' : 'bg-emerald-400/50'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/8 overflow-hidden">
        <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-white/40 shrink-0">{booked}/{cap}</span>
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
              ? 'bg-[#d4bfff] text-[#050505]'
              : 'bg-[#0d0d0d] border border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
          }`}
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

      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="bg-[#d4bfff] text-[#050505] text-xs font-bold font-mono tracking-widest uppercase px-5 py-2.5 disabled:opacity-50 hover:bg-white transition-colors">
          {saving ? 'Creating…' : 'Create session'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-white/30 hover:text-white/60 px-3 transition-colors">Cancel</button>
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
          session_type: 'masterclass',
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
        <div className="text-2xl font-bold text-[#d4bfff] mb-2">{preview.length}</div>
        <div className="text-sm text-white/50">Sessions created successfully.</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Instructor</label>
          <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className={inputCls}>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Which days</label>
          <DayPicker selected={days} onChange={setDays} />
          {days.length === 0 && <p className="text-[10px] text-white/25 mt-1.5 font-mono">Select one or more days of the week</p>}
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
        <div className="border border-white/8 bg-[#0d0d0d]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6">
            <span className="text-[10px] font-mono text-white/35 tracking-widest uppercase">Preview</span>
            <span className="text-[10px] font-mono text-[#d4bfff]">{preview.length} session{preview.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {preview.slice(0, 30).map((d, i) => (
              <div key={d} className="flex items-center justify-between px-4 py-2 border-b border-white/4 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-white/25 w-5 text-right">{i + 1}</span>
                  <span className="text-sm text-white/70">{fmtDate(d)}</span>
                </div>
                {startTime && endTime && (
                  <span className="font-mono text-[10px] text-white/35">{fmtTime(startTime)} – {fmtTime(endTime)}</span>
                )}
              </div>
            ))}
            {preview.length > 30 && (
              <div className="px-4 py-2 text-[10px] font-mono text-white/25 text-center">
                +{preview.length - 30} more
              </div>
            )}
          </div>
        </div>
      )}

      {preview.length === 0 && days.length > 0 && fromDate && toDate && (
        <p className="text-xs text-white/30 font-mono">No matching dates in that range.</p>
      )}

      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

      {progress && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Creating sessions…</span>
            <span className="font-mono text-xs text-[#d4bfff]">{progress.done} / {progress.total}</span>
          </div>
          <div className="h-1 bg-white/8">
            <div className="h-full bg-[#d4bfff] transition-all" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={preview.length === 0 || creating}
          onClick={handleCreate}
          className="bg-[#d4bfff] text-[#050505] text-xs font-bold font-mono tracking-widest uppercase px-5 py-2.5 disabled:opacity-40 hover:bg-white transition-colors"
        >
          {creating ? `Creating ${progress?.done ?? 0} of ${progress?.total}…` : `Create ${preview.length || 0} session${preview.length !== 1 ? 's' : ''}`}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-white/30 hover:text-white/60 px-3 transition-colors">Cancel</button>
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
      <div className="mb-6 border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-400/80">
        No instructors found. Run the SQL migration first — it seeds Divith automatically.
      </div>
    )
  }

  return (
    <div className="mb-6 bg-[#0f0d18] border border-white/8">
      {/* Tab bar */}
      <div className="flex border-b border-white/8">
        {([['single', 'One-off', Calendar], ['recurring', 'Recurring', Repeat]] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase transition-colors ${
              tab === t
                ? 'border-b-2 border-[#d4bfff] text-[#d4bfff] -mb-px'
                : 'text-white/35 hover:text-white/60'
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
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-[#0a0810] border border-white/8">
      <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase mb-3">New date & time</p>
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
      {error && <p className="mt-2 text-xs text-red-400 font-mono">{error}</p>}
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={saving} className="bg-[#d4bfff] text-[#050505] text-xs font-bold font-mono tracking-widest uppercase px-4 py-2 disabled:opacity-50">
          {saving ? 'Saving…' : 'Confirm reschedule'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-white/30 hover:text-white/60 px-2">Cancel</button>
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
      onRemove() // remove from list immediately — no refetch needed
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
    <div className="border border-white/6 bg-[#0d0d0d]">
      {/* Row header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.015] transition-colors select-none"
        onClick={toggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <span className="text-sm font-semibold text-white/85">{fmtDate(session.session_date)}</span>
            <span className="font-mono text-[10px] text-white/30">{fmtTime(session.start_time.slice(0,5))} – {fmtTime(session.end_time.slice(0,5))}</span>
            <StatusBadge status={session.status} />
            <span className="font-mono text-[9px] text-[#d4bfff]/45 tracking-widest uppercase">{typeBadge}</span>
          </div>
          <div className="flex items-center gap-3">
            <CapacityBar booked={session.seats_booked} cap={session.capacity} />
            <span className="text-[10px] text-white/25 truncate max-w-48">{session.location}</span>
          </div>
        </div>
        <div className="text-white/20 shrink-0 text-xs font-mono">
          {seatsLeft === 0 ? 'full' : `${seatsLeft} left`}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/6 px-5 py-4 space-y-4">

          {/* Actions bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => setShowReschedule(v => !v)}
              className="text-[10px] font-mono tracking-widest uppercase text-white/40 hover:text-[#d4bfff] transition-colors">
              {showReschedule ? 'Cancel' : 'Reschedule'}
            </button>
            {!confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)}
                className="text-[10px] font-mono tracking-widest uppercase text-white/25 hover:text-red-400 transition-colors flex items-center gap-1.5">
                <Trash2 size={10} /> Cancel session
              </button>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-[10px] text-red-400/80 font-mono">Cancel this session?</span>
                <button onClick={handleCancel} disabled={cancelling}
                  className="text-[10px] font-mono font-bold tracking-widest uppercase text-red-400 hover:text-red-300 disabled:opacity-50">
                  {cancelling ? 'Cancelling…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirmCancel(false)} className="text-[10px] font-mono text-white/25 hover:text-white/50">No</button>
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
              <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase">
                Registrations ({regs.length})
              </span>
              <button onClick={loadRegs} className="text-white/20 hover:text-white/50 transition-colors">
                <RefreshCw size={11} className={loadingRegs ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingRegs && <p className="text-xs text-white/25 font-mono">Loading…</p>}
            {!loadingRegs && regs.length === 0 && <p className="text-xs text-white/20 font-mono">No registrations yet.</p>}

            {regs.length > 0 && (
              <div className="space-y-0">
                {regs.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-white/4 last:border-0 flex-wrap">
                    <UserCheck size={12} className="text-white/20 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white/75 font-medium">{r.name}</span>
                      <span className="text-xs text-white/30 ml-2 font-mono">{r.phone}</span>
                    </div>
                    <RegBadge status={r.status} />

                    {/* Reassign */}
                    {others.length > 0 && r.status !== 'cancelled' && (
                      <div className="flex items-center gap-2 ml-auto">
                        <select
                          value={reassignTarget[r.id] ?? ''}
                          onChange={e => setReassignTarget(prev => ({ ...prev, [r.id]: e.target.value }))}
                          className="bg-[#0a0a0a] border border-white/10 text-white/45 text-xs px-2 py-1 outline-none"
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
                            forceIds.has(r.id) ? 'text-amber-400 hover:text-amber-300' : 'text-[#d4bfff]/60 hover:text-[#d4bfff]'
                          }`}
                        >
                          {reassigning === r.id ? '…' : forceIds.has(r.id) ? 'Force move' : 'Move'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {reassignError && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-400/70 font-mono">
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Schedule() {
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

  const counts = {
    total: sessions.length,
    open: sessions.filter(s => s.status === 'open').length,
    full: sessions.filter(s => s.status === 'full').length,
  }

  return (
    <div className="p-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Schedule</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-white/35">{loading ? '…' : `${counts.total} session${counts.total !== 1 ? 's' : ''}`}</span>
            {!loading && counts.total > 0 && (
              <>
                <span className="text-white/12">·</span>
                <span className="font-mono text-[10px] text-emerald-400/60">{counts.open} open</span>
                {counts.full > 0 && <span className="font-mono text-[10px] text-amber-400/60">{counts.full} full</span>}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-white/20 hover:text-white/50 transition-colors p-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 bg-[#d4bfff] text-[#050505] text-xs font-bold font-mono tracking-widest uppercase px-4 py-2.5 hover:bg-white transition-colors"
          >
            <Plus size={13} />
            New session
          </button>
        </div>
      </div>

      {/* Create panel */}
      {showCreate && (
        <CreatePanel
          instructors={instructors}
          defaultLocation={defaultLocation}
          onCreated={() => { setShowCreate(false); load() }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Type filter */}
      <div className="flex gap-0.5 mb-5">
        {(['all', 'masterclass', 'course_class'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`text-[10px] font-mono tracking-widest uppercase px-4 py-2 transition-colors ${
              typeFilter === t ? 'bg-[#d4bfff]/12 text-[#d4bfff]' : 'text-white/30 hover:text-white/55'
            }`}
          >
            {t === 'all' ? 'All' : t === 'masterclass' ? 'Masterclass' : 'Course'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="py-20 text-center">
          <p className="text-white/20 text-sm font-mono">No sessions yet.</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-[#d4bfff]/60 hover:text-[#d4bfff] text-xs font-mono transition-colors">
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
    </div>
  )
}
