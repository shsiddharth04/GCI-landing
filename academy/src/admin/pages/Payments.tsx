import { useEffect, useState, useMemo } from 'react'
import { RefreshCw, Download, FileText, Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface PaymentRow {
  id: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  payment_method: 'razorpay' | 'cash'
  status: 'pending' | 'paid' | 'failed'
  amount: number
  invoice_number: string | null
  created_at: string
  masterclass_bookings: {
    id: string
    name: string
    email: string
    phone: string
    slot_date: string
    slot_start_time: string
    slot_end_time: string
  } | null
}

interface WalkinForm {
  slot_date: string
  slot_start: string
  name: string
  email: string
  phone: string
  note: string
}

const EMPTY_FORM: WalkinForm = { slot_date: '', slot_start: '', name: '', email: '', phone: '', note: '' }

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function fmtDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function todayISO() {
  return new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD in local time
}

function getSlotOptions(): { value: string; label: string }[] {
  const opts = []
  for (let h = 10; h < 22; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const value = `${hh}:${mm}`
      opts.push({ value, label: fmt12(value) })
    }
  }
  return opts
}

function getMonthOptions(): { value: string; label: string }[] {
  const opts = [{ value: '', label: 'All time' }]
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    opts.push({ value, label })
  }
  return opts
}

const statusColors: Record<string, string> = {
  paid:    'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed:  'bg-red-50 text-red-600',
}

const slotOptions = getSlotOptions()

