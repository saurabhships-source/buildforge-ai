// AI Cache — main entry point
// Implements the two-level cache pipeline:
//   Level 1: Exact prompt hash match (O(1) lookup)
//   Level 2: Semantic similarity match (cosine similarity over in-memory index)
//
// Usage:
//   const hit = await aiCache.lookup(prompt, appType)
//   if (hit) return hit.files
//   const result = await runAI(...)
//   await aiCache.store(prompt, appType, result)

import { hashPrompt } from './prompt-hasher'
import {
  computeEmbedding, cosineSimilarity, serializeEmbedding,
  deserializeEmbedding, SIMILARITY_THRESHOLD,
} from './semantic-embedder'
import {
  getCacheEntry, setCacheEntry, getAllMemoryEntries, buildCacheEntry,
  type CacheEntry,
} from './cache-store'

export interface CacheLookupResult {
  hit: true
  level: 1 | 2
  similarity: number
  entry: CacheEntry
}

export interface CacheMiss {
  hit: false
}

export type CacheResult = CacheLookupResult | CacheMiss

export interface StoreOptions {
  files: Record<string, string>
  entrypoint: string
  description: string
  agent: string
  model: string
  isTemplate?: boolean
}

class AICache {
  /** Look up a prompt — returns a hit (level 1 or 2) or a miss */
  async lookup(prompt: string, appType = 'website'): Promise<CacheResult> {
    const hash = await hashPrompt(prompt + ':' + appType)

    // ── Level 1: Exact match ──────────────────────────────────────────────
    const exact = await getCacheEntry(hash)
    if (exact) {
      console.log(`[ai-cache] L1 hit — hash=${hash.slice(0, 12)} hits=${exact.hitCount}`)
      return { hit: true, level: 1, similarity: 1.0, entry: exact }
    }

    // ── Level 2: Semantic match ───────────────────────────────────────────
    const queryVec = computeEmbedding(prompt)
    const candidates = getAllMemoryEntries().filter(e => e.appType === appType)

    let bestScore = 0
    let bestEntry: CacheEntry | null = null

    for (const candidate of candidates) {
      if (!candidate.embedding || Object.keys(candidate.embedding).length === 0) continue
      const candidateVec = deserializeEmbedding(candidate.embedding)
      const score = cosineSimilarity(queryVec, candidateVec)
      if (score > bestScore) {
        bestScore = score
        bestEntry = candidate
      }
    }

    if (bestEntry && bestScore >= SIMILARITY_THRESHOLD) {
      console.log(`[ai-cache] L2 hit — similarity=${bestScore.toFixed(3)} prompt="${bestEntry.prompt.slice(0, 40)}"`)
      bestEntry.hitCount++
      return { hit: true, level: 2, similarity: bestScore, entry: bestEntry }
    }

    return { hit: false }
  }

  /** Store a generation result in the cache */
  async store(
    prompt: string,
    appType: string,
    opts: StoreOptions,
  ): Promise<void> {
    const hash = await hashPrompt(prompt + ':' + appType)
    const embedding = serializeEmbedding(computeEmbedding(prompt))

    const entry = buildCacheEntry({
      promptHash: hash,
      prompt,
      appType,
      embedding,
      isTemplate: opts.isTemplate,
      ...opts,
    })

    await setCacheEntry(entry)
    console.log(`[ai-cache] stored — hash=${hash.slice(0, 12)} files=${Object.keys(opts.files).length}`)
  }

  /** Invalidate a specific prompt */
  async invalidate(prompt: string, appType = 'website'): Promise<void> {
    const { deleteCacheEntry } = await import('./cache-store')
    const hash = await hashPrompt(prompt + ':' + appType)
    await deleteCacheEntry(hash)
  }

  /** Warm the cache with template prompts (called at startup) */
  async warmTemplates(templates: Array<{ prompt: string; appType: string; files: Record<string, string>; entrypoint: string; description: string; agent: string; model: string }>): Promise<void> {
    for (const t of templates) {
      const result = await this.lookup(t.prompt, t.appType)
      if (!result.hit) {
        await this.store(t.prompt, t.appType, { ...t, isTemplate: true })
      }
    }
    console.log(`[ai-cache] warmed ${templates.length} templates`)
  }
}

export const aiCache = new AICache()
