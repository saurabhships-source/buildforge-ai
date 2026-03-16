'use client'

import { useState } from 'react'
import { Clock, RotateCcw, Tag, GitBranch } from 'lucide-react'
import { versionControl } from '@/lib/services/version-control'
import type { VersionCommit } from '@/lib/services/version-control'

interface ProjectHistoryProps {
  projectId: string
  onRestore: (files: Record<string, string>, commitId: string) => void
}

export function ProjectHistory({ projectId, onRestore }: ProjectHistoryProps) {
  const history = versionControl.getHistory(projectId)
  const [restoring, setRestoring] = useState<string | null>(null)

  const handleRestore = async (commit: VersionCommit) => {
    setRestoring(commit.id)
    const files = versionControl.restore(commit.id)
    if (files) onRestore(files, commit.id)
    setRestoring(null)
  }

  function timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime()
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return `${Math.floor(diff / 86_400_000)}d ago`
  }

  if (history.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 text-sm">
        No version history yet. Versions are created automatically when you make changes.
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      {history.map((commit, i) => (
        <div
          key={commit.id}
          className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition"
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center mt-1">
            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-400' : 'bg-gray-600'}`} />
            {i < history.length - 1 && <div className="w-px flex-1 bg-gray-700 mt-1 min-h-[20px]" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500">v{commit.versionNum}</span>
              {commit.tags.map(tag => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-indigo-600/20 text-indigo-400">
                  {tag}
                </span>
              ))}
              {i === 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-600/20 text-green-400">current</span>
              )}
            </div>
            <p className="text-sm text-gray-300 mt-0.5 truncate">{commit.message}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{timeAgo(commit.timestamp)}
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="w-3 h-3" />{commit.stats.filesChanged} files
              </span>
            </div>
          </div>

          {i > 0 && (
            <button
              onClick={() => handleRestore(commit)}
              disabled={restoring === commit.id}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-indigo-600/30 text-gray-400 hover:text-indigo-300 transition"
            >
              <RotateCcw className="w-3 h-3" />
              {restoring === commit.id ? 'Restoring...' : 'Restore'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
