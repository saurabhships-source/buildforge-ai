'use client'

import { useEffect, useState } from 'react'
import { Star, Download, Tag, Search } from 'lucide-react'
import type { MarketplaceTemplate } from '@/lib/services/template-marketplace'

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([])
  const [sort, setSort] = useState<'downloads' | 'rating' | 'newest'>('downloads')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cloning, setCloning] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/templates?sort=${sort}`)
      .then(r => r.json())
      .then(j => { if (j.success) setTemplates(j.data) })
      .finally(() => setLoading(false))
  }, [sort])

  const filtered = templates.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
  )

  const clone = async (id: string) => {
    setCloning(id)
    await fetch(`/api/templates/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clone' }),
    })
    setCloning(null)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Template Marketplace</h1>
            <p className="text-gray-400 mt-1">Clone, remix, and publish SaaS templates</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-9 pr-4 py-2 bg-gray-800 text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 w-56"
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              className="bg-gray-800 text-white text-sm rounded-xl px-3 py-2 outline-none"
            >
              <option value="downloads">Most Downloaded</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-white/10 rounded-xl p-5 animate-pulse h-44" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="bg-gray-900 border border-white/10 rounded-xl p-5 hover:border-indigo-500/40 transition flex flex-col gap-3">
                <div>
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      {t.rating > 0 ? t.rating.toFixed(1) : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />{t.downloads}
                    </span>
                  </div>
                  <button
                    onClick={() => clone(t.id)}
                    disabled={cloning === t.id}
                    className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition"
                  >
                    {cloning === t.id ? 'Cloning...' : 'Clone'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
