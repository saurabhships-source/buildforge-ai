// Agent Event System — lightweight pub/sub for live AI co-builder feed
// Used to stream agent activity to the UI in real time.

import type { AgentEvent } from './build-graph/types'

export type { AgentEvent }

type EventListener = (event: AgentEvent) => void

class AgentEventBus {
  private listeners: Set<EventListener> = new Set()

  subscribe(fn: EventListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  emit(event: AgentEvent): void {
    for (const fn of this.listeners) {
      try { fn(event) } catch { /* never crash the bus */ }
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

// Singleton bus — shared across the builder session
export const agentEventBus = new AgentEventBus()

export function makeEvent(
  agent: string,
  action: string,
  status: AgentEvent['status'] = 'info',
  file?: string,
  detail?: string
): AgentEvent {
  return {
    id: `${agent}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    agent,
    action,
    file,
    detail,
    timestamp: new Date().toISOString(),
    status,
  }
}
