import { useState } from 'react'
import { loadSettings, saveSettings, CourseSettings } from '../settings'
import { useToast } from '../components/Toast'

const FIELD_LABEL = 'text-xs font-medium text-[#8B73B3] mb-1.5 block'
const INPUT = 'w-full bg-[#F9F6FF] border border-[#D4C6EF] focus:border-[#9C7CE0] rounded-xl px-4 py-3 text-sm text-[#190F30] placeholder-[#C4B4E4] outline-none transition-colors'
const TEXTAREA = INPUT + ' resize-none'

export default function CourseEditor() {
  const stored = loadSettings()
  const [form, setForm] = useState<CourseSettings>(stored.course)
  const { showToast, ToastEl } = useToast()

  function set<K extends keyof CourseSettings>(key: K, value: CourseSettings[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const current = loadSettings()
    saveSettings({ ...current, course: form })
    showToast('Course settings saved.')
  }

  return (
    <div className="p-8 max-w-2xl">
      <ToastEl />
      <h1 className="text-xl font-semibold text-[#190F30] mb-1">Course</h1>
      <p className="text-sm text-[#8B73B3] mb-8">The paid DJ course — the revenue product.</p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Status */}
        <div className="bg-white border border-[#E3D9F7] rounded-2xl p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('isActive', !form.isActive)}
              className={`w-10 h-5.5 rounded-full relative transition-colors cursor-pointer ${form.isActive ? 'bg-[#9C7CE0]/40' : 'bg-[#D4C6EF]'}`}
            >
              <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all ${form.isActive ? 'left-[calc(100%-1.25rem)] bg-[#6B40A8]' : 'left-0.5 bg-[#B5A3D4]'}`} />
            </div>
            <span className="text-sm font-medium text-[#190F30]">Course is active / accepting enrolments</span>
          </label>
        </div>

        {/* Pricing */}
        <section className="bg-white border border-[#E3D9F7] rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-[#7548B8] uppercase tracking-widest">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={FIELD_LABEL}>Current fee (₹)</label>
              <input
                className={INPUT}
                placeholder="e.g. 22200"
                value={form.fee}
                onChange={e => set('fee', e.target.value)}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Original / crossed-out price (₹)</label>
              <input
                className={INPUT}
                placeholder="e.g. 37000"
                value={form.originalFee}
                onChange={e => set('originalFee', e.target.value)}
              />
              <p className="text-xs text-[#B5A3D4] mt-1.5">Shown struck-through alongside current fee.</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#8B73B3]">
            <input
              type="checkbox"
              checked={form.emiAvailable}
              onChange={e => set('emiAvailable', e.target.checked)}
              className="accent-[#6B40A8]"
            />
            EMI available
          </label>
          {form.emiAvailable && (
            <div>
              <label className={FIELD_LABEL}>EMI details</label>
              <input
                className={INPUT}
                placeholder="e.g. 3 × ₹4,000 via Razorpay"
                value={form.emiDetails}
                onChange={e => set('emiDetails', e.target.value)}
              />
            </div>
          )}
          <div>
            <label className={FIELD_LABEL}>Refund / cancellation policy</label>
            <textarea
              className={TEXTAREA}
              rows={2}
              placeholder="e.g. Full refund if cancelled 7+ days before batch start."
              value={form.refundPolicy}
              onChange={e => set('refundPolicy', e.target.value)}
            />
          </div>
        </section>

        {/* Batch */}
        <section className="bg-white border border-[#E3D9F7] rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-[#7548B8] uppercase tracking-widest">Batch</h2>
          <div>
            <label className={FIELD_LABEL}>Batch size</label>
            <input
              type="number"
              min={1}
              className={INPUT}
              placeholder="e.g. 3"
              value={form.seatCap || ''}
              onChange={e => set('seatCap', Number(e.target.value))}
            />
            <p className="text-xs text-[#B5A3D4] mt-1.5">Maximum students per batch.</p>
          </div>
          <div>
            <label className={FIELD_LABEL}>Schedule description</label>
            <input
              className={INPUT}
              placeholder="e.g. Weekends, 10 AM – 1 PM"
              value={form.schedule}
              onChange={e => set('schedule', e.target.value)}
            />
          </div>
        </section>

        {/* Format */}
        <section className="bg-white border border-[#E3D9F7] rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-[#7548B8] uppercase tracking-widest">Format</h2>
          <div>
            <label className={FIELD_LABEL}>Format</label>
            <select
              className={INPUT}
              value={form.format}
              onChange={e => set('format', e.target.value as CourseSettings['format'])}
            >
              <option value="">Select format</option>
              <option value="in-studio">In-studio only</option>
              <option value="hybrid">Hybrid (in-studio + online)</option>
            </select>
          </div>
          <div>
            <label className={FIELD_LABEL}>Equipment used</label>
            <input
              className={INPUT}
              placeholder="e.g. Pioneer CDJ-2000, Allen & Heath mixer"
              value={form.equipmentUsed}
              onChange={e => set('equipmentUsed', e.target.value)}
            />
          </div>
        </section>

        <button
          type="submit"
          className="bg-[#6B40A8] hover:bg-[#5C358A] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Save course settings
        </button>
      </form>
    </div>
  )
}
