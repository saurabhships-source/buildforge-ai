'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Search, Trash2, RotateCcw, TrendingUp, X } from 'lucide-react'
import { promptHistory, type PromptHistoryEntry } from '@/lib/prompt-history'
import { toast } from 'sonner'

export default function PromptHistoryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<PromptHistoryEntry[]>([])
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'recent' | 'popular'>('recent')

  useEffect(() => {
    setEntries(promptHistory.getAll())
  }, [])

  const filtered = query.trim()
    ? entries.filter(e => e.prompt.toLowerCase().includes(query.toLowerCase()))
    : tab === 'popular'
      ? [...entries].sort((a, b) => b.usedCount - a.usedCount)
      : entries

  function handleReuse(entry: PromptHistoryEntry) {
    router.push(`/dashboard/builder?prompt=${encodeURIComponent(entry.prompt)}`)
  }

  function handleDelete(id: string) {
    promptHistory.delete(id)
    setEntries(promptHistory.getAll())
    toast.success('Removed')
  }

  function handleClearAll() {
    promptHistory.clear()
    setEntries([])
    toast.success('History cleared')
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Prompt History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{entries.length} prompts saved</p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg border border-destructive/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search prompts..."
          className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      {!query && (
        <div className="flex gap-1 mb-4 p-1 bg-muted/30 rounded-lg w-fit">
          <button
            onClick={() => setTab('recent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'recent' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Clock className="h-3.5 w-3.5" /> Recent
          </button>
          <button
            onClick={() => setTab('popular')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'popular' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <TrendingUp className="h-3.5 w-3.5" /> Most Used
          </button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{query ? 'No results found' : 'No prompts yet'}</p>
          <p className="text-sm mt-1">
            {query ? 'Try a different search term' : 'Generate your first app to start building history'}
          </p>
          {!query && (
            <button
              onClick={() => router.push('/dashboard/builder')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Open Builder
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <div
              key={entry.id}
              className="group flex items-start gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2">{entry.prompt}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                  {entry.projectName && (
                    <span className="text-xs text-muted-foreground">→ {entry.projectName}</span>
                  )}
                  {entry.usedCount > 1 && (
                    <span className="text-xs text-primary/70">used {entry.usedCount}×</span>
                  )}
                  {entry.appType && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted/50 rounded text-muted-foreground capitalize">{entry.appType}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => handleReuse(entry)}
                  title="Reuse prompt"
                  className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  title="Delete"
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
