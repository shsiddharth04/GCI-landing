import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Mail, Trash2, UserPlus, CheckCircle, AlertCircle, Lock, Unlock, ShieldAlert, ShieldOff } from 'lucide-react'
import {
  fetchEnrolledStudents, addEnrolledStudent, updateStudentStatus,
  deleteEnrolledStudent, sendStudentInvite, adminSetPracticeAccess,
} from '../../lib/db'
import type { EnrolledStudent } from '../../lib/db'

const labelCls = 'text-[10px] text-[#8B73B3] font-mono tracking-widest uppercase mb-1.5 block'
const inputCls = 'bg-[#F9F6FF] border border-[#D4C6EF] hover:border-[#9C7CE0] focus:border-[#9C7CE0] text-[#190F30] text-sm px-3 py-2.5 w-full outline-none transition-colors'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTimeFull(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function isBlockActive(blockedUntil: string | null): boolean {
  return !!blockedUntil && new Date(blockedUntil) > new Date()
}

const COHORT_BG: Record<string, string> = {
  C0: '#64748b', C1: '#db2777', C2: '#6366f1', C3: '#f59e0b', C4: '#059669', C5: '#0ea5e9',
}
const COHORT_BADGE_BG: Record<string, string> = {
  C0: '#f8fafc', C1: '#fdf2f8', C2: '#eef2ff', C3: '#fffbeb', C4: '#ecfdf5', C5: '#f0f9ff',
}
const COHORT_BADGE_TEXT: Record<string, string> = {
  C0: '#475569', C1: '#be185d', C2: '#4338ca', C3: '#b45309', C4: '#065f46', C5: '#0369a1',
}

function CohortBadge({ cohort }: { cohort: EnrolledStudent['cohort'] }) {
  return (
    <span
      className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5"
      style={{ background: COHORT_BADGE_BG[cohort] ?? '#f9f6ff', color: COHORT_BADGE_TEXT[cohort] ?? '#6B40A8' }}
    >
      {cohort}
    </span>
  )
}

function StatusBadge({ status }: { status: EnrolledStudent['status'] }) {
  const map = {
    active:    'bg-emerald-50 text-emerald-700',
    graduated: 'bg-[#EDE6FF] text-[#6B40A8]',
    suspended: 'bg-red-50 text-red-600',
  }
  return (
    <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 ${map[status]}`}>
      {status}
    </span>
  )
}

function PracticeStatePill({ student }: { student: EnrolledStudent }) {
  const blocked = isBlockActive(student.blocked_until)
  const unlocked = student.practice_access_mode === 'unlocked'

  if (blocked) return (
    <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 bg-red-50 text-red-600">
      Blocked
    </span>
  )
  if (unlocked) return (
    <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700">
      Unlocked
    </span>
  )
  return (
    <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 bg-[#F9F6FF] text-[#C4B4E4]">
      Locked
    </span>
  )
}

function PracticeAccessPanel({
  student, onDone,
}: { student: EnrolledStudent; onDone: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const blocked = isBlockActive(student.blocked_until)
  const unlocked = student.practice_access_mode === 'unlocked'

  async function doAction(
    action: 'unlock' | 'lock' | 'noshowblock_set' | 'noshowblock_lifted',
    newBlockedUntil?: string,
  ) {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const result = await adminSetPracticeAccess(
        student.id, action, newBlockedUntil ?? null, 'admin',
      )
      if (result.error) {
        setError(result.error)
      } else {
        const cancelled = result.cancelled_bookings?.length ?? 0
        const msg = cancelled > 0
          ? `Done. ${cancelled} upcoming booking${cancelled === 1 ? '' : 's'} cancelled.`
          : 'Done.'
        setSuccessMsg(msg)
        await onDone()
        setTimeout(() => setSuccessMsg(null), 3000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed.')
    } finally {
      setLoading(false)
    }
  }

  const btnBase = 'flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-3 py-2 transition-colors disabled:opacity-40 border'

  return (
    <div className="px-5 py-4" style={{ background: '#FDFBFF', borderBottom: '1px solid #F0EAFF' }}>
      <div className="flex flex-wrap items-start gap-6">

        {/* State info */}
        <div className="min-w-[160px]">
          <p className="text-[9px] font-mono text-[#C4B4E4] uppercase tracking-widest mb-2">Practice access</p>
          <div className="flex items-center gap-2 mb-1">
            <PracticeStatePill student={student} />
          </div>
          {blocked && student.blocked_until && (
            <p className="text-[10px] font-mono text-red-500 mt-1">
              Until {fmtDateTimeFull(student.blocked_until)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 items-center pt-5">

          {/* Unlock / Lock toggle */}
          {!unlocked ? (
            <button
              disabled={loading}
              onClick={() => doAction('unlock')}
              className={`${btnBase} bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100`}
            >
              <Unlock size={10} />
              Unlock
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={() => doAction('lock')}
              className={`${btnBase} bg-[#F9F6FF] border-[#D4C6EF] text-[#8B73B3] hover:bg-[#EDE6FF]`}
            >
              <Lock size={10} />
              Lock
            </button>
          )}

          {/* No-show block set (fast: 7 days from now) */}
          {!blocked && (
            <button
              disabled={loading}
              onClick={() => {
                const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                doAction('noshowblock_set', until)
              }}
              className={`${btnBase} bg-red-50 border-red-200 text-red-600 hover:bg-red-100`}
            >
              <ShieldAlert size={10} />
              No-show block (+7d)
            </button>
          )}

          {/* Lift block */}
          {blocked && (
            <button
              disabled={loading}
              onClick={() => doAction('noshowblock_lifted')}
              className={`${btnBase} bg-[#F9F6FF] border-[#D4C6EF] text-[#8B73B3] hover:bg-[#EDE6FF]`}
            >
              <ShieldOff size={10} />
              Lift block
            </button>
          )}
        </div>

        {/* Feedback */}
        {(error || successMsg || loading) && (
          <div className="flex items-center pt-5">
            {loading && (
              <span className="font-mono text-[10px] text-[#C4B4E4] tracking-widest">Applying…</span>
            )}
            {error && !loading && (
              <span className="font-mono text-[10px] text-red-500 tracking-widest">{error}</span>
            )}
            {successMsg && !loading && (
              <span className="font-mono text-[10px] text-emerald-600 tracking-widest">{successMsg}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddStudentForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cohort, setCohort] = useState<EnrolledStudent['cohort']>('C0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return }
    setSaving(true); setError(null)
    try {
      await addEnrolledStudent(name.trim(), email.trim(), phone.trim(), cohort)
      await sendStudentInvite(email.trim().toLowerCase())
      setName(''); setEmail(''); setPhone(''); setCohort('C0')
      onCreated()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add student.'
      setError(msg.includes('unique') ? 'That email is already enrolled.' : msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-6 bg-white p-5" style={{ border: '1px solid #E3D9F7' }}>
      <p className="text-[10px] font-mono text-[#B5A3D4] uppercase tracking-widest mb-4">Add student</p>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelCls}>Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Arjun Mehta" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="arjun@example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 99999 99999" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cohort</label>
            <div className="flex gap-2 pt-0.5">
              {(['C0', 'C1', 'C2', 'C3', 'C4', 'C5'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCohort(c)}
                  className="px-4 py-2.5 text-xs font-mono font-bold transition-colors"
                  style={{
                    background: cohort === c ? COHORT_BG[c] : 'white',
                    color: cohort === c ? 'white' : '#8B73B3',
                    border: cohort === c ? 'none' : '1px solid #D4C6EF',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 font-mono mb-3">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-5 py-2.5 disabled:opacity-50 transition-colors"
        >
          <UserPlus size={12} />
          {saving ? 'Adding…' : 'Add student'}
        </button>
      </form>
    </div>
  )
}

function InviteButton({ student, onSent }: { student: EnrolledStudent; onSent: () => void }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function send() {
    setState('sending')
    const result = await sendStudentInvite(student.email)
    if (result.success) {
      setState('sent')
      setTimeout(onSent, 1500)
    } else {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  if (state === 'sent') return (
    <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-600 tracking-widest uppercase">
      <CheckCircle size={9} /> Sent
    </span>
  )
  if (state === 'error') return (
    <span className="flex items-center gap-1 font-mono text-[9px] text-red-500 tracking-widest uppercase">
      <AlertCircle size={9} /> Failed
    </span>
  )

  return (
    <button
      onClick={send}
      disabled={state === 'sending'}
      className="flex items-center gap-1.5 font-mono text-[9px] text-[#7548B8] hover:text-[#6B40A8] tracking-widest uppercase transition-colors disabled:opacity-40"
    >
      <Mail size={9} />
      {state === 'sending' ? 'Sending…' : 'Resend invite'}
    </button>
  )
}

export default function Students() {
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [expandedPracticeId, setExpandedPracticeId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await fetchEnrolledStudents()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(id: string, status: EnrolledStudent['status']) {
    try {
      await updateStudentStatus(id, status)
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    } catch { /* silent */ }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEnrolledStudent(id)
      setStudents(prev => prev.filter(s => s.id !== id))
      setConfirmDelete(null)
    } catch { /* silent */ }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#190F30]">Students</h1>
          <p className="text-xs text-[#B5A3D4] font-mono mt-0.5">{students.length} enrolled</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-[#C4B4E4] hover:text-[#7548B8] transition-colors p-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-4 py-2.5 transition-colors"
          >
            <UserPlus size={13} />
            Add student
          </button>
        </div>
      </div>

      {showAdd && <AddStudentForm onCreated={() => { setShowAdd(false); load() }} />}

      {/* Table */}
      <div style={{ border: '1px solid #E3D9F7' }}>
        {/* Header */}
        <div className="grid px-5 py-2.5 bg-[#F9F6FF]" style={{ gridTemplateColumns: '2fr 2fr 80px 90px 100px 100px 1fr', borderBottom: '1px solid #E3D9F7' }}>
          {['Name', 'Email', 'Cohort', 'Status', 'Enrolled', 'Practice', 'Actions'].map(h => (
            <span key={h} className="text-[9px] font-mono text-[#C4B4E4] uppercase tracking-widest">{h}</span>
          ))}
        </div>

        {loading && (
          <div className="px-5 py-6 text-xs text-[#C4B4E4] font-mono">Loading…</div>
        )}

        {!loading && students.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-[#C4B4E4] font-mono">
            No students enrolled yet. Add your first student above.
          </div>
        )}

        {students.map(student => (
          <div key={student.id}>
            {/* Main row */}
            <div
              className="grid items-center px-5 py-3.5 hover:bg-[#F9F6FF] transition-colors"
              style={{ gridTemplateColumns: '2fr 2fr 80px 90px 100px 100px 1fr', borderBottom: expandedPracticeId === student.id ? 'none' : '1px solid #F0EAFF' }}
            >
              <div>
                <div className="text-sm font-medium text-[#190F30]">{student.name}</div>
                {student.phone && <div className="text-[10px] text-[#B5A3D4] font-mono mt-0.5">{student.phone}</div>}
              </div>
              <div className="text-xs text-[#8B73B3] font-mono truncate">{student.email}</div>
              <CohortBadge cohort={student.cohort} />
              <div>
                <select
                  value={student.status}
                  onChange={e => handleStatusChange(student.id, e.target.value as EnrolledStudent['status'])}
                  className="text-[10px] font-mono bg-transparent border-0 outline-none text-[#8B73B3] cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="graduated">Graduated</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="text-[10px] text-[#C4B4E4] font-mono">{fmtDate(student.enrolled_at)}</div>

              {/* Practice state — clickable to expand panel */}
              <div>
                <button
                  onClick={() => setExpandedPracticeId(id => id === student.id ? null : student.id)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <PracticeStatePill student={student} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <InviteButton student={student} onSent={load} />
                {confirmDelete === student.id ? (
                  <span className="flex items-center gap-2">
                    <span className="text-[9px] text-red-500 font-mono">Remove?</span>
                    <button onClick={() => handleDelete(student.id)} className="text-[9px] font-mono font-bold text-red-500 hover:text-red-700 uppercase tracking-widest">Yes</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-[9px] font-mono text-[#C4B4E4]">No</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(student.id)}
                    className="text-[#C4B4E4] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Expandable practice access panel */}
            {expandedPracticeId === student.id && (
              <PracticeAccessPanel student={student} onDone={load} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
