import { useEffect, useState } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { fetchMasterclassBookings, fetchCourseCallbacks } from '../../lib/db'
import type { MasterclassBooking, CourseCallback } from '../../lib/db'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function fmtDateHeader(d: string) {
  const date = new Date(d + 'T00:00:00')
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const label = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  if (d === today) return `Today · ${label}`
  if (d === tomorrow) return `Tomorrow · ${label}`
  return label
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function groupByDate(bookings: MasterclassBooking[]): [string, MasterclassBooking[]][] {
  const map: Record<string, MasterclassBooking[]> = {}
  for (const b of bookings) {
    if (!map[b.slot_date]) map[b.slot_date] = []
    map[b.slot_date].push(b)
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
}

function downloadCSV(bookings: MasterclassBooking[]) {
  const header = ['Date', 'Start', 'End', 'Name', 'Email', 'Phone', 'Status', 'Booked at']
  const lines = bookings.map(b => [
    b.slot_date,
    fmt12(b.slot_start_time),
    fmt12(b.slot_end_time),
    b.name, b.email, b.phone, b.status,
    new Date(b.created_at).toLocaleString('en-IN'),
  ].map(v => `"${v}"`).join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `masterclass-bookings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#141414] border border-white/8 px-5 py-4 flex-1 min-w-0">
      <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">{label}</div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-white/25 mt-1">{sub}</div>}
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20',
    waitlisted: 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  }
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 border ${styles[status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
      {status}
    </span>
  )
}

function BookingDateGroup({ date, bookings }: { date: string; bookings: MasterclassBooking[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const isPast = date < today
  return (
    <div className={isPast ? 'opacity-50' : ''}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">{fmtDateHeader(date)}</span>
        <span className="text-[10px] font-mono text-white/20">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </span>
        {isPast && <span className="text-[9px] font-mono text-white/15 uppercase tracking-wider">past</span>}
      </div>
      <div className="border border-white/6 overflow-hidden mb-5">
        {bookings.map((b, i) => (
          <div
            key={b.id}
            className={`flex items-start gap-4 px-4 py-3.5 ${i < bookings.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}
          >
            {/* Time slot */}
            <div className="shrink-0 w-[120px]">
              <div className="font-mono text-xs text-white/70 tabular-nums">
                {fmt12(b.slot_start_time)}
              </div>
              <div className="font-mono text-[10px] text-white/25 tabular-nums">
                → {fmt12(b.slot_end_time)}
              </div>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/85 truncate">{b.name}</div>
              <div className="text-xs text-white/30 truncate">{b.email}</div>
            </div>

            {/* Phone */}
            <div className="shrink-0 font-mono text-xs text-white/45 hidden sm:block">
              {b.phone}
            </div>

            {/* Status */}
            <div className="shrink-0">
              <StatusChip status={b.status} />
            </div>

            {/* Booked at */}
            <div className="shrink-0 text-[10px] font-mono text-white/20 w-[56px] text-right hidden md:block">
              {relativeTime(b.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [bookings, setBookings] = useState<MasterclassBooking[]>([])
  const [callbacks, setCallbacks] = useState<CourseCallback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [showAllBookings, setShowAllBookings] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [b, c] = await Promise.all([
        fetchMasterclassBookings(),
        fetchCourseCallbacks(),
      ])
      setBookings(b)
      setCallbacks(c)
      setLastFetched(new Date())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const today = new Date().toISOString().slice(0, 10)
  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const waitlisted = bookings.filter(b => b.status === 'waitlisted')
  const todayConfirmed = confirmed.filter(b => b.slot_date === today)
  const upcomingConfirmed = confirmed.filter(b => b.slot_date >= today)

  const displayedBookings = showAllBookings
    ? bookings
    : bookings.filter(b => b.slot_date >= today)

  const grouped = groupByDate(displayedBookings)

  return (
    <div className="p-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-xs text-white/30 font-mono mt-0.5">
            {lastFetched
              ? `Updated ${lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
              : loading ? 'Loading…' : '—'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs border border-white/10 hover:border-white/20 text-white/40 hover:text-white/70 px-3 py-2 transition-colors disabled:opacity-30"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-px mb-8 overflow-x-auto">
        <StatCard label="Today" value={todayConfirmed.length} sub="confirmed slots" />
        <StatCard label="Upcoming" value={upcomingConfirmed.length} sub="confirmed" />
        <StatCard label="Waitlisted" value={waitlisted.filter(b => b.slot_date >= today).length} sub="pending" />
        <StatCard label="Callbacks" value={callbacks.length} sub="DJ course leads" />
      </div>

      {/* ── Masterclass Bookings ─────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white/80">Masterclass Bookings</h2>
            <span className="text-[10px] font-mono text-white/25 bg-white/5 px-2 py-0.5">
              {displayedBookings.length} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            {bookings.length > 0 && (
              <button
                onClick={() => downloadCSV(bookings)}
                className="flex items-center gap-1.5 text-[11px] font-mono border border-white/8 hover:border-white/18 text-white/30 hover:text-white/60 px-2.5 py-1.5 transition-colors"
              >
                <Download size={11} />
                CSV
              </button>
            )}
            <button
              onClick={() => setShowAllBookings(v => !v)}
              className={`text-[11px] font-mono px-2.5 py-1.5 border transition-colors ${
                showAllBookings
                  ? 'border-[#E8DEFA]/30 text-[#E8DEFA]/70 bg-[#E8DEFA]/5'
                  : 'border-white/8 text-white/30 hover:border-white/18 hover:text-white/60'
              }`}
            >
              {showAllBookings ? 'Upcoming only' : 'Show all'}
            </button>
          </div>
        </div>

        {/* Column labels */}
        {grouped.length > 0 && (
          <div className="flex items-center gap-4 px-4 mb-2">
            <span className="text-[9px] font-mono text-white/18 uppercase tracking-widest w-[120px]">Slot</span>
            <span className="text-[9px] font-mono text-white/18 uppercase tracking-widest flex-1">Name · Email</span>
            <span className="text-[9px] font-mono text-white/18 uppercase tracking-widest hidden sm:block w-[96px]">Phone</span>
            <span className="text-[9px] font-mono text-white/18 uppercase tracking-widest w-[80px]">Status</span>
            <span className="text-[9px] font-mono text-white/18 uppercase tracking-widest hidden md:block w-[56px] text-right">Booked</span>
          </div>
        )}

        {!loading && grouped.length === 0 && (
          <div className="text-center py-12 text-white/20 text-sm border border-white/5">
            {showAllBookings ? 'No bookings yet.' : 'No upcoming bookings.'}
          </div>
        )}

        {grouped.map(([date, slots]) => (
          <BookingDateGroup key={date} date={date} bookings={slots} />
        ))}
      </div>

      {/* ── DJ Course Callbacks ──────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-white/80">DJ Course — Callbacks</h2>
          <span className="text-[10px] font-mono text-white/25 bg-white/5 px-2 py-0.5">
            {callbacks.length} lead{callbacks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {!loading && callbacks.length === 0 && (
          <div className="text-center py-12 text-white/20 text-sm border border-white/5">
            No callbacks yet.
          </div>
        )}

        {callbacks.length > 0 && (
          <div className="border border-white/6 overflow-hidden">
            <div className="grid grid-cols-[2rem_1fr_130px_80px_100px] gap-0 px-4 py-2.5 border-b border-white/6">
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">#</span>
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Name · Phone</span>
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest hidden sm:block">Phone</span>
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Type</span>
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest text-right">Received</span>
            </div>
            {callbacks.map((c, i) => (
              <div
                key={c.id}
                className={`grid grid-cols-[2rem_1fr_130px_80px_100px] gap-0 px-4 py-3 hover:bg-white/[0.02] transition-colors ${
                  i < callbacks.length - 1 ? 'border-b border-white/4' : ''
                }`}
              >
                <span className="font-mono text-xs text-white/20">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/80 truncate">{c.name}</div>
                  <div className="text-xs font-mono text-white/30 sm:hidden">{c.phone}</div>
                </div>
                <span className="font-mono text-xs text-white/40 hidden sm:block self-center">{c.phone}</span>
                <span className="self-center">
                  <span className={`text-[10px] font-mono px-2 py-0.5 ${
                    c.is_masters_union
                      ? 'bg-[#E8DEFA]/10 text-[#E8DEFA]/70 border border-[#E8DEFA]/15'
                      : 'bg-white/5 text-white/30 border border-white/8'
                  }`}>
                    {c.is_masters_union ? "MU" : "Non-MU"}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-white/25 text-right self-center">
                  {relativeTime(c.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
