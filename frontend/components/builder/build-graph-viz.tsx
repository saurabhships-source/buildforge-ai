'use client'

import { CheckCircle2, XCircle, Loader2, SkipForward, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { NodeStatus } from '@/lib/build-graph/types'

export interface GraphNode {
  id: string
  type: string
  label: string
  status: NodeStatus
  dependencies: string[]
  durationMs?: number
  description?: string
}

const AGENT_ICONS: Record<string, string> = {
  planner: '🧠', architect: '🏛️', builder: '🏗️', debugger: '🐛',
  optimizer: '⚡', tester: '🧪', ui: '🎨', ux: '♿', seo: '🔍', security: '🔒',
}

const STATUS_STYLES: Record<NodeStatus, string> = {
  completed: 'border-green-500/50 bg-green-500/10 text-green-600',
  failed:    'border-red-500/50 bg-red-500/10 text-red-600',
  running:   'border-blue-500/50 bg-blue-500/10 text-blue-600',
  skipped:   'border-border/30 bg-muted/20 text-muted-foreground',
  pending:   'border-border/50 bg-card text-muted-foreground',
}

function NodeStatusIcon({ status }: { status: NodeStatus }) {
  if (status === 'completed') return <CheckCircle2 className="h-3 w-3 text-green-500" />
  if (status === 'failed')    return <XCircle className="h-3 w-3 text-red-500" />
  if (status === 'running')   return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
  if (status === 'skipped')   return <SkipForward className="h-3 w-3 text-muted-foreground" />
  return <Clock className="h-3 w-3 text-muted-foreground" />
}

/** Build a level-ordered layout from the dependency graph */
function computeLevels(nodes: GraphNode[]): GraphNode[][] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const inDegree = new Map(nodes.map(n => [n.id, 0]))
  const dependents = new Map<string, string[]>(nodes.map(n => [n.id, []]))

  for (const node of nodes) {
    for (const dep of node.dependencies) {
      inDegree.set(node.id, (inDegree.get(node.id) ?? 0) + 1)
      dependents.get(dep)?.push(node.id)
    }
  }

  const levels: GraphNode[][] = []
  let ready = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0)

  while (ready.length > 0) {
    levels.push(ready)
    const next: GraphNode[] = []
    for (const node of ready) {
      for (const depId of dependents.get(node.id) ?? []) {
        const newDeg = (inDegree.get(depId) ?? 1) - 1
        inDegree.set(depId, newDeg)
        if (newDeg === 0) {
          const n = nodeMap.get(depId)
          if (n) next.push(n)
        }
      }
    }
    ready = next
  }

  return levels
}

interface Props {
  nodes: GraphNode[]
  className?: string
}

export function BuildGraphViz({ nodes, className }: Props) {
  const [expanded, setExpanded] = useState(true)
  const levels = computeLevels(nodes)
  const completedCount = nodes.filter(n => n.status === 'completed').length
  const runningCount = nodes.filter(n => n.status === 'running').length

  return (
    <div className={cn('border border-border/50 rounded-lg bg-card/30 overflow-hidden', className)}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 border-b border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Build Graph</span>
          {runningCount > 0 && (
            <span className="text-[10px] text-blue-500 font-medium flex items-center gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />{runningCount} running
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{completedCount}/{nodes.length}</span>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 overflow-x-auto">
          <div className="flex flex-col gap-2 min-w-max">
            {levels.map((level, li) => (
              <div key={li} className="flex flex-col gap-1">
                {/* Connector from previous level */}
                {li > 0 && (
                  <div className="flex justify-center">
                    <div className="w-px h-3 bg-border/50" />
                  </div>
                )}
                {/* Nodes at this level */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {level.map(node => (
                    <div
                      key={node.id}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all min-w-[90px]',
                        STATUS_STYLES[node.status]
                      )}
                      title={node.description ?? node.label}
                    >
                      <span>{AGENT_ICONS[node.type] ?? '🤖'}</span>
                      <NodeStatusIcon status={node.status} />
                      <span className="truncate max-w-[80px]">{node.type}</span>
                      {node.durationMs && node.durationMs > 0 && (
                        <span className="text-[9px] opacity-60 tabular-nums ml-auto">
                          {(node.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
