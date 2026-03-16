/**
 * Prompt Cache — caches generated product blueprints for repeated prompts.
 * Uses normalized prompt fingerprinting to detect near-duplicates.
 */

import { logger } from '@/lib/core/logger'
import type { ProductIntent } from '@/lib/services/ai/product-intent'
import type { ProductBlueprint } from '@/lib/services/ai/product-planner'

export interface CachedBlueprint {
  intent: ProductIntent
  blueprint: ProductBlueprint
  files: Record<string, string>
  createdAt: string
  hitCount: number
}

// ── In-memory cache (swap for Redis in production) ────────────────────────────

const cache = new Map<string, CachedBlueprint>()
const MAX_ENTRIES = 100
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/** Normalize a prompt for cache key generation */
function normalizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

/** Simple hash for cache key */
function hashPrompt(normalized: string): string {
  let h = 5381
  for (let i = 0; i < normalized.length; i++) {
    h = ((h << 5) + h) ^ normalized.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

export const promptCache = {
  get(prompt: string): CachedBlueprint | null {
    const key = hashPrompt(normalizePrompt(prompt))
    const entry = cache.get(key)
    if (!entry) return null

    // TTL check
    if (Date.now() - new Date(entry.createdAt).getTime() > TTL_MS) {
      cache.delete(key)
      return null
    }

    entry.hitCount++
    logger.info('cache', `Prompt cache hit (key=${key}, hits=${entry.hitCount})`)
    return entry
  },

  set(prompt: string, data: Omit<CachedBlueprint, 'createdAt' | 'hitCount'>): void {
    // Evict oldest if at capacity
    if (cache.size >= MAX_ENTRIES) {
      const oldest = [...cache.entries()].sort((a, b) =>
        a[1].createdAt.localeCompare(b[1].createdAt)
      )[0]
      if (oldest) cache.delete(oldest[0])
    }

    const key = hashPrompt(normalizePrompt(prompt))
    cache.set(key, { ...data, createdAt: new Date().toISOString(), hitCount: 0 })
    logger.info('cache', `Prompt cached (key=${key})`)
  },

  stats() {
    return {
      size: cache.size,
      maxEntries: MAX_ENTRIES,
      keys: [...cache.keys()],
    }
  },

  clear(): void {
    cache.clear()
  },
}
