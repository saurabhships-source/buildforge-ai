'use client'

import { useMemo } from 'react'
import { FileCode2, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { CodebaseGraph } from '@/lib/codebase-intelligence'

interface Props {
  graph: CodebaseGraph
}

const COMPLEXITY_COLOR = {
  low: 'text-green-500',
  medium: 'text-amber-500',
  high: 'text-red-500',
}

export function CodebaseGraphPanel({ graph }: Props) {
  const { stats, nodes } = graph
  const issueNodes = useMemo(() => nodes.filter(n => n.issues.length > 0), [nodes])
  const topFiles = useMemo(() =>
    [...nodes].sort((a, b) => b.size - a.size).slice(0, 8),
    [nodes]
  )

  return (
    <div className="space-y-3 p-3 text-xs">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-border/50 bg-card/50 p-2 text-center">
          <div className="text-lg font-bold text-foreground">{stats.totalFiles}</div>
          <div className="text-muted-foreground">Files</div>
        </div>
        <div className="rounded-md border border-border/50 bg-card/50 p-2 text-center">
          <div className="text-lg font-bold text-foreground">{stats.totalLines.toLocaleString()}</div>
          <div className="text-muted-foreground">Lines</div>
        </div>
        <div className="rounded-md border border-border/50 bg-card/50 p-2 text-center">
          <div className={`text-lg font-bold ${COMPLEXITY_COLOR[stats.complexity]}`}>
            {stats.complexity}
          </div>
          <div className="text-muted-foreground">Complexity</div>
        </div>
      </div>

      {/* Languages */}
      <div>
        <div className="flex items-center gap-1 mb-1.5 text-muted-foreground">
          <BarChart3 className="h-3 w-3" />
          <span>Languages</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(stats.languages).map(([lang, count]) => (
            <Badge key={lang} variant="outline" className="text-[10px] h-4">
              {lang} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Issues */}
      {issueNodes.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1.5 text-amber-500">
            <AlertTriangle className="h-3 w-3" />
            <span>{stats.issues} issue{stats.issues !== 1 ? 's' : ''} detected</span>
          </div>
          <div className="space-y-1">
            {issueNodes.map(n => (
              <div key={n.path} className="rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1">
                <div className="font-medium text-foreground truncate">{n.path}</div>
                {n.issues.map((issue, i) => (
                  <div key={i} className="text-amber-600">• {issue}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {issueNodes.length === 0 && (
        <div className="flex items-center gap-1.5 text-green-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>No issues detected</span>
        </div>
      )}

      {/* File list */}
      <div>
        <div className="flex items-center gap-1 mb-1.5 text-muted-foreground">
          <FileCode2 className="h-3 w-3" />
          <span>Largest files</span>
        </div>
        <div className="space-y-0.5">
          {topFiles.map(n => (
            <div key={n.path} className="flex items-center justify-between gap-2">
              <span className="truncate text-foreground">{n.path}</span>
              <span className="text-muted-foreground shrink-0">{(n.size / 1024).toFixed(1)}KB</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
