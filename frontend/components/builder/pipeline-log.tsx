'use client'

import { CheckCircle2, XCircle, Loader2, Clock, SkipForward } from 'lucide-react'
import type { PipelineStep } from '@/lib/ai-engine/orchestrator'

const AGENT_LABELS: Record<string, string> = {
  builder: '🏗️ BuilderAgent',
  debug: '🐛 DebugAgent',
  ui: '🎨 UIAgent',
  ux: '♿ UXAgent',
  refactor: '♻️ RefactorAgent',
  security: '🔒 SecurityAgent',
  deploy: '🚀 DeployAgent',
  github: '🐙 GitHubAgent',
  seo: '🔍 SEOAgent',
  performance: '⚡ PerformanceAgent',
  startup: '🚀 StartupAgent',
}

function StepIcon({ status }: { status: PipelineStep['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
  if (status === 'running') return <Loader2 className="h-4 w-4 text-blue-500 shrink-0 animate-spin" />
  if (status === 'skipped') return <SkipForward className="h-4 w-4 text-muted-foreground shrink-0" />
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
}

interface Props {
  steps: PipelineStep[]
  isRunning: boolean
}

export function PipelineLog({ steps, isRunning }: Props) {
  const completed = steps.filter(s => s.status === 'completed').length
  const total = steps.filter(s => s.status !== 'skipped').length

  return (
    <div className="border border-border/50 rounded-lg bg-card/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-card/50">
        <span className="text-xs font-medium">Autonomous Pipeline</span>
        {isRunning ? (
          <span className="text-[10px] text-blue-500 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Running...
          </span>
        ) : steps.length > 0 ? (
          <span className="text-[10px] text-muted-foreground">{completed}/{total} completed</span>
        ) : null}
      </div>

      <div className="divide-y divide-border/30">
        {steps.map((step) => (
          <div key={step.agent} className="px-3 py-2 space-y-1">
            <div className="flex items-center gap-2">
              <StepIcon status={step.status} />
              <span className={`text-xs font-medium ${step.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                {AGENT_LABELS[step.agent] ?? step.agent}
              </span>
              {step.durationMs && (
                <span className="ml-auto text-[10px] text-muted-foreground">{(step.durationMs / 1000).toFixed(1)}s</span>
              )}
            </div>
            {step.description && step.status !== 'pending' && (
              <p className="text-[10px] text-muted-foreground pl-6 leading-relaxed">{step.description}</p>
            )}
            {step.changes.length > 0 && (
              <ul className="pl-6 space-y-0.5">
                {step.changes.map((c, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground">• {c}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
