import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight, RefreshCw, UserCheck, AlertCircle } from 'lucide-react'
import {
  fetchAllSessions,
  fetchSessionRegistrations,
  createSession,
  rescheduleSession,
  reassignRegistration,
  fetchInstructors,
} from '../../lib/db'
import type { Session, Registration, Instructor } from '../../lib/db'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    open:        { bg: 'rgba(100,210,130,0.12)', color: 'rgba(100,210,130,0.8)' },
    full:        { bg: 'rgba(255,180,60,0.12)',  color: 'rgba(255,180,60,0.8)' },
    rescheduled: { bg: 'rgba(212,191,255,0.12)', color: 'rgba(212,191,255,0.8)' },
    cancelled:   { bg: 'rgba(255,80,80,0.12)',   color: 'rgba(255,80,80,0.7)' },
  }
  const s = map[status] ?? { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: '9px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase' as const,
      padding: '3px 8px',
      background: s.bg,
      color: s.color,
    }}>
      {status}
    </span>
  )
}

function regBadge(status: string) {
  const map: Record<string, string> = {
    confirmed:  'rgba(100,210,130,0.7)',
    waitlisted: 'rgba(255,180,60,0.7)',
    cancelled:  'rgba(255,80,80,0.5)',
  }
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: '8px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      color: map[status] ?? 'rgba(255,255,255,0.3)',
    }}>
      {status}
    </span>
  )
}

// ── Create session form ───────────────────────────────────────────────────────

