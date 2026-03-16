'use client'

import { useEffect, useState, useCallback } from 'react'

interface MemoryEntry {
  pattern: string
  fix: { type: string; symbolName?: string }
  errorType: string
  strategy: string
  usageCount: number
  lastUsed: number
  createdAt: number
}

interface MemoryStats {
  totalFixes: number
  maxFixes: number
  totalUsage: number
  topPatterns: Array<{ pattern: string; usageCount: number; lastUsed: number }>
}

export default function RepairMemoryPage() {
  const [fixes, setFixes] = useState<MemoryEntry[]>([])
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/repair-memory')
      const json = await res.json()
      if (json.success) {
        setFixes(json.data.fixes)
        setStats(json.data.stats)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteFix(pattern: string) {
    await fetch('/api/repair-memory', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern }),
    })
    load()
  }

  async function clearAll() {
    setClearing(true)
    await fetch('/api/repair-memory', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearAll: true }),
    })
    setClearing(false)
    load()
  }

  function timeAgo(ts: number): string {
    const diff = Date.now() - ts
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return `${Math.floor(diff / 86_400_000)}d ago`
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Repair Memory</h1>
          <p className="text-sm text-gray-400 mt-1">
            Stored fix patterns — reused before invoking AI
          </p>
        </div>
        <button
          onClick={clearAll}
          disabled={clearing || fixes.length === 0}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg transition"
        >
          {clearing ? 'Clearing...' : 'Clear All'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Stored Fixes', value: `${stats.totalFixes} / ${stats.maxFixes}` },
            { label: 'Total Usage', value: stats.totalUsage.toLocaleString() },
            { label: 'AI Calls Saved', value: stats.totalUsage.toLocaleString() },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Fix table */}
      <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-sm font-medium text-white">
            {loading ? 'Loading...' : `${fixes.length} stored fix pattern(s)`}
          </p>
        </div>

        {fixes.length === 0 && !loading ? (
          <div className="px-4 py-12 text-center text-gray-500 text-sm">
            No fixes stored yet. Fixes are learned automatically as apps are repaired.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-white/10">
                <th className="px-4 py-2">Pattern</th>
                <th className="px-4 py-2">Fix Type</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-right">Uses</th>
                <th className="px-4 py-2 text-right">Last Used</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {fixes.map(entry => (
                <tr key={entry.pattern} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-300 max-w-xs truncate">
                    {entry.pattern}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-gray-300">
                      {entry.fix.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{entry.errorType}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${entry.usageCount > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                      {entry.usageCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {entry.lastUsed ? timeAgo(entry.lastUsed) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteFix(entry.pattern)}
                      className="text-xs text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
