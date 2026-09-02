import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Eye, EyeOff, RefreshCw, ExternalLink } from 'lucide-react'
import {
  fetchAllResources, addStudentResource, updateResourcePublished, deleteStudentResource,
} from '../../lib/db'
import type { StudentResource } from '../../lib/db'

const labelCls = 'text-[10px] text-[#8B73B3] font-mono tracking-widest uppercase mb-1.5 block'
const inputCls = 'bg-[#F9F6FF] border border-[#D4C6EF] hover:border-[#9C7CE0] focus:border-[#9C7CE0] text-[#190F30] text-sm px-3 py-2.5 w-full outline-none transition-colors'

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF', link: 'Link', video: 'Video', audio: 'Audio', other: 'Other',
}
const RESOURCE_TYPES: StudentResource['resource_type'][] = ['link', 'pdf', 'video', 'audio', 'other']

function CohortBadge({ cohort }: { cohort: StudentResource['cohort'] }) {
  const map = { C1: 'bg-pink-50 text-pink-700', C2: 'bg-indigo-50 text-indigo-600', all: 'bg-[#EDE6FF] text-[#6B40A8]' }
  return <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 ${map[cohort]}`}>{cohort === 'all' ? 'All' : cohort}</span>
}

function TypeBadge({ type }: { type: StudentResource['resource_type'] }) {
  return <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 bg-[#F9F6FF] text-[#8B73B3]">{TYPE_LABELS[type ?? 'link'] ?? 'File'}</span>
}

function AddResourceForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [cohort, setCohort] = useState<StudentResource['cohort']>('all')
  const [type, setType] = useState<StudentResource['resource_type']>('link')
  const [publish, setPublish] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) { setError('Title and URL are required.'); return }
    setSaving(true); setError(null)
    try {
      const resource = await addStudentResource(title.trim(), url.trim(), cohort, type, description.trim() || undefined)
      if (publish) await updateResourcePublished(resource.id, true)
      setTitle(''); setUrl(''); setDescription(''); setCohort('all'); setType('link'); setPublish(false)
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add resource.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-6 bg-white p-5" style={{ border: '1px solid #E3D9F7' }}>
      <p className="text-[10px] font-mono text-[#B5A3D4] uppercase tracking-widest mb-4">Add resource</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Module 3 — Rekordbox Deep Dive" className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>URL</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://drive.google.com/..." className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Description <span className="normal-case text-[#C4B4E4] ml-1">(optional)</span></label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the resource" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cohort</label>
            <div className="flex gap-1.5">
              {(['C1', 'C2', 'all'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCohort(c)}
                  className={`px-4 py-2 text-xs font-mono font-bold transition-colors ${
                    cohort === c
                      ? c === 'C1' ? 'bg-pink-600 text-white' : c === 'C2' ? 'bg-indigo-500 text-white' : 'bg-[#6B40A8] text-white'
                      : 'bg-white text-[#8B73B3] hover:text-[#6B40A8]'
                  }`}
                  style={{ border: cohort === c ? 'none' : '1px solid #D4C6EF' }}
                >
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={type ?? 'link'} onChange={e => setType(e.target.value as StudentResource['resource_type'])} className={inputCls}>
              {RESOURCE_TYPES.map(t => <option key={t} value={t ?? ''}>{TYPE_LABELS[t ?? 'link']}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            onClick={() => setPublish(false)}
            disabled={saving}
            className="flex items-center gap-2 bg-white hover:bg-[#F9F6FF] text-[#6B40A8] border border-[#D4C6EF] text-xs font-bold font-mono tracking-widest uppercase px-4 py-2.5 disabled:opacity-50 transition-colors"
          >
            <EyeOff size={12} />
            Save draft
          </button>
          <button
            type="submit"
            onClick={() => setPublish(true)}
            disabled={saving}
            className="flex items-center gap-2 bg-[#6B40A8] hover:bg-[#5C358A] text-white text-xs font-bold font-mono tracking-widest uppercase px-4 py-2.5 disabled:opacity-50 transition-colors"
          >
            <Eye size={12} />
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ResourcesAdmin() {
  const [resources, setResources] = useState<StudentResource[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setResources(await fetchAllResources()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function togglePublish(id: string, current: boolean) {
    setTogglingId(id)
    try {
      await updateResourcePublished(id, !current)
      setResources(prev => prev.map(r => r.id === id ? { ...r, is_published: !current } : r))
    } finally { setTogglingId(null) }
  }

  async function handleDelete(id: string) {
    try {
      await deleteStudentResource(id)
      setResources(prev => prev.filter(r => r.id !== id))
      setConfirmDelete(null)
    } catch { /* silent */ }
  }

  const published = resources.filter(r => r.is_published).length
  const drafts = resources.length - published

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#190F30]">Resources</h1>
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
            Add resource
          </button>
        </div>
      </div>

      {showAdd && <AddResourceForm onCreated={() => { setShowAdd(false); load() }} />}

      <div style={{ border: '1px solid #E3D9F7' }}>
        {/* Header */}
        <div className="grid px-5 py-2.5 bg-[#F9F6FF]" style={{ gridTemplateColumns: '2fr 80px 80px 1fr 80px', borderBottom: '1px solid #E3D9F7' }}>
          {['Title', 'Cohort', 'Type', 'URL', 'Actions'].map(h => (
            <span key={h} className="text-[9px] font-mono text-[#C4B4E4] uppercase tracking-widest">{h}</span>
          ))}
        </div>

        {loading && <div className="px-5 py-6 text-xs text-[#C4B4E4] font-mono">Loading…</div>}
        {!loading && resources.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-[#C4B4E4] font-mono">No resources yet.</div>
        )}

        {resources.map(r => (
          <div
            key={r.id}
            className="grid items-center px-5 py-3.5 hover:bg-[#F9F6FF] transition-colors"
            style={{ gridTemplateColumns: '2fr 80px 80px 1fr 80px', borderBottom: '1px solid #F0EAFF' }}
          >
            <div>
              <div className="text-sm font-medium text-[#190F30] flex items-center gap-2">
                {r.title}
                {!r.is_published && <span className="font-mono text-[8px] text-[#C4B4E4] uppercase tracking-widest">Draft</span>}
              </div>
              {r.description && <div className="text-[10px] text-[#B5A3D4] truncate mt-0.5 max-w-[240px]">{r.description}</div>}
            </div>
            <CohortBadge cohort={r.cohort} />
            <TypeBadge type={r.resource_type} />
            <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-[#8B73B3] hover:text-[#6B40A8] font-mono transition-colors truncate max-w-[180px]">
              <ExternalLink size={10} className="shrink-0" />
              <span className="truncate">{r.url.replace(/^https?:\/\//, '').slice(0, 40)}</span>
            </a>
            <div className="flex items-center gap-3">
              <button
                onClick={() => togglePublish(r.id, r.is_published)}
                disabled={togglingId === r.id}
                className={`flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase transition-colors disabled:opacity-40 ${
                  r.is_published ? 'text-emerald-600 hover:text-emerald-800' : 'text-[#B5A3D4] hover:text-[#7548B8]'
                }`}
                title={r.is_published ? 'Unpublish' : 'Publish'}
              >
                {r.is_published ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
              {confirmDelete === r.id ? (
                <span className="flex items-center gap-1">
                  <button onClick={() => handleDelete(r.id)} className="text-[9px] font-mono font-bold text-red-500 hover:text-red-700 uppercase tracking-widest">Del</button>
                  <button onClick={() => setConfirmDelete(null)} className="text-[9px] font-mono text-[#C4B4E4]">×</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelete(r.id)} className="text-[#C4B4E4] hover:text-red-500 transition-colors">
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
