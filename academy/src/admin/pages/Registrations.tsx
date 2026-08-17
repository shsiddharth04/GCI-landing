import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { RefreshCw, Download } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface WaitlistEntry {
  id: string
  full_name: string
  city: string
  phone: string
  role: string
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  music_artist: 'Artist',
  music_enthusiast: 'Enthusiast',
}

function downloadCSV(rows: WaitlistEntry[]) {
  const header = ['Name', 'City', 'Phone', 'Role', 'Signed up']
  const lines = rows.map(r => [
    r.full_name,
    r.city,
    r.phone,
    ROLE_LABEL[r.role] || r.role,
    new Date(r.created_at).toLocaleString('en-IN'),
  ].map(v => `"${v}"`).join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `academy-registrations-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Registrations() {
  const [rows, setRows] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY

  async function fetchRows() {
    if (!isConfigured) return
    setLoading(true)
    setError(null)
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { data, error: err } = await sb
        .from('academy_waitlist')
        .select('*')
        .order('created_at', { ascending: false })
      if (err) throw err
      setRows(data ?? [])
      setLastFetched(new Date())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load registrations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRows() }, [])

  if (!isConfigured) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-xl font-semibold mb-1">Registrations</h1>
        <p className="text-sm text-white/40 mb-8">Waitlist entries from the academy landing page.</p>
        <div className="bg-[#141414] border border-white/8 rounded-2xl p-6">
          <p className="text-sm text-white/50 mb-3">Supabase is not configured. Add these to your <code className="font-mono text-xs bg-white/8 px-1.5 py-0.5 rounded">.env</code> file:</p>
          <pre className="text-xs font-mono text-[#E8DEFA]/70 bg-[#0a0a0a] rounded-xl p-4 leading-relaxed">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold">Registrations</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {lastFetched ? `${rows.length} entries · fetched ${lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Loading…'}
          </p>
        </div>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <button
              onClick={() => downloadCSV(rows)}
              className="flex items-center gap-2 text-xs border border-white/10 hover:border-white/20 text-white/50 hover:text-white/80 px-3 py-2 rounded-lg transition-colors"
            >
              <Download size={13} />
              Export CSV
            </button>
          )}
          <button
            onClick={fetchRows}
            disabled={loading}
            className="flex items-center gap-2 text-xs border border-white/10 hover:border-white/20 text-white/50 hover:text-white/80 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="mt-8 text-center py-16 text-white/25 text-sm">No registrations yet.</div>
      )}

      {rows.length > 0 && (
        <div className="mt-6 bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6">
                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">#</th>
                <th className="text-left text-xs font-medium text-white/30 px-4 py-3.5">Name</th>
                <th className="text-left text-xs font-medium text-white/30 px-4 py-3.5">City</th>
                <th className="text-left text-xs font-medium text-white/30 px-4 py-3.5">Phone</th>
                <th className="text-left text-xs font-medium text-white/30 px-4 py-3.5">Role</th>
                <th className="text-left text-xs font-medium text-white/30 px-4 py-3.5">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-white/4 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-white/25">{i + 1}</td>
                  <td className="px-4 py-3.5 font-medium text-white/80">{r.full_name}</td>
                  <td className="px-4 py-3.5 text-white/45">{r.city}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-white/45">{r.phone}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-[#E8DEFA]/10 text-[#E8DEFA]/70 px-2 py-0.5 rounded-full">
                      {ROLE_LABEL[r.role] || r.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-white/35 font-mono">
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
