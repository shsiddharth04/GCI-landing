import { useEffect, useState, useMemo } from 'react'
import { RefreshCw, Download, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface EnrollmentRow {
  id: string
  razorpay_order_id: string
  razorpay_payment_id: string | null
  status: 'pending' | 'paid' | 'failed'
  amount: number
  created_at: string
  course_enrollments: {
    id: string
    name: string
    email: string
    phone: string
    is_masters_union: boolean
    deposit_status: 'pending' | 'paid' | 'failed' | 'cancelled'
    created_at: string
  } | null
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
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
  paid:      'bg-emerald-50 text-emerald-700',
  pending:   'bg-amber-50 text-amber-700',
  failed:    'bg-red-50 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function CourseEnrollments() {
  const [rows, setRows] = useState<EnrollmentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed' | 'cancelled'>('all')
  const [monthFilter, setMonthFilter] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  const monthOptions = useMemo(() => getMonthOptions(), [])

  async function fetchRows() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('course_payments')
        .select(`
          id, razorpay_order_id, razorpay_payment_id, status, amount, created_at,
          course_enrollments!enrollment_id (
            id, name, email, phone, is_masters_union, deposit_status, created_at
          )
        `)
        .order('created_at', { ascending: false })
      if (err) throw err
      setRows((data ?? []) as unknown as EnrollmentRow[])
      setLastFetched(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load enrollments')
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
        p.course_enrollments?.name.toLowerCase().includes(q) ||
        p.course_enrollments?.email.toLowerCase().includes(q) ||
        p.course_enrollments?.phone.includes(q) ||
        p.razorpay_payment_id?.toLowerCase().includes(q) ||
        p.razorpay_order_id.toLowerCase().includes(q)
      )
    }
    return r
  }, [rows, statusFilter, monthFilter, search])

  const totalPaid = useMemo(
    () => filtered.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    [filtered]
  )

  async function downloadInvoice(enrollmentId: string, paymentId: string) {
    setDownloading(paymentId)
    try {
      const { data, error: urlErr } = await supabase.storage
        .from('invoices')
        .createSignedUrl(`course-deposit-${enrollmentId}.pdf`, 3600)
      if (urlErr || !data?.signedUrl) {
        alert('Invoice not available for this payment.')
        return
      }
      window.open(data.signedUrl, '_blank')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0E0918]">Enrollments</h1>
          <p className="text-sm text-[#0E0918]/50 mt-0.5">
            DJ Course seat deposits
            {lastFetched && (
              <span className="ml-2 font-mono text-[10px]">
                · updated {lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchRows}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E8DEFA] text-sm text-[#0E0918]/70 hover:text-[#0E0918] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total enrollments', value: String(filtered.length) },
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
          {(['all', 'paid', 'pending', 'failed', 'cancelled'] as const).map(s => (
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
          placeholder="Search name, email, phone, payment ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white border border-[#E8DEFA]/60 rounded-lg px-3 py-2 text-xs text-[#0E0918] placeholder-[#0E0918]/30 focus:outline-none focus:border-[#E8DEFA] w-72"
        />
      </div>

      {/* Error */}
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
                {['Student', 'Deposit', 'Payment date', 'Status', 'References', 'Invoice'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono font-semibold text-[#0E0918]/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#0E0918]/30">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#0E0918]/30">
                    No enrollments found
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => {
                  const e = p.course_enrollments
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-[#E8DEFA]/20 hover:bg-[#F3EEFF]/40 transition-colors ${
                        i === filtered.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      {/* Student */}
                      <td className="px-4 py-3">
                        {e ? (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-[#0E0918]">{e.name}</p>
                              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wider ${
                                e.is_masters_union
                                  ? 'bg-[#E8DEFA] text-[#0E0918]'
                                  : 'bg-[#0E0918]/6 text-[#0E0918]/40'
                              }`}>
                                {e.is_masters_union ? '[MU]' : '[Non-MU]'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#0E0918]/45 mt-0.5">{e.email}</p>
                            <p className="text-[11px] font-mono text-[#0E0918]/35">{e.phone}</p>
                          </>
                        ) : (
                          <span className="text-[#0E0918]/30 italic text-xs">enrollment deleted</span>
                        )}
                      </td>

                      {/* Deposit */}
                      <td className="px-4 py-3 font-mono font-semibold text-[#0E0918] whitespace-nowrap">
                        INR {(p.amount / 100).toFixed(2)}
                      </td>

                      {/* Payment date */}
                      <td className="px-4 py-3 text-xs text-[#0E0918]/60 whitespace-nowrap">
                        {fmtDateTime(p.created_at)}
                      </td>

                      {/* Status — shows payment status; enrollment deposit_status shown as sub-label when they differ */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusColors[p.status] ?? 'bg-gray-50 text-gray-500'}`}>
                          {p.status}
                        </span>
                        {e && e.deposit_status !== p.status && (
                          <p className="text-[9px] font-mono text-[#0E0918]/30 mt-1 uppercase tracking-wider">
                            enroll: {e.deposit_status}
                          </p>
                        )}
                      </td>

                      {/* References */}
                      <td className="px-4 py-3 text-[10px] font-mono text-[#0E0918]/45 max-w-[180px]">
                        <p className="truncate" title={p.razorpay_order_id}>
                          <span className="text-[#0E0918]/30">order </span>{p.razorpay_order_id}
                        </p>
                        {p.razorpay_payment_id && (
                          <p className="truncate mt-0.5" title={p.razorpay_payment_id}>
                            <span className="text-[#0E0918]/30">pay </span>{p.razorpay_payment_id}
                          </p>
                        )}
                      </td>

                      {/* Invoice */}
                      <td className="px-4 py-3">
                        {p.status === 'paid' && e ? (
                          <button
                            onClick={() => downloadInvoice(e.id, p.id)}
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
        Read-only. To correct a record, use the Supabase dashboard directly.
      </p>
    </div>
  )
}