export default function Payments() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all')
  const [monthFilter, setMonthFilter] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  // Walk-in form state
  const [showWalkin, setShowWalkin] = useState(false)
  const [walkin, setWalkin] = useState<WalkinForm>(EMPTY_FORM)
  const [walkinConfirm, setWalkinConfirm] = useState(false)
  const [walkinLoading, setWalkinLoading] = useState(false)
  const [walkinError, setWalkinError] = useState<string | null>(null)
  const [walkinPartial, setWalkinPartial] = useState<{ booking_id: string; invoice_number: string } | null>(null)
  const [resendLoading, setResendLoading] = useState(false)

  const monthOptions = useMemo(() => getMonthOptions(), [])

  async function fetchRows() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('masterclass_payments')
        .select(`
          id, razorpay_order_id, razorpay_payment_id, payment_method,
          status, amount, invoice_number, created_at,
          masterclass_bookings!masterclass_booking_id (
            id, name, email, phone, slot_date, slot_start_time, slot_end_time
          )
        `)
        .order('created_at', { ascending: false })
      if (err) throw err
      setRows((data ?? []) as unknown as PaymentRow[])
      setLastFetched(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRows() }, [])

  const filtered = useMemo(() => {
    let r = rows
    if (statusFilter !== 'all') r = r.filter(p => p.status === statusFilter)
    if (monthFilter) r = r.filter(p => p.created_at.startsWith(monthFilter))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      r = r.filter(p =>
        p.masterclass_bookings?.name.toLowerCase().includes(q) ||
        p.masterclass_bookings?.email.toLowerCase().includes(q) ||
        p.masterclass_bookings?.phone.includes(q) ||
        p.razorpay_payment_id?.toLowerCase().includes(q) ||
        (p.razorpay_order_id ?? '').toLowerCase().includes(q) ||
        (p.invoice_number ?? '').toLowerCase().includes(q)
      )
    }
    return r
  }, [rows, statusFilter, monthFilter, search])

  const totalPaid = useMemo(
    () => filtered.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    [filtered]
  )

  async function downloadInvoice(bookingId: string, paymentId: string) {
    setDownloading(paymentId)
    try {
      const { data, error: urlErr } = await supabase.storage
        .from('invoices')
        .createSignedUrl(`invoice-${bookingId}.pdf`, 3600)
      if (urlErr || !data?.signedUrl) {
        alert('Invoice not available for this payment. It may have been generated before the invoice system was enabled.')
        return
      }
      window.open(data.signedUrl, '_blank')
    } finally {
      setDownloading(null)
    }
  }

  function resetWalkin() {
    setWalkin(EMPTY_FORM)
    setWalkinConfirm(false)
    setWalkinError(null)
    setWalkinPartial(null)
    setShowWalkin(false)
  }

  async function handleWalkinSubmit() {
    setWalkinLoading(true)
    setWalkinError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-cash-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          slot_date:  walkin.slot_date,
          slot_start: walkin.slot_start,
          name:       walkin.name,
          email:      walkin.email,
          phone:      walkin.phone,
          note:       walkin.note || undefined,
        }),
      })

      const result = await res.json()

      if (result.partial) {
        setWalkinPartial({ booking_id: result.booking_id, invoice_number: result.invoice_number })
        setWalkinError(`Booking recorded — ${result.error === 'email_failed' ? 'confirmation email failed' : 'invoice/email failed'}. Use Resend below.`)
        fetchRows()
        return
      }

      if (!result.ok || result.error) {
        setWalkinError(result.message ?? result.error ?? 'Something went wrong')
        return
      }

      resetWalkin()
      fetchRows()
    } catch (e) {
      setWalkinError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setWalkinLoading(false)
    }
  }

  async function handleResend() {
    if (!walkinPartial) return
    setResendLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-payment-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ booking_id: walkinPartial.booking_id }),
      })

      if (res.ok) {
        resetWalkin()
        fetchRows()
      } else {
        const d = await res.json()
        setWalkinError(`Resend failed: ${d.error ?? 'unknown error'}`)
      }
    } catch (e) {
      setWalkinError(e instanceof Error ? e.message : 'Resend failed')
    } finally {
      setResendLoading(false)
    }
  }

  const walkinValid = walkin.slot_date && walkin.slot_start && walkin.name.trim().length >= 2
    && walkin.email.includes('@') && walkin.phone.replace(/\D/g, '').length >= 10

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0E0918]">Payments</h1>
          <p className="text-sm text-[#0E0918]/50 mt-0.5">
            All masterclass payments
            {lastFetched && (
              <span className="ml-2 font-mono text-[10px]">
                · updated {lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowWalkin(true); setWalkin({ ...EMPTY_FORM, slot_date: todayISO() }) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0E0918] text-[#E8DEFA] text-sm font-medium hover:bg-[#1a1530] transition-colors"
          >
            <Plus size={13} />
            Walk-in
          </button>
          <button
            onClick={fetchRows}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E8DEFA] text-sm text-[#0E0918]/70 hover:text-[#0E0918] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Walk-in form panel */}
      {showWalkin && (
        <div className="bg-white rounded-xl border border-[#E8DEFA] p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-semibold text-[#0E0918]">Record walk-in cash payment</p>
              <p className="text-xs text-[#0E0918]/40 mt-0.5">Booking + ₹179 cash payment in one step</p>
            </div>
            <button onClick={resetWalkin} className="text-[#0E0918]/30 hover:text-[#0E0918] transition-colors">
              <X size={16} />
            </button>
          </div>

          {walkinError && (
            <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${walkinPartial ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {walkinError}
              {walkinPartial && (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="ml-3 underline font-medium disabled:opacity-50"
                >
                  {resendLoading ? 'Sending…' : 'Resend invoice + email'}
                </button>
              )}
            </div>
          )}

          {!walkinConfirm ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-[#0E0918]/40 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={walkin.slot_date}
                  min={todayISO()}
                  onChange={e => setWalkin(f => ({ ...f, slot_date: e.target.value }))}
                  className="w-full bg-[#F9F6FF] rounded-lg px-3 py-2 text-sm text-[#0E0918] border border-[#E8DEFA] focus:outline-none focus:border-[#9C7CE0]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#0E0918]/40 uppercase tracking-wider mb-1.5">Slot</label>
                <select
                  value={walkin.slot_start}
                  onChange={e => setWalkin(f => ({ ...f, slot_start: e.target.value }))}
                  className="w-full bg-[#F9F6FF] rounded-lg px-3 py-2 text-sm text-[#0E0918] border border-[#E8DEFA] focus:outline-none focus:border-[#9C7CE0]"
                >
                  <option value="">Select time</option>
                  {slotOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#0E0918]/40 uppercase tracking-wider mb-1.5">Student name</label>
                <input
                  type="text"
                  value={walkin.name}
                  onChange={e => setWalkin(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full bg-[#F9F6FF] rounded-lg px-3 py-2 text-sm text-[#0E0918] border border-[#E8DEFA] focus:outline-none focus:border-[#9C7CE0] placeholder-[#0E0918]/25"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#0E0918]/40 uppercase tracking-wider mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={walkin.phone}
                  onChange={e => setWalkin(f => ({ ...f, phone: e.target.value }))}
                  placeholder="10-digit mobile"
                  className="w-full bg-[#F9F6FF] rounded-lg px-3 py-2 text-sm text-[#0E0918] border border-[#E8DEFA] focus:outline-none focus:border-[#9C7CE0] placeholder-[#0E0918]/25"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#0E0918]/40 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={walkin.email}
                  onChange={e => setWalkin(f => ({ ...f, email: e.target.value }))}
                  placeholder="student@email.com"
                  className="w-full bg-[#F9F6FF] rounded-lg px-3 py-2 text-sm text-[#0E0918] border border-[#E8DEFA] focus:outline-none focus:border-[#9C7CE0] placeholder-[#0E0918]/25"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#0E0918]/40 uppercase tracking-wider mb-1.5">Note <span className="normal-case text-[#0E0918]/25">(optional)</span></label>
                <input
                  type="text"
                  value={walkin.note}
                  onChange={e => setWalkin(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. paid in full, referral"
                  className="w-full bg-[#F9F6FF] rounded-lg px-3 py-2 text-sm text-[#0E0918] border border-[#E8DEFA] focus:outline-none focus:border-[#9C7CE0] placeholder-[#0E0918]/25"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  disabled={!walkinValid}
                  onClick={() => setWalkinConfirm(true)}
                  className="px-5 py-2 rounded-lg bg-[#0E0918] text-[#E8DEFA] text-sm font-medium hover:bg-[#1a1530] disabled:opacity-40 transition-colors"
                >
                  Review →
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-[#F9F6FF] rounded-lg border border-[#E8DEFA] p-5 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ['Slot', `${fmtDate(walkin.slot_date)}, ${fmt12(walkin.slot_start)}`],
                    ['Name', walkin.name],
                    ['Email', walkin.email],
                    ['Phone', walkin.phone],
                    ['Amount', '₹179 cash'],
                    ...(walkin.note ? [['Note', walkin.note]] : []),
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] font-mono text-[#0E0918]/35 uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="font-medium text-[#0E0918]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setWalkinConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#0E0918]/50 hover:text-[#0E0918] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleWalkinSubmit}
                  disabled={walkinLoading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {walkinLoading ? 'Recording…' : 'Confirm ₹179 cash received'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total payments', value: String(filtered.length) },
          { label: 'Confirmed paid', value: String(filtered.filter(p => p.status === 'paid').length) },
          {
            label: monthFilter
              ? `Revenue — ${monthOptions.find(m => m.value === monthFilter)?.label}`
              : 'Revenue (visible)',
            value: `INR ${(totalPaid / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E8DEFA]/60 px-5 py-4">
            <p className="text-[11px] font-mono text-[#0E0918]/40 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#0E0918]">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex bg-white border border-[#E8DEFA]/60 rounded-lg overflow-hidden">
          {(['all', 'paid', 'pending', 'failed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#0E0918] text-[#E8DEFA]'
                  : 'text-[#0E0918]/50 hover:text-[#0E0918]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          className="bg-white border border-[#E8DEFA]/60 rounded-lg px-3 py-2 text-xs text-[#0E0918]/70 focus:outline-none focus:border-[#E8DEFA]"
        >
          {monthOptions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search name, email, invoice, payment ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white border border-[#E8DEFA]/60 rounded-lg px-3 py-2 text-xs text-[#0E0918] placeholder-[#0E0918]/30 focus:outline-none focus:border-[#E8DEFA] w-72"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8DEFA]/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8DEFA]/40">
                {['Student', 'Amount', 'Method', 'Payment date', 'Slot', 'Status', 'References', 'Invoice'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-[#0E0918]/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-[#0E0918]/30">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-[#0E0918]/30">
                    No payments found
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => {
                  const b = p.masterclass_bookings
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-[#E8DEFA]/20 hover:bg-[#F3EEFF]/40 transition-colors ${
                        i === filtered.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      {/* Student */}
                      <td className="px-4 py-3">
                        {b ? (
                          <>
                            <p className="font-medium text-[#0E0918]">{b.name}</p>
                            <p className="text-[11px] text-[#0E0918]/45 mt-0.5">{b.email}</p>
                            <p className="text-[11px] font-mono text-[#0E0918]/35">{b.phone}</p>
                          </>
                        ) : (
                          <span className="text-[#0E0918]/30 italic text-xs">booking deleted</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 font-mono font-semibold text-[#0E0918] whitespace-nowrap">
                        INR {(p.amount / 100).toFixed(2)}
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3">
                        {p.payment_method === 'cash' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-[#0E0918] text-[#E8DEFA]">
                            CASH
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#0E0918]/35">Razorpay</span>
                        )}
                      </td>

                      {/* Payment date */}
                      <td className="px-4 py-3 text-xs text-[#0E0918]/60 whitespace-nowrap">
                        {fmtDateTime(p.created_at)}
                      </td>

                      {/* Slot */}
                      <td className="px-4 py-3 text-xs text-[#0E0918]/60 whitespace-nowrap">
                        {b ? (
                          <>
                            <p>{fmtDate(b.slot_date)}</p>
                            <p className="font-mono text-[10px] text-[#0E0918]/40">
                              {fmt12(b.slot_start_time.slice(0, 5))} – {fmt12(b.slot_end_time.slice(0, 5))}
                            </p>
                          </>
                        ) : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusColors[p.status] ?? 'bg-gray-50 text-gray-500'}`}>
                          {p.status}
                        </span>
                      </td>

                      {/* References */}
                      <td className="px-4 py-3 text-[10px] font-mono text-[#0E0918]/45 max-w-[180px]">
                        {p.payment_method === 'cash' ? (
                          p.invoice_number ? (
                            <span className="text-[#0E0918]/45">{p.invoice_number}</span>
                          ) : (
                            <span className="text-[#0E0918]/20">—</span>
                          )
                        ) : (
                          <>
                            {p.razorpay_order_id ? (
                              <p className="truncate" title={p.razorpay_order_id}>
                                <span className="text-[#0E0918]/30">order </span>{p.razorpay_order_id}
                              </p>
                            ) : (
                              <p className="text-[#0E0918]/20">—</p>
                            )}
                            {p.razorpay_payment_id && (
                              <p className="truncate mt-0.5" title={p.razorpay_payment_id}>
                                <span className="text-[#0E0918]/30">pay </span>{p.razorpay_payment_id}
                              </p>
                            )}
                          </>
                        )}
                      </td>

                      {/* Invoice */}
                      <td className="px-4 py-3">
                        {p.status === 'paid' && b ? (
                          <button
                            onClick={() => downloadInvoice(b.id, p.id)}
                            disabled={downloading === p.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E0918] text-[#E8DEFA] text-[10px] font-medium hover:bg-[#1a1530] transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {downloading === p.id ? (
                              <RefreshCw size={10} className="animate-spin" />
                            ) : (
                              <Download size={10} />
                            )}
                            PDF
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#0E0918]/20 flex items-center gap-1">
                            <FileText size={10} />
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[#E8DEFA]/30 text-[11px] text-[#0E0918]/35">
            {filtered.length} row{filtered.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' || monthFilter || search ? ' (filtered)' : ''}
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-[#0E0918]/30">
        Razorpay rows are read-only. Cash rows are created via Walk-in above.
      </p>
    </div>
  )
}
