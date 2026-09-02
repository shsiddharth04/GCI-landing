import { useState } from 'react'
import { loadSettings, saveSettings, Instructor } from '../settings'
import { useToast } from '../components/Toast'
import { Plus, Pencil, Trash2, X, Check, Star } from 'lucide-react'

const BLANK: Omit<Instructor, 'id'> = {
  name: '',
  role: '',
  bio: '',
  initials: '',
  photoUrl: '',
  isLead: false,
}

const INPUT = 'w-full bg-[#F9F6FF] border border-[#D4C6EF] focus:border-[#9C7CE0] rounded-xl px-4 py-3 text-sm text-[#190F30] placeholder-[#C4B4E4] outline-none transition-colors'
const FIELD_LABEL = 'text-xs font-medium text-[#8B73B3] mb-1.5 block'

function InstructorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Instructor, 'id'>
  onSave: (i: Omit<Instructor, 'id'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  function set<K extends keyof Omit<Instructor, 'id'>>(k: K, v: Omit<Instructor, 'id'>[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }
  return (
    <div className="bg-[#EDE6FF] rounded-xl p-4 space-y-3" style={{ border: '1px solid #C4B4E4' }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={FIELD_LABEL}>Full name</label>
          <input className={INPUT} placeholder="e.g. Devith R." value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className={FIELD_LABEL}>Initials (avatar fallback)</label>
          <input className={INPUT} placeholder="e.g. DR" value={form.initials} onChange={e => set('initials', e.target.value)} maxLength={3} />
        </div>
      </div>
      <div>
        <label className={FIELD_LABEL}>Role / title</label>
        <input className={INPUT} placeholder="e.g. Co-founder, GCI" value={form.role} onChange={e => set('role', e.target.value)} />
      </div>
      <div>
        <label className={FIELD_LABEL}>Bio</label>
        <textarea
          className={INPUT + ' resize-none'}
          rows={3}
          placeholder="Short bio — one or two sentences."
          value={form.bio}
          onChange={e => set('bio', e.target.value)}
        />
      </div>
      <div>
        <label className={FIELD_LABEL}>Photo URL (optional)</label>
        <input className={INPUT} placeholder="https://..." value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-[#8B73B3] cursor-pointer">
        <input type="checkbox" checked={form.isLead} onChange={e => set('isLead', e.target.checked)} className="accent-[#6B40A8]" />
        Mark as lead instructor
      </label>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 text-xs text-[#8B73B3] hover:text-[#6B40A8] px-3 py-2 rounded-lg transition-colors bg-white" style={{ border: '1px solid #D4C6EF' }}>
          <X size={13} /> Cancel
        </button>
        <button type="button" onClick={() => onSave(form)} className="flex items-center gap-1.5 text-xs bg-[#6B40A8] hover:bg-[#5C358A] text-white font-semibold px-3 py-2 rounded-lg transition-colors">
          <Check size={13} /> Save instructor
        </button>
      </div>
    </div>
  )
}

export default function InstructorEditor() {
  const stored = loadSettings()
  const [instructors, setInstructors] = useState<Instructor[]>(stored.instructors)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { showToast, ToastEl } = useToast()

  function persist(updated: Instructor[]) {
    const current = loadSettings()
    saveSettings({ ...current, instructors: updated })
    showToast('Instructors saved.')
  }

  function addInstructor(i: Omit<Instructor, 'id'>) {
    const next: Instructor = { ...i, id: crypto.randomUUID() }
    const updated = [...instructors, next]
    setInstructors(updated)
    persist(updated)
    setAdding(false)
  }

  function updateInstructor(id: string, i: Omit<Instructor, 'id'>) {
    const updated = instructors.map(inst => inst.id === id ? { ...inst, ...i } : inst)
    setInstructors(updated)
    persist(updated)
    setEditingId(null)
  }

  function deleteInstructor(id: string) {
    const updated = instructors.filter(i => i.id !== id)
    setInstructors(updated)
    persist(updated)
  }

  return (
    <div className="p-8 max-w-2xl">
      <ToastEl />
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-[#190F30]">Instructors</h1>
        <span className="font-mono text-xs text-[#B5A3D4]">{instructors.length} instructor{instructors.length !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-sm text-[#8B73B3] mb-8">Add the real people teaching the course and running the masterclass.</p>

      <div className="space-y-3">
        {instructors.map(inst => (
          <div key={inst.id}>
            {editingId === inst.id ? (
              <InstructorForm
                initial={{ name: inst.name, role: inst.role, bio: inst.bio, initials: inst.initials, photoUrl: inst.photoUrl, isLead: inst.isLead }}
                onSave={i => updateInstructor(inst.id, i)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="bg-white rounded-xl p-4 flex items-start gap-4" style={{ border: '1px solid #E3D9F7' }}>
                {inst.photoUrl ? (
                  <img src={inst.photoUrl} alt={inst.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#EDE6FF] text-[#6B40A8] font-bold text-xs flex items-center justify-center shrink-0">
                    {inst.initials || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#190F30]">{inst.name || <span className="text-[#C4B4E4]">Unnamed</span>}</span>
                    {inst.isLead && <Star size={11} className="text-[#9C7CE0] fill-[#9C7CE0]/30" />}
                  </div>
                  <div className="text-xs text-[#7548B8] mt-0.5">{inst.role}</div>
                  {inst.bio && <p className="text-xs text-[#9980BF] mt-1.5 leading-relaxed">{inst.bio}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditingId(inst.id)} className="p-1.5 rounded hover:bg-[#EDE6FF] transition-colors">
                    <Pencil size={14} className="text-[#8B73B3]" />
                  </button>
                  <button onClick={() => deleteInstructor(inst.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <InstructorForm initial={BLANK} onSave={addInstructor} onCancel={() => setAdding(false)} />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm text-[#9C7CE0] hover:text-[#6B40A8] hover:bg-[#EDE6FF] transition-colors"
            style={{ border: '1.5px dashed #C4B4E4' }}
          >
            <Plus size={15} />
            Add instructor
          </button>
        )}
      </div>
    </div>
  )
}
