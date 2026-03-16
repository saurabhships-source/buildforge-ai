'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Info, ChevronDown, ChevronUp, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentEvent } from '@/lib/agent-events'

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

function StatusIcon({ status }: { status: AgentEvent['status'] }) {
  if (status === 'success') return <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
  if (status === 'error')   return <XCircle className="h-3 w-3 text-red-500 shrink-0" />
  if (status === 'running') return <Loader2 className="h-3 w-3 text-blue-500 shrink-0 animate-spin" />
  return <Info className="h-3 w-3 text-muted-foreground shrink-0" />
}

interface Props {
  events: AgentEvent[]
  isRunning: boolean
  className?: string
}

export function AgentActivityFeed({ events, isRunning, className }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [maxVisible, setMaxVisible] = useState(20)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest event
  useEffect(() => {
    if (expanded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length, expanded])

  const visible = events.slice(-maxVisible)

  return (
    <div className={cn('border border-border/50 rounded-lg bg-card/30 overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 border-b border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Radio className={cn('h-3.5 w-3.5', isRunning ? 'text-green-500 animate-pulse' : 'text-muted-foreground')} />
          <span className="text-xs font-semibold">AI Activity Feed</span>
          {isRunning && (
            <span className="text-[10px] text-green-500 font-medium">● LIVE</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{events.length} events</span>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="max-h-52 overflow-y-auto">
          {events.length === 0 ? (
            <div className="px-3 py-4 text-center text-[10px] text-muted-foreground">
              {isRunning ? 'Waiting for agent events...' : 'No activity yet. Start a build to see live agent updates.'}
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {visible.map((event) => (
                <div key={event.id} className="flex items-start gap-2 px-3 py-1.5 hover:bg-muted/30 transition-colors">
                  <StatusIcon status={event.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px]">{AGENT_ICONS[event.agent] ?? '🤖'}</span>
                      <span className={cn('text-[10px] font-semibold', AGENT_COLORS[event.agent] ?? 'text-foreground')}>
                        {event.agent}Agent
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">{event.action}</span>
                    </div>
                    {event.file && (
                      <div className="text-[9px] text-muted-foreground/70 font-mono mt-0.5 truncate">
                        → {event.file}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 shrink-0 tabular-nums">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
          {events.length > maxVisible && (
            <button
              onClick={() => setMaxVisible(v => v + 20)}
              className="w-full py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors border-t border-border/30"
            >
              Show more ({events.length - maxVisible} hidden)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
