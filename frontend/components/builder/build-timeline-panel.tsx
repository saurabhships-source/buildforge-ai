'use client'

import { useState } from 'react'
import {
  Clock, ChevronDown, ChevronUp, RotateCcw, GitBranch,
  CheckCircle2, XCircle, Loader2, SkipForward, FilePlus,
  FileEdit, Trash2, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BuildRun, TimelineStep, NodeStatus } from '@/lib/build-graph/types'
import { replayToSnapshot } from '@/lib/build-graph/timeline'

const AGENT_ICONS: Record<string, string> = {
  planner:   '🧠',
  architect: '🏛️',
  builder:   '🏗️',
  debugger:  '🐛',
  optimizer: '⚡',
  tester:    '🧪',
  ui:        '🎨',
  ux:        '♿',
  seo:       '🔍',
  security:  '🔒',
}

const AGENT_COLORS: Record<string, string> = {
  planner:   'text-violet-500',
  architect: 'text-blue-500',
  builder:   'text-indigo-500',
  debugger:  'text-red-500',
  optimizer: 'text-yellow-500',
  tester:    'text-green-500',
  ui:        'text-pink-500',
  ux:        'text-purple-500',
  seo:       'text-cyan-500',
  security:  'text-orange-500',
}

function StepStatusIcon({ status }: { status: NodeStatus }) {
  if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
  if (status === 'failed')    return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
  if (status === 'running')   return <Loader2 className="h-3.5 w-3.5 text-blue-500 shrink-0 animate-spin" />
  if (status === 'skipped')   return <SkipForward className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  return <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
}

interface StepRowProps {
  step: TimelineStep
  isActive: boolean
  isReplaying: boolean
  onReplay: (step: TimelineStep) => void
  onBranch: (step: TimelineStep) => void
}

function StepRow({ step, isActive, isReplaying, onReplay, onBranch }: StepRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChanges = step.filesAdded.length + step.filesChanged.length + step.filesDeleted.length > 0

  return (
    <div className={cn(
      'border-l-2 pl-3 py-1.5 transition-colors',
      isActive
        ? 'border-primary bg-primary/5'
        : 'border-border/40 hover:border-primary/40 hover:bg-muted/20'
    )}>
      <div className="flex items-start gap-2">
        {/* Step number */}
        <span className="text-[9px] font-mono text-muted-foreground/60 w-5 shrink-0 mt-0.5 tabular-nums">
          {step.stepNum}
        </span>

        <StepStatusIcon status={step.status} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px]">{AGENT_ICONS[step.agent] ?? '🤖'}</span>
            <span className={cn('text-[10px] font-semibold', AGENT_COLORS[step.agent] ?? 'text-foreground')}>
              {step.agent}Agent
            </span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {step.description}
            </span>
          </div>

          {/* File change summary */}
          {hasChanges && (
            <div className="flex items-center gap-2 mt-0.5">
              {step.filesAdded.length > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-green-500">
                  <FilePlus className="h-2.5 w-2.5" />+{step.filesAdded.length}
                </span>
              )}
              {step.filesChanged.length > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-blue-500">
                  <FileEdit className="h-2.5 w-2.5" />~{step.filesChanged.length}
                </span>
              )}
              {step.filesDeleted.length > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-red-500">
                  <Trash2 className="h-2.5 w-2.5" />-{step.filesDeleted.length}
                </span>
              )}
              {step.durationMs > 0 && (
                <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                  {(step.durationMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          )}

          {/* Expanded file list */}
          {expanded && hasChanges && (
            <div className="mt-1 space-y-0.5 pl-1">
              {step.filesAdded.map(f => (
                <div key={f} className="flex items-center gap-1 text-[9px] text-green-500 font-mono">
                  <span>+</span><span className="truncate">{f}</span>
                </div>
              ))}
              {step.filesChanged.map(f => (
                <div key={f} className="flex items-center gap-1 text-[9px] text-blue-500 font-mono">
                  <span>~</span><span className="truncate">{f}</span>
                </div>
              ))}
              {step.filesDeleted.map(f => (
                <div key={f} className="flex items-center gap-1 text-[9px] text-red-500 font-mono">
                  <span>-</span><span className="truncate">{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {hasChanges && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Show changed files"
            >
              <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
            </button>
          )}
          <button
            onClick={() => onReplay(step)}
            disabled={isReplaying}
            className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
            title="Restore project to this step"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            onClick={() => onBranch(step)}
            disabled={isReplaying}
            className="text-muted-foreground hover:text-violet-500 transition-colors disabled:opacity-40"
            title="Branch new build from this step"
          >
            <GitBranch className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  runs: BuildRun[]
  activeStepId: string | null
  isReplaying: boolean
  onReplayStep: (files: Record<string, string>, step: TimelineStep, run: BuildRun) => void
  onBranchFromStep: (files: Record<string, string>, step: TimelineStep, run: BuildRun) => void
  onClearRuns: () => void
}

export function BuildTimelinePanel({
  runs,
  activeStepId,
  isReplaying,
  onReplayStep,
  onBranchFromStep,
  onClearRuns,
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const [selectedRunIdx, setSelectedRunIdx] = useState(0)

  const activeRun = runs[selectedRunIdx] ?? null

  const handleReplay = (step: TimelineStep) => {
    if (!activeRun) return
    const files = replayToSnapshot(activeRun, step.snapshotId)
    onReplayStep(files, step, activeRun)
  }

  const handleBranch = (step: TimelineStep) => {
    if (!activeRun) return
    const files = replayToSnapshot(activeRun, step.snapshotId)
    onBranchFromStep(files, step, activeRun)
  }

  if (runs.length === 0) return null

  return (
    <div className="border-t border-border/50 bg-card/20">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span className="uppercase tracking-wider">Build Timeline</span>
          {activeRun && (
            <Badge variant="outline" className="text-[9px] h-4 ml-1">
              {activeRun.steps.length} steps
            </Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-2 pb-2 space-y-2">
          {/* Run selector (if multiple runs) */}
          {runs.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {runs.slice(0, 5).map((run, i) => (
                <button
                  key={run.buildId}
                  onClick={() => setSelectedRunIdx(i)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all',
                    selectedRunIdx === i
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/50 text-muted-foreground hover:border-primary/30'
                  )}
                >
                  Run {runs.length - i}
                </button>
              ))}
            </div>
          )}

          {/* Run metadata */}
          {activeRun && (
            <div className="flex items-center justify-between text-[9px] text-muted-foreground px-1">
              <span className="truncate max-w-[140px]" title={activeRun.prompt}>
                {activeRun.prompt.slice(0, 40)}{activeRun.prompt.length > 40 ? '…' : ''}
              </span>
              <span className="shrink-0 tabular-nums">
                {(activeRun.totalDurationMs / 1000).toFixed(1)}s · {activeRun.mode}
              </span>
            </div>
          )}

          {/* Steps */}
          {activeRun && (
            <div className="space-y-0.5 max-h-64 overflow-y-auto pr-0.5">
              {activeRun.steps.map(step => (
                <StepRow
                  key={step.id}
                  step={step}
                  isActive={step.id === activeStepId}
                  isReplaying={isReplaying}
                  onReplay={handleReplay}
                  onBranch={handleBranch}
                />
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] text-muted-foreground">
              Click <RotateCcw className="h-2.5 w-2.5 inline" /> to restore · <GitBranch className="h-2.5 w-2.5 inline" /> to branch
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[9px] text-muted-foreground hover:text-destructive px-1"
              onClick={onClearRuns}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
