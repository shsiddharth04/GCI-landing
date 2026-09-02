import { useEffect, useState } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Registration } from '../../lib/db'

interface RegistrationRow extends Registration {
  session_date?: string
  session_type?: string
  start_time?: string
}

function downloadCSV(rows: RegistrationRow[]) {
  const header = ['Name', 'Email', 'Phone', 'Status', 'Session date', 'Session type', 'Registered at']
  const lines = rows.map(r => [
    r.name,
    r.email,
    r.phone,
    r.status,
    r.session_date ?? '',
    r.session_type ?? '',
    new Date(r.created_at).toLocaleString('en-IN'),
  ].map(v => `"${v}"`).join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const statusColors: Record<string, string> = {
  confirmed:  'bg-emerald-50 text-emerald-700',
  waitlisted: 'bg-amber-50 text-amber-700',
  cancelled:  'bg-red-50 text-red-600',
}

export default function Registrations() {
  const [rows, setRows] = useState<RegistrationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  async function fetchRows() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('registrations')
        .select('*, sessions(session_date, session_type, start_time)')
        .order('created_at', { ascending: false })
      if (err) throw err
      const mapped = (data ?? []).map((r: unknown) => {
        const row = r as Registration & { sessions?: Record<string, string> | null }
        return {
          ...row,
          session_date: row.sessions?.session_date,
          session_type: row.sessions?.session_type,
          start_time:   row.sessions?.start_time,
        }
      })
      setRows(mapped)
      setLastFetched(new Date())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load registrations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRows() }, [])

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#190F30]">Registrations</h1>
          <p className="text-sm text-[#B5A3D4] mt-0.5">
            {lastFetched
              ? `${rows.length} entries · ${lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading…'}
          </p>
        </div>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <button
              onClick={() => downloadCSV(rows)}
              className="flex items-center gap-2 text-xs text-[#8B73B3] hover:text-[#6B40A8] px-3 py-2 rounded-lg transition-colors bg-white"
              style={{ border: '1px solid #D4C6EF' }}
            >
              <Download size={13} />
              Export CSV
            </button>
          )}
          <button
            onClick={fetchRows}
            disabled={loading}
            className="flex items-center gap-2 text-xs text-[#8B73B3] hover:text-[#6B40A8] px-3 py-2 rounded-lg transition-colors disabled:opacity-40 bg-white"
            style={{ border: '1px solid #D4C6EF' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="mt-8 text-center py-16 text-[#B5A3D4] text-sm">No registrations yet.</div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 bg-white overflow-hidden rounded-xl" style={{ border: '1px solid #E3D9F7' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F0EAFF' }}>
                <th className="text-left text-xs font-medium text-[#C4B4E4] font-mono px-5 py-3.5">#</th>
                <th className="text-left text-xs font-medium text-[#C4B4E4] font-mono px-4 py-3.5">Name</th>
                <th className="text-left text-xs font-medium text-[#C4B4E4] font-mono px-4 py-3.5">Phone</th>
                <th className="text-left text-xs font-medium text-[#C4B4E4] font-mono px-4 py-3.5">Session</th>
                <th className="text-left text-xs font-medium text-[#C4B4E4] font-mono px-4 py-3.5">Status</th>
                <th className="text-left text-xs font-medium text-[#C4B4E4] font-mono px-4 py-3.5">Registered</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-[#F9F6FF] transition-colors" style={i < rows.length - 1 ? { borderBottom: '1px solid #F0EAFF' } : {}}>
                  <td className="px-5 py-3.5 font-mono text-xs text-[#C4B4E4]">{i + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-[#190F30]">{r.name}</div>
                    <div className="text-xs text-[#9980BF]">{r.email}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-[#8B73B3]">{r.phone}</td>
                  <td className="px-4 py-3.5 text-xs text-[#8B73B3]">
                    {r.session_date
                      ? <>
                          <div>{new Date(r.session_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="text-[#B5A3D4] font-mono">{r.session_type}</div>
                        </>
                      : <span className="text-[#C4B4E4]">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${statusColors[r.status] ?? 'bg-[#F0EAFF] text-[#8B73B3]'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#B5A3D4] font-mono">
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
