// Model Usage Metrics — tracks success/error rates and latency per model
// Used by the router to make smarter fallback decisions

import type { ModelUsageMetric } from './types'

const STORAGE_KEY = 'buildforge_model_metrics'

function loadMetrics(): Record<string, ModelUsageMetric> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveMetrics(metrics: Record<string, ModelUsageMetric>): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics)) } catch { /* quota */ }
}

export const modelMetrics = {
  record(modelId: string, provider: string, latencyMs: number, success: boolean, error?: string): void {
    const metrics = loadMetrics()
    const existing = metrics[modelId] ?? {
      modelId, provider, successCount: 0, errorCount: 0,
      totalLatencyMs: 0, avgLatencyMs: 0, lastUsed: '', lastError: undefined,
    }
    if (success) existing.successCount++
    else { existing.errorCount++; existing.lastError = error }
    existing.totalLatencyMs += latencyMs
    existing.avgLatencyMs = existing.totalLatencyMs / (existing.successCount + existing.errorCount)
    existing.lastUsed = new Date().toISOString()
    metrics[modelId] = existing
    saveMetrics(metrics)
  },

  getAll(): ModelUsageMetric[] {
    return Object.values(loadMetrics())
  },

  get(modelId: string): ModelUsageMetric | null {
    return loadMetrics()[modelId] ?? null
  },

  /** Returns models sorted by reliability (success rate desc, latency asc) */
  getRanked(): ModelUsageMetric[] {
    return Object.values(loadMetrics()).sort((a, b) => {
      const rateA = a.successCount / Math.max(1, a.successCount + a.errorCount)
      const rateB = b.successCount / Math.max(1, b.successCount + b.errorCount)
      if (rateB !== rateA) return rateB - rateA
      return a.avgLatencyMs - b.avgLatencyMs
    })
  },

  clear(): void {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  },
}

// Server-side in-memory metrics (resets on restart)
const serverMetrics: Record<string, ModelUsageMetric> = {}

export const serverModelMetrics = {
  record(modelId: string, provider: string, latencyMs: number, success: boolean, error?: string): void {
    const existing = serverMetrics[modelId] ?? {
      modelId, provider, successCount: 0, errorCount: 0,
      totalLatencyMs: 0, avgLatencyMs: 0, lastUsed: '', lastError: undefined,
    }
    if (success) existing.successCount++
    else { existing.errorCount++; existing.lastError = error }
    existing.totalLatencyMs += latencyMs
    existing.avgLatencyMs = existing.totalLatencyMs / (existing.successCount + existing.errorCount)
    existing.lastUsed = new Date().toISOString()
    serverMetrics[modelId] = existing
  },

  getAll(): ModelUsageMetric[] {
    return Object.values(serverMetrics)
  },

  getSuccessRate(modelId: string): number {
    const m = serverMetrics[modelId]
    if (!m) return 1 // assume good if no data
    return m.successCount / Math.max(1, m.successCount + m.errorCount)
  },
}
