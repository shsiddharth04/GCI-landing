import { useState } from 'react'
import { loadSettings, saveSettings, CurriculumModule } from '../settings'
import { useToast } from '../components/Toast'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Check } from 'lucide-react'

const BLANK_MODULE: Omit<CurriculumModule, 'id' | 'order'> = {
  weekLabel: '',
  title: '',
  description: '',
}

const INPUT = 'w-full bg-[#F9F6FF] border border-[#D4C6EF] focus:border-[#9C7CE0] rounded-xl px-4 py-3 text-sm text-[#190F30] placeholder-[#C4B4E4] outline-none transition-colors'
const FIELD_LABEL = 'text-xs font-medium text-[#8B73B3] mb-1.5 block'

function ModuleForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<CurriculumModule, 'id' | 'order'>
  onSave: (m: Omit<CurriculumModule, 'id' | 'order'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  return (
    <div className="bg-[#EDE6FF] rounded-xl p-4 space-y-3" style={{ border: '1px solid #C4B4E4' }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={FIELD_LABEL}>Week label</label>
          <input className={INPUT} placeholder="e.g. Week 1–2" value={form.weekLabel} onChange={e => setForm(f => ({ ...f, weekLabel: e.target.value }))} />
        </div>
        <div>
          <label className={FIELD_LABEL}>Module title</label>
          <input className={INPUT} placeholder="e.g. Foundations" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className={FIELD_LABEL}>Description</label>
        <textarea
          className={INPUT + ' resize-none'}
          rows={2}
          placeholder="What students learn in this module."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 text-xs text-[#8B73B3] hover:text-[#6B40A8] px-3 py-2 rounded-lg transition-colors bg-white" style={{ border: '1px solid #D4C6EF' }}>
          <X size={13} /> Cancel
        </button>
        <button type="button" onClick={() => onSave(form)} className="flex items-center gap-1.5 text-xs bg-[#6B40A8] hover:bg-[#5C358A] text-white font-semibold px-3 py-2 rounded-lg transition-colors">
          <Check size={13} /> Save module
        </button>
      </div>
    </div>
  )
}

export default function CurriculumEditor() {
  const stored = loadSettings()
  const [modules, setModules] = useState<CurriculumModule[]>(
    [...stored.curriculum].sort((a, b) => a.order - b.order)
  )
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { showToast, ToastEl } = useToast()

  function persist(updated: CurriculumModule[]) {
    const current = loadSettings()
    saveSettings({ ...current, curriculum: updated })
    showToast('Curriculum saved.')
  }

  function addModule(m: Omit<CurriculumModule, 'id' | 'order'>) {
    const next: CurriculumModule = { ...m, id: crypto.randomUUID(), order: modules.length }
    const updated = [...modules, next]
    setModules(updated)
    persist(updated)
    setAdding(false)
  }

  function updateModule(id: string, m: Omit<CurriculumModule, 'id' | 'order'>) {
    const updated = modules.map(mod => mod.id === id ? { ...mod, ...m } : mod)
    setModules(updated)
    persist(updated)
    setEditingId(null)
  }

  function deleteModule(id: string) {
    const updated = modules.filter(m => m.id !== id).map((m, i) => ({ ...m, order: i }))
    setModules(updated)
    persist(updated)
  }

  function moveModule(id: string, dir: -1 | 1) {
    const idx = modules.findIndex(m => m.id === id)
    if (idx + dir < 0 || idx + dir >= modules.length) return
    const next = [...modules]
    ;[next[idx], next[idx + dir]] = [next[idx + dir], next[idx]]
    const reordered = next.map((m, i) => ({ ...m, order: i }))
    setModules(reordered)
    persist(reordered)
  }

  return (
    <div className="p-8 max-w-2xl">
      <ToastEl />
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-[#190F30]">Curriculum</h1>
        <span className="font-mono text-xs text-[#B5A3D4]">{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-sm text-[#8B73B3] mb-8">Add, edit, and reorder the weekly course modules.</p>

      <div className="space-y-3">
        {modules.map((mod, idx) => (
          <div key={mod.id}>
            {editingId === mod.id ? (
              <ModuleForm
                initial={{ weekLabel: mod.weekLabel, title: mod.title, description: mod.description }}
                onSave={m => updateModule(mod.id, m)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="bg-white rounded-xl p-4 flex items-start gap-4" style={{ border: '1px solid #E3D9F7' }}>
                <div className="font-mono text-xs text-[#9C7CE0] mt-0.5 w-6 shrink-0 text-right">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#7548B8] mb-0.5">{mod.weekLabel || '—'}</div>
                  <div className="text-sm font-medium text-[#190F30]">{mod.title || <span className="text-[#C4B4E4]">Untitled</span>}</div>
                  {mod.description && <p className="text-xs text-[#9980BF] mt-1 leading-relaxed">{mod.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => moveModule(mod.id, -1)} disabled={idx === 0} className="p-1.5 rounded hover:bg-[#EDE6FF] disabled:opacity-20 transition-colors">
                    <ChevronUp size={14} className="text-[#8B73B3]" />
                  </button>
                  <button onClick={() => moveModule(mod.id, 1)} disabled={idx === modules.length - 1} className="p-1.5 rounded hover:bg-[#EDE6FF] disabled:opacity-20 transition-colors">
                    <ChevronDown size={14} className="text-[#8B73B3]" />
                  </button>
                  <button onClick={() => setEditingId(mod.id)} className="p-1.5 rounded hover:bg-[#EDE6FF] transition-colors">
                    <Pencil size={14} className="text-[#8B73B3]" />
                  </button>
                  <button onClick={() => deleteModule(mod.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <ModuleForm initial={BLANK_MODULE} onSave={addModule} onCancel={() => setAdding(false)} />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm text-[#9C7CE0] hover:text-[#6B40A8] hover:bg-[#EDE6FF] transition-colors"
            style={{ border: '1.5px dashed #C4B4E4' }}
          >
            <Plus size={15} />
            Add module
          </button>
        )}
      </div>
    </div>
  )
}
