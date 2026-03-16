'use client'

import { useEffect, useRef } from 'react'
import { CheckCircle2, Loader2, Brain } from 'lucide-react'

export interface ThinkingEvent {
  agent: string
  message: string
  timestamp: string
  done?: boolean
}

interface Props {
  events: ThinkingEvent[]
  isStreaming: boolean
}

const AGENT_META: Record<string, { icon: string; color: string; label: string }> = {
  planner:   { icon: '🧠', color: 'text-violet-400',  label: 'PlannerAgent' },
  ui:        { icon: '🎨', color: 'text-indigo-400',  label: 'UIAgent' },
  style:     { icon: '✨', color: 'text-cyan-400',    label: 'StyleAgent' },
  script:    { icon: '⚡', color: 'text-yellow-400',  label: 'ScriptAgent' },
  seo:       { icon: '🔍', color: 'text-emerald-400', label: 'SEOAgent' },
  debugger:  { icon: '🔧', color: 'text-red-400',     label: 'DebuggerAgent' },
  optimizer: { icon: '🚀', color: 'text-orange-400',  label: 'OptimizerAgent' },
}

export function AIThinkingPanel({ events, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  if (events.length === 0 && !isStreaming) return null

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-foreground">AI Thinking</span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-[10px] text-violet-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating...
          </div>
        )}
      </div>

      <div className="max-h-48 overflow-y-auto p-2 space-y-1.5">
        {events.map((ev, i) => {
          const meta = AGENT_META[ev.agent] ?? { icon: '🤖', color: 'text-gray-400', label: ev.agent }
          const isLast = i === events.length - 1 && isStreaming
          return (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-[11px] transition-all ${
                isLast
                  ? 'border border-violet-500/20 bg-violet-500/5'
                  : 'bg-muted/30'
              }`}
            >
              <span className="text-sm leading-none mt-0.5">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <span className={`font-bold ${meta.color}`}>{meta.label}</span>
                <span className="text-muted-foreground ml-1.5">{ev.message}</span>
              </div>
              {ev.done
                ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                : isLast
                ? <Loader2 className="h-3 w-3 text-violet-500 animate-spin shrink-0 mt-0.5" />
                : <CheckCircle2 className="h-3 w-3 text-emerald-500/60 shrink-0 mt-0.5" />
              }
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
