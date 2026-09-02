import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Mail, Trash2, UserPlus, CheckCircle, AlertCircle } from 'lucide-react'
import {
  fetchEnrolledStudents, addEnrolledStudent, updateStudentStatus,
  deleteEnrolledStudent, sendStudentInvite,
} from '../../lib/db'
import type { EnrolledStudent } from '../../lib/db'

const labelCls = 'text-[10px] text-[#8B73B3] font-mono tracking-widest uppercase mb-1.5 block'
const inputCls = 'bg-[#F9F6FF] border border-[#D4C6EF] hover:border-[#9C7CE0] focus:border-[#9C7CE0] text-[#190F30] text-sm px-3 py-2.5 w-full outline-none transition-colors'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function CohortBadge({ cohort }: { cohort: 'C1' | 'C2' }) {
  return (
    <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 ${
      cohort === 'C1' ? 'bg-pink-50 text-pink-700' : 'bg-indigo-50 text-indigo-600'
    }`}>
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

function AddStudentForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cohort, setCohort] = useState<'C1' | 'C2'>('C1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return }
    setSaving(true); setError(null)
    try {
      await addEnrolledStudent(name.trim(), email.trim(), phone.trim(), cohort)
      setName(''); setEmail(''); setPhone(''); setCohort('C1')
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
              {(['C1', 'C2'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCohort(c)}
                  className={`px-5 py-2.5 text-xs font-mono font-bold transition-colors ${
                    cohort === c
                      ? c === 'C1' ? 'bg-pink-600 text-white' : 'bg-indigo-500 text-white'
                      : 'bg-white text-[#8B73B3] hover:text-[#6B40A8]'
                  }`}
                  style={{ border: cohort === c ? 'none' : '1px solid #D4C6EF' }}
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
      {state === 'sending' ? 'Sending…' : student.invited_at ? 'Resend link' : 'Send invite'}
    </button>
  )
}

export default function Students() {
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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
        <div className="grid px-5 py-2.5 bg-[#F9F6FF]" style={{ gridTemplateColumns: '2fr 2fr 80px 90px 120px 1fr', borderBottom: '1px solid #E3D9F7' }}>
          {['Name', 'Email', 'Cohort', 'Status', 'Enrolled', 'Actions'].map(h => (
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
          <div
            key={student.id}
            className="grid items-center px-5 py-3.5 hover:bg-[#F9F6FF] transition-colors"
            style={{ gridTemplateColumns: '2fr 2fr 80px 90px 120px 1fr', borderBottom: '1px solid #F0EAFF' }}
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
        ))}
      </div>
    </div>
  )
}
