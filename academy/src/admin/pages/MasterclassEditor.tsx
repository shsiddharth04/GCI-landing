import { useState } from 'react'
import { loadSettings, saveSettings, MasterclassSettings } from '../settings'
import { useToast } from '../components/Toast'

const FIELD_LABEL = 'text-xs font-medium text-white/50 mb-1.5 block'
const INPUT = 'w-full bg-[#0a0a0a] border border-white/10 focus:border-[#E8DEFA]/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors'
const TEXTAREA = INPUT + ' resize-none'

export default function MasterclassEditor() {
  const stored = loadSettings()
  const [form, setForm] = useState<MasterclassSettings>(stored.masterclass)
  const { showToast, ToastEl } = useToast()

  function set<K extends keyof MasterclassSettings>(key: K, value: MasterclassSettings[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const current = loadSettings()
    saveSettings({ ...current, masterclass: form })
    showToast('Masterclass settings saved.')
  }

  return (
    <div className="p-8 max-w-2xl">
      <ToastEl />
      <h1 className="text-xl font-semibold mb-1">Masterclass</h1>
      <p className="text-sm text-white/40 mb-8">Free top-of-funnel event. No payment. Capacity-capped.</p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Status */}
        <div className="bg-[#141414] border border-white/8 rounded-2xl p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('isActive', !form.isActive)}
              className={`w-10 h-5.5 rounded-full relative transition-colors cursor-pointer ${form.isActive ? 'bg-[#E8DEFA]/30' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all ${form.isActive ? 'left-[calc(100%-1.25rem)] bg-[#E8DEFA]' : 'left-0.5 bg-white/30'}`} />
            </div>
            <span className="text-sm font-medium">Masterclass is live / accepting registrations</span>
          </label>
        </div>

        {/* Date & time */}
        <section className="bg-[#141414] border border-white/8 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">Date & time</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={FIELD_LABEL}>Date</label>
              <input
                type="date"
                className={INPUT}
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Time</label>
              <input
                type="time"
                className={INPUT}
                value={form.time}
                onChange={e => set('time', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={FIELD_LABEL}>Duration</label>
            <input
              className={INPUT}
              placeholder="e.g. 2 hours"
              value={form.duration}
              onChange={e => set('duration', e.target.value)}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Cadence</label>
            <select
              className={INPUT}
              value={form.cadence}
              onChange={e => set('cadence', e.target.value as MasterclassSettings['cadence'])}
            >
              <option value="">Select cadence</option>
              <option value="one-off">One-off event</option>
              <option value="recurring">Recurring on a schedule</option>
            </select>
          </div>
          {form.cadence === 'recurring' && (
            <div>
              <label className={FIELD_LABEL}>Recurring schedule</label>
              <input
                className={INPUT}
                placeholder="e.g. Every first Saturday of the month"
                value={form.recurringSchedule}
                onChange={e => set('recurringSchedule', e.target.value)}
              />
            </div>
          )}
        </section>

        {/* Venue */}
        <section className="bg-[#141414] border border-white/8 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">Venue</h2>
          <div>
            <label className={FIELD_LABEL}>Studio name</label>
            <input
              className={INPUT}
              placeholder="e.g. GCI Studio"
              value={form.studioName}
              onChange={e => set('studioName', e.target.value)}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Full address</label>
            <textarea
              className={TEXTAREA}
              rows={2}
              placeholder="Building, street, sector, Gurugram — PIN"
              value={form.studioAddress}
              onChange={e => set('studioAddress', e.target.value)}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Google Maps embed URL (optional)</label>
            <input
              className={INPUT}
              placeholder="https://maps.google.com/maps?..."
              value={form.mapEmbedUrl}
              onChange={e => set('mapEmbedUrl', e.target.value)}
            />
            <p className="text-xs text-white/25 mt-1.5">Get this from Google Maps → Share → Embed a map → copy the src URL.</p>
          </div>
        </section>

        {/* Capacity */}
        <section className="bg-[#141414] border border-white/8 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">Capacity</h2>
          <div>
            <label className={FIELD_LABEL}>Seat cap (hard limit)</label>
            <input
              type="number"
              min={1}
              className={INPUT}
              placeholder="e.g. 30"
              value={form.seatCap || ''}
              onChange={e => set('seatCap', Number(e.target.value))}
            />
            <p className="text-xs text-white/25 mt-1.5">Registrations beyond this cap go to the waitlist.</p>
          </div>
        </section>

        {/* Content */}
        <section className="bg-[#141414] border border-white/8 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">What's inside</h2>
          <div>
            <label className={FIELD_LABEL}>What's covered (shown on the registration page)</label>
            <textarea
              className={TEXTAREA}
              rows={4}
              placeholder="Bullet points or a paragraph describing what attendees will learn / experience."
              value={form.whatsInside}
              onChange={e => set('whatsInside', e.target.value)}
            />
          </div>
        </section>

        <button
          type="submit"
          className="bg-[#E8DEFA] hover:bg-[#d4c8f0] text-[#0a0a0a] font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Save masterclass settings
        </button>
      </form>
    </div>
  )
}
