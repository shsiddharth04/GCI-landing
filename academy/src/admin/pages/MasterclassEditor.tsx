import { useState } from 'react'
import { loadSettings, saveSettings } from '../settings'
import type { MasterclassSettings } from '../settings'
import { useToast } from '../components/Toast'

const FIELD_LABEL = 'text-xs font-medium text-[#8B73B3] mb-1.5 block'
const INPUT = 'w-full bg-[#F9F6FF] border border-[#D4C6EF] focus:border-[#9C7CE0] rounded-xl px-4 py-3 text-sm text-[#190F30] placeholder-[#C4B4E4] outline-none transition-colors'
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

  const slotsPerDay = form.scheduleOpenTime && form.scheduleCloseTime && form.slotMinutes
    ? Math.floor(
        (parseInt(form.scheduleCloseTime) * 60 + parseInt(form.scheduleCloseTime.split(':')[1] || '0') -
         (parseInt(form.scheduleOpenTime) * 60 + parseInt(form.scheduleOpenTime.split(':')[1] || '0'))) / form.slotMinutes
      )
    : null

  return (
    <div className="p-8 max-w-2xl">
      <ToastEl />
      <h1 className="text-xl font-semibold text-[#190F30] mb-1">Masterclass</h1>
      <p className="text-sm text-[#8B73B3] mb-8">1-on-1 in-studio sessions. Bookings managed through the slot calendar.</p>

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
            <span className="text-sm font-medium text-[#190F30]">Accepting bookings</span>
          </label>
        </div>

        {/* Fee */}
        <section className="bg-white border border-[#E3D9F7] rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-[#7548B8] uppercase tracking-widest">Pricing</h2>
          <div>
            <label className={FIELD_LABEL}>Session fee (₹)</label>
            <input
              className={INPUT}
              placeholder="e.g. 179"
              value={form.fee}
              onChange={e => set('fee', e.target.value)}
            />
            <p className="text-xs text-[#B5A3D4] mt-1.5">Credited toward the course fee on enrollment.</p>
          </div>
        </section>

        {/* Slot schedule */}
        <section className="bg-white border border-[#E3D9F7] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#7548B8] uppercase tracking-widest">Slot schedule</h2>
            {slotsPerDay !== null && slotsPerDay > 0 && (
              <span className="text-[10px] font-mono text-[#B5A3D4]">
                ~{slotsPerDay} slots/day
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={FIELD_LABEL}>First slot starts</label>
              <input
                type="time"
                className={INPUT}
                value={form.scheduleOpenTime}
                onChange={e => set('scheduleOpenTime', e.target.value)}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Last slot ends by</label>
              <input
                type="time"
                className={INPUT}
                value={form.scheduleCloseTime}
                onChange={e => set('scheduleCloseTime', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={FIELD_LABEL}>Slot duration (minutes)</label>
              <input
                type="number"
                min={15}
                step={15}
                className={INPUT}
                value={form.slotMinutes}
                onChange={e => set('slotMinutes', Number(e.target.value))}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Max bookings per slot</label>
              <input
                type="number"
                min={1}
                className={INPUT}
                value={form.slotCapacity}
                onChange={e => set('slotCapacity', Number(e.target.value))}
              />
              <p className="text-xs text-[#C4B4E4] mt-1.5">Currently 1-on-1 → set to 1.</p>
            </div>
          </div>
          <div>
            <label className={FIELD_LABEL}>Days ahead to show on booking calendar</label>
            <input
              type="number"
              min={1}
              max={60}
              className={INPUT}
              value={form.scheduleDaysAhead}
              onChange={e => set('scheduleDaysAhead', Number(e.target.value))}
            />
          </div>
        </section>

        {/* Venue */}
        <section className="bg-white border border-[#E3D9F7] rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-[#7548B8] uppercase tracking-widest">Venue</h2>
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
            <p className="text-xs text-[#B5A3D4] mt-1.5">Google Maps → Share → Embed a map → copy the src URL.</p>
          </div>
        </section>

        {/* Content */}
        <section className="bg-white border border-[#E3D9F7] rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-[#7548B8] uppercase tracking-widest">What's inside</h2>
          <div>
            <label className={FIELD_LABEL}>Description shown on the booking page</label>
            <textarea
              className={TEXTAREA}
              rows={4}
              placeholder="What will the student do in this session?"
              value={form.whatsInside}
              onChange={e => set('whatsInside', e.target.value)}
            />
          </div>
        </section>

        <button
          type="submit"
          className="bg-[#6B40A8] hover:bg-[#5C358A] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Save masterclass settings
        </button>
      </form>
    </div>
  )
}
