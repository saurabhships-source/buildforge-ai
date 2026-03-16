'use client'

import { useState, useEffect } from 'react'
import { GitBranch, RotateCcw, Tag, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { versionControl } from '@/lib/services/version-control'
import type { VersionCommit } from '@/lib/services/version-control'

interface Props {
  projectId: string
  files: Record<string, string>
  onRestore: (files: Record<string, string>, commit: VersionCommit) => void
}

export function VersionHistoryPanel({ projectId, files, onRestore }: Props) {
  const [history, setHistory] = useState<VersionCommit[]>([])
  const [expanded, setExpanded] = useState(false)
  const [tagInput, setTagInput] = useState<Record<string, string>>({})

  useEffect(() => {
    if (projectId) {
      setHistory(versionControl.getHistory(projectId))
    }
  }, [projectId, files])

  const handleSaveVersion = () => {
    if (!projectId || Object.keys(files).length === 0) {
      toast.error('No project to save')
      return
    }
    const commit = versionControl.commit(projectId, files, `Manual save — ${new Date().toLocaleTimeString()}`)
    setHistory(versionControl.getHistory(projectId))
    toast.success(`Version ${commit.versionNum} saved`)
  }

  const handleRestore = (commit: VersionCommit) => {
    const restored = versionControl.restore(commit.id)
    if (!restored) { toast.error('Failed to restore version'); return }
    onRestore(restored, commit)
    toast.success(`Restored to v${commit.versionNum}`)
  }

  const handleTag = (commitId: string) => {
    const tag = tagInput[commitId]?.trim()
    if (!tag) return
    versionControl.tag(commitId, tag)
    setHistory(versionControl.getHistory(projectId))
    setTagInput(prev => { const n = { ...prev }; delete n[commitId]; return n })
    toast.success(`Tagged as "${tag}"`)
  }

  return (
    <div className="border-t border-border/30">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <GitBranch className="h-3 w-3" />
          Version History
          {history.length > 0 && (
            <Badge variant="secondary" className="text-[9px] h-3.5 px-1 ml-1">{history.length}</Badge>
          )}
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-2 pb-2 space-y-1.5">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-6 text-[10px] gap-1"
            onClick={handleSaveVersion}
            disabled={Object.keys(files).length === 0}
          >
            <GitBranch className="h-2.5 w-2.5" />
            Save Snapshot
          </Button>

          {history.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">No versions yet. Save a snapshot to start tracking.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {history.map(commit => (
                <div key={commit.id} className="rounded-lg border border-border/30 bg-muted/20 p-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-primary">v{commit.versionNum}</span>
                        {commit.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[9px] h-3.5 px-1">{tag}</Badge>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{commit.message}</p>
                    </div>
                    <button
                      onClick={() => handleRestore(commit)}
                      className="shrink-0 p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="Restore this version"
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    <Clock className="h-2 w-2" />
                    <span>{new Date(commit.timestamp).toLocaleTimeString()}</span>
                    <span>·</span>
                    <span>{commit.stats.filesChanged} files</span>
                    {commit.stats.additions > 0 && <span className="text-green-500">+{commit.stats.additions}</span>}
                    {commit.stats.deletions > 0 && <span className="text-red-500">-{commit.stats.deletions}</span>}
                  </div>

                  {/* Tag input */}
                  <div className="flex gap-1">
                    <input
                      value={tagInput[commit.id] ?? ''}
                      onChange={e => setTagInput(prev => ({ ...prev, [commit.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleTag(commit.id) }}
                      placeholder="Add tag..."
                      className="flex-1 px-1.5 py-0.5 text-[9px] rounded bg-background border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => handleTag(commit.id)}
                      className="px-1.5 py-0.5 text-[9px] rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    >
                      <Tag className="h-2 w-2" />
                    </button>
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
