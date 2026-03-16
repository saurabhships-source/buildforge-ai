'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react'

export interface StreamStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'done'
  message?: string
}

const STEP_ORDER = ['auth', 'planning', 'agent', 'blueprint', 'database', 'backend', 'frontend', 'generating', 'parsing', 'styling', 'scripts', 'saving', 'preview']

const STEP_LABELS: Record<string, string> = {
  auth: 'Authenticating',
  planning: 'Planning architecture',
  agent: 'Selecting agent',
  blueprint: 'Analyzing idea',
  database: 'Designing database',
  backend: 'Generating backend',
  frontend: 'Generating frontend',
  generating: 'Generating UI',
  parsing: 'Parsing files',
  styling: 'Writing styles',
  scripts: 'Connecting scripts',
  saving: 'Saving project',
  preview: 'Rendering preview',
}

interface Props {
  steps: StreamStep[]
  isStreaming: boolean
  fileCount: number
  className?: string
}

export function GenerationProgress({ steps, isStreaming, fileCount, className }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps])

  if (!isStreaming && steps.length === 0) return null

  const activeStep = steps.find(s => s.status === 'active')
  const doneCount = steps.filter(s => s.status === 'done').length
  const totalSteps = STEP_ORDER.length
  const progress = Math.round((doneCount / totalSteps) * 100)

  return (
    <div className={cn('flex flex-col gap-2 px-3 py-2.5 bg-card/60 border border-border/50 rounded-xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-foreground">
            {isStreaming ? (activeStep?.message ?? 'Generating...') : 'Generation complete'}
          </span>
        </div>
        {fileCount > 0 && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {fileCount} file{fileCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${isStreaming ? Math.max(progress, 5) : 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-1">
        {STEP_ORDER.map(stepId => {
          const step = steps.find(s => s.id === stepId)
          const status = step?.status ?? 'pending'
          const label = step?.message ?? STEP_LABELS[stepId] ?? stepId

          return (
            <div key={stepId} className={cn('flex items-center gap-2 text-[10px] transition-all duration-200',
              status === 'done' ? 'text-muted-foreground' :
              status === 'active' ? 'text-foreground font-medium' :
              'text-muted-foreground/40'
            )}>
              {status === 'done' ? (
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
              ) : status === 'active' ? (
                <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
              ) : (
                <Circle className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{label}</span>
            </div>
          )
        })}
      </div>
      <div ref={endRef} />
    </div>
  )
}

// Hook to consume the SSE stream from /api/generate/stream
export interface StreamEvent {
  type: 'progress' | 'file_update' | 'complete' | 'error' | 'thinking'
  step?: string
  message?: string
  file?: string
  content?: string
  files?: Record<string, string>
  entrypoint?: string
  description?: string
  agent?: string
  model?: string
  projectId?: string | null
  versionId?: string | null
  versionNum?: number
  error?: string
}

export async function* consumeGenerationStream(
  body: Record<string, unknown>,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const res = await fetch('/api/generate/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Server ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6)) as StreamEvent
          yield event
        } catch { /* malformed line */ }
      }
    }
  }
}
