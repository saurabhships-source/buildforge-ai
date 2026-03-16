'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, RotateCcw, Copy, GitFork, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PromptHistoryEntry {
  id: string
  prompt: string
  model: string
  resultSummary?: string
  versionId?: string
  createdAt: string
}

interface Props {
  projectId: string | null
  onRestoreVersion?: (versionId: string) => void
  onReusePrompt?: (prompt: string) => void
  onForkFromPrompt?: (prompt: string) => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString()
}

export function PromptHistoryPanel({ projectId, onRestoreVersion, onReusePrompt, onForkFromPrompt }: Props) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<PromptHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHistory = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/prompt-history`)
      if (res.ok) {
        const data = await res.json()
        setEntries(Array.isArray(data) ? data : [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [projectId])

  useEffect(() => {
    if (open && projectId) fetchHistory()
  }, [open, projectId, fetchHistory])

  if (!projectId) return null

  return (
    <div className="border-t border-border/30">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Prompt History
          {entries.length > 0 && (
            <span className="px-1 py-0.5 rounded bg-muted text-[9px]">{entries.length}</span>
          )}
        </span>
        {open ? <ChevronUp className="h-3 w-3 opacity-50" /> : <ChevronDown className="h-3 w-3 opacity-50" />}
      </button>

      {open && (
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-4 px-3">
              No prompt history yet. Generate something to start tracking.
            </p>
          ) : (
            <div className="space-y-0.5 px-2 pb-2">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="group rounded-lg border border-border/30 bg-muted/20 hover:bg-muted/40 p-2 transition-colors"
                >
                  <p className="text-[10px] font-medium text-foreground line-clamp-2 leading-relaxed">
                    {entry.prompt}
                  </p>
                  {entry.resultSummary && (
                    <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{entry.resultSummary}</p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] text-muted-foreground">{formatDate(entry.createdAt)}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {entry.versionId && onRestoreVersion && (
                        <button
                          onClick={() => { onRestoreVersion(entry.versionId!); toast.success('Version restored') }}
                          title="Restore version"
                          className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                        </button>
                      )}
                      {onForkFromPrompt && (
                        <button
                          onClick={() => onForkFromPrompt(entry.prompt)}
                          title="Fork from this prompt"
                          className="p-1 rounded hover:bg-violet-500/10 text-muted-foreground hover:text-violet-400 transition-colors"
                        >
                          <GitFork className="h-2.5 w-2.5" />
                        </button>
                      )}
                      <button
                        onClick={() => { navigator.clipboard.writeText(entry.prompt); toast.success('Copied') }}
                        title="Copy prompt"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="h-2.5 w-2.5" />
                      </button>
                      {onReusePrompt && (
                        <button
                          onClick={() => onReusePrompt(entry.prompt)}
                          title="Reuse prompt"
                          className="p-1 rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-colors text-[9px] font-medium px-1.5"
                        >
                          Use
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
