/**
 * Repair Memory — stores mappings of normalized error patterns → successful fixes.
 * Acts as a self-learning cache: the more apps are generated, the faster repairs become.
 *
 * Storage: in-memory (server process) with localStorage mirror on the client.
 * Swap `memoryStore` for a DB adapter (see repair-memory-db.ts) in production.
 */

import { logger } from '@/lib/core/logger'
import type { ErrorCategory } from './error-collector'
import type { RepairStrategy } from './error-analyzer'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RepairMemoryEntry {
  /** Normalized pattern key, e.g. "missing_export:PricingSection" */
  pattern: string
  /** The transformation applied — stored as a serialized FixTransform */
  fix: FixTransform
  /** Error category this fix addresses */
  errorType: ErrorCategory
  /** Repair strategy used */
  strategy: RepairStrategy
  /** How many times this fix has been successfully applied */
  usageCount: number
  /** Unix timestamp of last successful use */
  lastUsed: number
  /** Unix timestamp of when this entry was first created */
  createdAt: number
}

/**
 * A FixTransform describes the minimal transformation to apply to a file.
 * Keeping it as a transform (not full file content) makes it reusable across files.
 */
export type FixTransform =
  | { type: 'add-named-export'; symbolName: string }
  | { type: 'convert-default-export' }
  | { type: 'add-import'; importStatement: string; from: string }
  | { type: 'full-replacement'; content: string }  // AI-generated, file-specific

// ── Config ────────────────────────────────────────────────────────────────────

const MAX_STORED_FIXES = 500

// ── In-memory store ───────────────────────────────────────────────────────────

const store = new Map<string, RepairMemoryEntry>()

// ── Pattern normalization ─────────────────────────────────────────────────────

/**
 * Normalize an error message into a stable, file-agnostic pattern key.
 *
 * Examples:
 *   "Export 'PricingSection' doesn't exist in target module"
 *     → "missing_export:PricingSection"
 *
 *   "Cannot find module '@/components/pricing-section'"
 *     → "missing_import:@/components/pricing-section"
 *
 *   "SyntaxError: Unexpected token '}'"
 *     → "syntax_error:unexpected_token"
 */
export function normalizeError(
  message: string,
  category: ErrorCategory,
): string {
  const msg = message.trim()

  switch (category) {
    case 'missing-export': {
      const m =
        msg.match(/Export '(\w+)' doesn't exist/i) ??
        msg.match(/does not provide an export named '(\w+)'/i) ??
        msg.match(/named export '(\w+)'/i)
      const symbol = m?.[1] ?? 'unknown'
      return `missing_export:${symbol}`
    }

    case 'missing-import': {
      const m =
        msg.match(/Cannot find module '([^']+)'/i) ??
        msg.match(/Module not found.*'([^']+)'/i)
      const mod = m?.[1]?.replace(/^\.\//, '') ?? 'unknown'
      return `missing_import:${mod}`
    }

    case 'type-mismatch': {
      // Strip specific type names — keep the shape
      const normalized = msg
        .replace(/'[^']+'/g, "'T'")
        .replace(/\s+/g, ' ')
        .slice(0, 80)
      return `type_mismatch:${normalized}`
    }

    case 'syntax-error': {
      const m = msg.match(/Unexpected (\w+)/i)
      const token = m?.[1]?.toLowerCase() ?? 'unknown'
      return `syntax_error:unexpected_${token}`
    }

    case 'react-hook-misuse': {
      const m = msg.match(/React Hook (\w+)/i)
      const hook = m?.[1]?.toLowerCase() ?? 'hook'
      return `react_hook_misuse:${hook}`
    }

    case 'undefined-symbol': {
      const m = msg.match(/(\w+) is not defined/i)
      const sym = m?.[1] ?? 'unknown'
      return `undefined_symbol:${sym}`
    }

    default:
      return `unknown:${msg.slice(0, 60).replace(/\s+/g, '_').toLowerCase()}`
  }
}

// ── Core memory operations ────────────────────────────────────────────────────

export const repairMemory = {
  /**
   * Look up a stored fix for a normalized error pattern.
   * Returns null if not found or if the fix is a full-replacement (file-specific).
   */
  getFix(pattern: string): RepairMemoryEntry | null {
    const entry = store.get(pattern)
    if (!entry) return null

    // full-replacement fixes are file-specific — don't reuse across different files
    if (entry.fix.type === 'full-replacement') return null

    logger.info('system', 'Repair memory hit', `pattern=${pattern} usageCount=${entry.usageCount}`)
    return entry
  },

  /**
   * Store a successful fix for a pattern.
   * If the pattern already exists, updates the fix and resets usage.
   */
  saveFix(
    pattern: string,
    fix: FixTransform,
    errorType: ErrorCategory,
    strategy: RepairStrategy,
  ): void {
    // Evict if at capacity — remove least-used entries first
    if (store.size >= MAX_STORED_FIXES && !store.has(pattern)) {
      const sorted = [...store.entries()].sort((a, b) => {
        // Score: usageCount * 0.7 + recency * 0.3
        const scoreA = a[1].usageCount * 0.7 + (a[1].lastUsed / 1e12) * 0.3
        const scoreB = b[1].usageCount * 0.7 + (b[1].lastUsed / 1e12) * 0.3
        return scoreA - scoreB
      })
      const toEvict = sorted[0]
      if (toEvict) {
        store.delete(toEvict[0])
        logger.debug('system', `Repair memory evicted: ${toEvict[0]}`)
      }
    }

    const existing = store.get(pattern)
    store.set(pattern, {
      pattern,
      fix,
      errorType,
      strategy,
      usageCount: existing ? existing.usageCount : 0,
      lastUsed: Date.now(),
      createdAt: existing?.createdAt ?? Date.now(),
    })

    logger.info('system', 'Repair memory stored', `pattern=${pattern} type=${fix.type}`)
  },

  /** Increment usage count after a successful repair */
  incrementUsage(pattern: string): void {
    const entry = store.get(pattern)
    if (!entry) return
    entry.usageCount++
    entry.lastUsed = Date.now()
    store.set(pattern, entry)
  },

  /** List all stored fixes, sorted by usage count descending */
  listFixes(): RepairMemoryEntry[] {
    return [...store.values()].sort((a, b) => b.usageCount - a.usageCount)
  },

  /** Delete a specific fix by pattern */
  deleteFix(pattern: string): boolean {
    return store.delete(pattern)
  },

  /** Clear all stored fixes */
  clear(): void {
    store.clear()
    logger.info('system', 'Repair memory cleared')
  },

  /** Stats for dashboard */
  stats() {
    const entries = [...store.values()]
    return {
      totalFixes: entries.length,
      maxFixes: MAX_STORED_FIXES,
      totalUsage: entries.reduce((s, e) => s + e.usageCount, 0),
      topPatterns: entries
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
        .map(e => ({ pattern: e.pattern, usageCount: e.usageCount, lastUsed: e.lastUsed })),
    }
  },

  /** Prune entries that haven't been used in 30 days */
  pruneStale(maxAgeDays = 30): number {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    let pruned = 0
    for (const [key, entry] of store.entries()) {
      if (entry.lastUsed < cutoff && entry.usageCount === 0) {
        store.delete(key)
        pruned++
      }
    }
    if (pruned > 0) logger.info('system', `Repair memory pruned ${pruned} stale entries`)
    return pruned
  },
}