function CreateSessionForm({
  instructors,
  onCreated,
  onCancel,
}: {
  instructors: Instructor[]
  onCreated: () => void
  onCancel: () => void
}) {
  const [instructorId, setInstructorId] = useState(instructors[0]?.id ?? '')
  const [sessionType, setSessionType] = useState<'masterclass' | 'course_class'>('masterclass')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('11th Floor, Capital Tower, Sector 20, Gurugram')
  const [capacity, setCapacity] = useState('20')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!instructorId || !date || !startTime || !endTime || !location || !capacity) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createSession({
        instructor_id: instructorId,
        session_type: sessionType,
        course_id: null,
        session_date: date,
        start_time: startTime,
        end_time: endTime,
        location,
        capacity: parseInt(capacity, 10),
      })
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create session.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'bg-[#0d0d0d] border border-white/10 text-white/80 text-sm px-3 py-2 rounded w-full focus:outline-none focus:border-[#d4bfff]/40'
  const labelCls = 'text-xs text-white/30 font-mono tracking-widest uppercase mb-1 block'

  return (
    <form onSubmit={handleSubmit} className="bg-[#111] border border-white/8 p-6 mb-6">
      <h3 className="text-sm font-semibold text-white/80 mb-5">New session</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Type</label>
          <select value={sessionType} onChange={e => setSessionType(e.target.value as 'masterclass' | 'course_class')} className={inputCls}>
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
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>Capacity</label>
          <input type="number" min={1} max={100} value={capacity} onChange={e => setCapacity(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>Start time</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>End time</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} required />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Location</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputCls} required />
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-400 font-mono">{error}</p>}

      <div className="flex gap-3 mt-5">
        <button type="submit" disabled={saving}
          className="bg-[#d4bfff] text-[#050505] text-xs font-bold font-mono tracking-widest uppercase px-5 py-2.5 disabled:opacity-50">
          {saving ? 'Creating…' : 'Create session'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-xs text-white/35 hover:text-white/60 transition-colors px-3 py-2.5">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Reschedule form ───────────────────────────────────────────────────────────

function RescheduleForm({
  session,
  onDone,
  onCancel,
}: {
  session: Session
  onDone: () => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(session.session_date)
  const [startTime, setStartTime] = useState(session.start_time)
  const [endTime, setEndTime] = useState(session.end_time)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await rescheduleSession(session.id, date, startTime, endTime)
      onDone()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to reschedule.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'bg-[#0d0d0d] border border-white/10 text-white/80 text-sm px-3 py-2 rounded focus:outline-none focus:border-[#d4bfff]/40'

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-[#0d0d0d] border border-white/8 flex gap-3 items-end flex-wrap">
      <div>
        <label className="text-[10px] text-white/30 font-mono tracking-widest uppercase mb-1 block">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} required />
      </div>
      <div>
        <label className="text-[10px] text-white/30 font-mono tracking-widest uppercase mb-1 block">Start</label>
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} required />
      </div>
      <div>
        <label className="text-[10px] text-white/30 font-mono tracking-widest uppercase mb-1 block">End</label>
        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} required />
      </div>
      {error && <p className="w-full text-xs text-red-400 font-mono">{error}</p>}
      <div className="flex gap-2 items-center">
        <button type="submit" disabled={saving}
          className="bg-[#d4bfff] text-[#050505] text-xs font-bold font-mono tracking-widest uppercase px-4 py-2 disabled:opacity-50">
          {saving ? 'Saving…' : 'Confirm'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-white/30 hover:text-white/60 px-2 py-2">Cancel</button>
      </div>
    </form>
  )
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  allSessions,
  onRefresh,
}: {
  session: Session
  allSessions: Session[]
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [regs, setRegs] = useState<Registration[]>([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [reassignTarget, setReassignTarget] = useState<Record<string, string>>({})
  const [reassigning, setReassigning] = useState<string | null>(null)
  const [reassignError, setReassignError] = useState<string | null>(null)

  async function loadRegs() {
    setLoadingRegs(true)
    try {
      const data = await fetchSessionRegistrations(session.id)
      setRegs(data)
    } catch {
      // silently fail — rows just won't show
    } finally {
      setLoadingRegs(false)
    }
  }

  function toggle() {
    if (!expanded) loadRegs()
    setExpanded(v => !v)
  }

  async function handleReassign(regId: string) {
    const target = reassignTarget[regId]
    if (!target) return
    setReassigning(regId)
    setReassignError(null)
    try {
      const result = await reassignRegistration(regId, target, false)
      if (!result.success) {
        setReassignError(`${result.reason ?? 'failed'} — use force to override`)
        return
      }
      await loadRegs()
      onRefresh()
    } catch (e: unknown) {
      setReassignError(e instanceof Error ? e.message : 'Reassignment failed.')
    } finally {
      setReassigning(null)
    }
  }

  const seatsLeft = Math.max(0, session.capacity - session.seats_booked)
  const otherSessions = allSessions.filter(s => s.id !== session.id && s.session_type === session.session_type)

  return (
    <div className="border border-white/6 bg-[#0d0d0d]">
      {/* Header row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={toggle}
      >
        <div className="text-white/20">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-white/80">{fmtDate(session.session_date)}</span>
            <span className="font-mono text-[10px] text-white/30">{session.start_time.slice(0, 5)} – {session.end_time.slice(0, 5)}</span>
            {statusBadge(session.status)}
            <span className="font-mono text-[10px] text-[#d4bfff]/50 uppercase tracking-widest">
              {session.session_type === 'masterclass' ? 'Masterclass' : 'Course'}
            </span>
          </div>
          <div className="text-xs text-white/30 mt-0.5 truncate">{session.location}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-xs text-white/50">{session.seats_booked} / {session.capacity}</div>
          <div className="font-mono text-[10px] text-white/25">{seatsLeft === 0 ? 'full' : `${seatsLeft} left`}</div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/6 px-5 py-4">
          {/* Actions */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setShowReschedule(v => !v)}
              className="text-xs text-white/40 hover:text-[#d4bfff] transition-colors font-mono tracking-widest uppercase"
            >
              {showReschedule ? 'Cancel reschedule' : 'Reschedule'}
            </button>
          </div>

          {showReschedule && (
            <RescheduleForm
              session={session}
              onDone={() => { setShowReschedule(false); onRefresh() }}
              onCancel={() => setShowReschedule(false)}
            />
          )}

          {/* Registrations */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-white/25 font-mono tracking-widest uppercase">Registrations</span>
              <button onClick={loadRegs} className="text-white/20 hover:text-white/50 transition-colors">
                <RefreshCw size={11} />
              </button>
            </div>

            {loadingRegs && <p className="text-xs text-white/25 font-mono">Loading…</p>}

            {!loadingRegs && regs.length === 0 && (
              <p className="text-xs text-white/20 font-mono">No registrations yet.</p>
            )}

            {regs.length > 0 && (
              <div className="flex flex-col gap-1">
                {regs.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-white/4 last:border-0 flex-wrap">
                    <UserCheck size={12} className="text-white/20 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white/75 font-medium">{r.name}</span>
                      <span className="text-xs text-white/30 ml-2">{r.phone}</span>
                      <span className="text-xs text-white/25 ml-2">{r.email}</span>
                    </div>
                    {regBadge(r.status)}
                    {/* Reassign control */}
                    {otherSessions.length > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        <select
                          value={reassignTarget[r.id] ?? ''}
                          onChange={e => setReassignTarget(prev => ({ ...prev, [r.id]: e.target.value }))}
                          className="bg-[#0a0a0a] border border-white/10 text-white/50 text-xs px-2 py-1 rounded focus:outline-none"
                        >
                          <option value="">Move to…</option>
                          {otherSessions.map(s => (
                            <option key={s.id} value={s.id}>{fmtDate(s.session_date)} ({s.status})</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleReassign(r.id)}
                          disabled={!reassignTarget[r.id] || reassigning === r.id}
                          className="text-[10px] font-mono text-[#d4bfff]/60 hover:text-[#d4bfff] disabled:opacity-30 transition-colors uppercase tracking-widest"
                        >
                          {reassigning === r.id ? '…' : 'Move'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {reassignError && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-400/70">
                    <AlertCircle size={12} />
                    {reassignError}
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

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, i] = await Promise.all([fetchAllSessions(), fetchInstructors()])
      setSessions(s)
      setInstructors(i)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = typeFilter === 'all' ? sessions : sessions.filter(s => s.session_type === typeFilter)

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Schedule</h1>
          <p className="text-sm text-white/35 mt-0.5">
            {loading ? 'Loading…' : `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-white/20 hover:text-white/50 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 bg-[#d4bfff] text-[#050505] text-xs font-bold font-mono tracking-widest uppercase px-4 py-2.5"
          >
            <Plus size={13} />
            New session
          </button>
        </div>
      </div>

      {showCreate && instructors.length > 0 && (
        <CreateSessionForm
          instructors={instructors}
          onCreated={() => { setShowCreate(false); load() }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {showCreate && instructors.length === 0 && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded px-4 py-3 text-sm text-amber-400 mb-6">
          No instructors found. Run the SQL migration first — it seeds one instructor row automatically.
        </div>
      )}

      {/* Type filter */}
      <div className="flex gap-1 mb-5">
        {(['all', 'masterclass', 'course_class'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 transition-colors ${
              typeFilter === t
                ? 'bg-[#d4bfff]/15 text-[#d4bfff]'
                : 'text-white/30 hover:text-white/55'
            }`}
          >
            {t === 'all' ? 'All' : t === 'masterclass' ? 'Masterclass' : 'Course'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded px-4 py-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="py-20 text-center text-white/20 text-sm font-mono">
          No sessions yet. Create one above.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map(s => (
          <SessionRow
            key={s.id}
            session={s}
            allSessions={sessions}
            onRefresh={load}
          />
        ))}
      </div>
    </div>
  )
}
