/**
 * Generator Feedback Store — in-memory store for generator improvement insights.
 * Tracks patterns, their impact, frequency, and quality score.
 * LRU eviction at 500 entries.
 */

import { logger } from '@/lib/core/logger'

export type GeneratorTarget = 'frontend' | 'backend' | 'database' | 'all'
export type PatternImpact = 'positive' | 'negative'

export interface FeedbackEntry {
  id: string
  pattern: string           // e.g. "missing-error-handling-in-api-routes"
  description: string
  impact: PatternImpact
  frequency: number         // how many times seen
  avgScore: number          // average project score when this pattern appears
  target: GeneratorTarget   // which generator to improve
  suggestion: string        // what the generator should do differently
  lastSeen: string
  createdAt: string
}

const MAX_ENTRIES = 500
const store = new Map<string, FeedbackEntry>()

let idCounter = 0

function makeId() {
  return `fb-${Date.now()}-${++idCounter}`
}

export const generatorFeedback = {
  /** Record a new feedback observation */
  record(
    pattern: string,
    description: string,
    impact: PatternImpact,
    target: GeneratorTarget,
    suggestion: string,
    projectScore: number,
  ): FeedbackEntry {
    const existing = store.get(pattern)
    if (existing) {
      existing.frequency++
      existing.avgScore = (existing.avgScore * (existing.frequency - 1) + projectScore) / existing.frequency
      existing.lastSeen = new Date().toISOString()
      return existing
    }

    // Evict oldest if at capacity
    if (store.size >= MAX_ENTRIES) {
      const oldest = [...store.entries()].sort((a, b) =>
        new Date(a[1].lastSeen).getTime() - new Date(b[1].lastSeen).getTime()
      )[0]
      if (oldest) store.delete(oldest[0])
    }

    const entry: FeedbackEntry = {
      id: makeId(),
      pattern,
      description,
      impact,
      frequency: 1,
      avgScore: projectScore,
      target,
      suggestion,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    store.set(pattern, entry)
    logger.info('system', `Generator feedback recorded: ${pattern}`, suggestion)
    return entry
  },

  /** Get all feedback entries sorted by frequency */
  getAll(): FeedbackEntry[] {
    return [...store.values()].sort((a, b) => b.frequency - a.frequency)
  },

  /** Get top negative patterns (most impactful issues) */
  getTopIssues(limit = 10): FeedbackEntry[] {
    return [...store.values()]
      .filter(e => e.impact === 'negative')
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
  },

  /** Get top positive patterns to reinforce */
  getTopPositive(limit = 10): FeedbackEntry[] {
    return [...store.values()]
      .filter(e => e.impact === 'positive')
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
  },

  /** Get feedback for a specific generator */
  getForTarget(target: GeneratorTarget): FeedbackEntry[] {
    return [...store.values()].filter(e => e.target === target || e.target === 'all')
  },

  stats() {
    const all = [...store.values()]
    return {
      total: all.length,
      positive: all.filter(e => e.impact === 'positive').length,
      negative: all.filter(e => e.impact === 'negative').length,
      topPattern: all.sort((a, b) => b.frequency - a.frequency)[0]?.pattern ?? 'none',
    }
  },

  clear() {
    store.clear()
  },
}
