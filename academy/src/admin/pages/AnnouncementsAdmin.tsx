import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react'
import {
  fetchAllAnnouncements, addAnnouncement, publishAnnouncement, deleteAnnouncement,
} from '../../lib/db'
import type { Announcement } from '../../lib/db'

const labelCls = 'text-[10px] text-[#8B73B3] font-mono tracking-widest uppercase mb-1.5 block'
const inputCls = 'bg-[#F9F6FF] border border-[#D4C6EF] hover:border-[#9C7CE0] focus:border-[#9C7CE0] text-[#190F30] text-sm px-3 py-2.5 w-full outline-none transition-colors'

const COHORT_BG: Record<string, string> = {
  C0: '#64748b', C1: '#db2777', C2: '#6366f1', C3: '#f59e0b', C4: '#059669', C5: '#0ea5e9', all: '#6B40A8',
}
const COHORT_BADGE_BG: Record<string, string> = {
  C0: '#f8fafc', C1: '#fdf2f8', C2: '#eef2ff', C3: '#fffbeb', C4: '#ecfdf5', C5: '#f0f9ff', all: '#EDE6FF',
}
const COHORT_BADGE_TEXT: Record<string, string> = {
  C0: '#475569', C1: '#be185d', C2: '#4338ca', C3: '#b45309', C4: '#065f46', C5: '#0369a1', all: '#6B40A8',
}

function CohortBadge({ cohort }: { cohort: Announcement['cohort'] }) {
  return (
    <span
      className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5"
      style={{ background: COHORT_BADGE_BG[cohort] ?? '#f9f6ff', color: COHORT_BADGE_TEXT[cohort] ?? '#6B40A8' }}
    >
      {cohort === 'all' ? 'All' : cohort}
    </span>
  )
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AddAnnouncementForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cohort, setCohort] = useState<Announcement['cohort']>('all')
  const [saving, setSaving] = useState(false)
  const [publishNow, setPublishNow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) { setError('Title and body are required.'); return }
    setSaving(true); setError(null)
    try {
      const ann = await addAnnouncement(title.trim(), body.trim(), cohort)
      if (publishNow) await publishAnnouncement(ann.id, true)
      setTitle(''); setBody(''); setCohort('all')
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create announcement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-6 bg-white p-5" style={{ border: '1px solid #E3D9F7' }}>
      <p className="text-[10px] font-mono text-[#B5A3D4] uppercase tracking-widest mb-4">New announcement</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelCls}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Studio update — new equipment" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Body</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            placeholder="Full announcement text…"
            className={inputCls}
            style={{ resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>
        <div>
          <label className={labelCls}>Cohort</label>
          <div className="flex gap-1.5">
            {(['C1', 'C2', 'C3', 'C4', 'C5', 'all'] as const).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCohort(c)}
                className="px-3 py-2 text-xs font-mono font-bold transition-colors"
                style={{
                  background: cohort === c ? COHORT_BG[c] : 'white',
                  color: cohort === c ? 'white' : '#8B73B3',
                  border: cohort === c ? 'none' : '1px solid #D4C6EF',
                }}
              >
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            onClick={() => setPublishNow(false)}
            disabled={saving}
            className="flex items-center gap-2 bg-white hover:bg-[#F9F6FF] text-[#6B40A8] border border-[#D4C6EF] text-xs font-bold font-mono tracking-widest uppercase px-4 py-2.5 disabled:opacity-50 transition-colors"
          >
            <EyeOff size={12} />
            Save draft
          </button>
          <button
            type="submit"
            onClick={() => setPublishNow(true)}
            disabled={saving}
            className="flex items-center gap-2 bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-4 py-2.5 disabled:opacity-50 transition-colors"
          >
            <Eye size={12} />
            {saving ? 'Saving…' : 'Publish now'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setAnnouncements(await fetchAllAnnouncements()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function togglePublish(id: string, current: boolean) {
    setTogglingId(id)
    try {
      await publishAnnouncement(id, !current)
      setAnnouncements(prev => prev.map(a => a.id === id
        ? { ...a, is_published: !current, published_at: !current ? new Date().toISOString() : a.published_at }
        : a
      ))
    } finally { setTogglingId(null) }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncement(id)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      setConfirmDelete(null)
    } catch { /* silent */ }
  }

  const published = announcements.filter(a => a.is_published).length
  const drafts = announcements.length - published

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#190F30]">Announcements</h1>
          <p className="text-xs text-[#B5A3D4] font-mono mt-0.5">{published} published · {drafts} draft{drafts !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-[#C4B4E4] hover:text-[#7548B8] transition-colors p-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-4 py-2.5 transition-colors"
          >
            <Plus size={13} />
            New announcement
          </button>
        </div>
      </div>

      {showAdd && <AddAnnouncementForm onCreated={() => { setShowAdd(false); load() }} />}

      <div style={{ border: '1px solid #E3D9F7' }}>
        {loading && <div className="px-5 py-6 text-xs text-[#C4B4E4] font-mono">Loading…</div>}
        {!loading && announcements.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-[#C4B4E4] font-mono">No announcements yet.</div>
        )}

        {announcements.map(a => (
          <div
            key={a.id}
            className="px-5 py-4 hover:bg-[#F9F6FF] transition-colors"
            style={{ borderBottom: '1px solid #F0EAFF' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#190F30]">{a.title}</span>
                  <CohortBadge cohort={a.cohort} />
                  {!a.is_published && (
                    <span className="font-mono text-[8px] text-[#C4B4E4] uppercase tracking-widest">Draft</span>
                  )}
                </div>
                <p className="text-xs text-[#8B73B3] leading-relaxed line-clamp-2 mb-2">{a.body}</p>
                <div className="flex items-center gap-3">
                  {a.published_at && (
                    <span className="font-mono text-[9px] text-[#C4B4E4]">
                      Published {fmtDate(a.published_at)}
                    </span>
                  )}
                  {!a.published_at && (
                    <span className="font-mono text-[9px] text-[#C4B4E4]">
                      Draft · {fmtDate(a.created_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => togglePublish(a.id, a.is_published)}
                  disabled={togglingId === a.id}
                  className={`flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase transition-colors disabled:opacity-40 ${
                    a.is_published ? 'text-emerald-600 hover:text-emerald-800' : 'text-[#B5A3D4] hover:text-[#7548B8]'
                  }`}
                >
                  {a.is_published ? <><Eye size={11} /> Published</> : <><EyeOff size={11} /> Draft</>}
                </button>
                {confirmDelete === a.id ? (
                  <span className="flex items-center gap-1.5">
                    <button onClick={() => handleDelete(a.id)} className="text-[9px] font-mono font-bold text-red-500 hover:text-red-700 uppercase tracking-widest">Delete</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-[9px] font-mono text-[#C4B4E4]">Cancel</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDelete(a.id)} className="text-[#C4B4E4] hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
