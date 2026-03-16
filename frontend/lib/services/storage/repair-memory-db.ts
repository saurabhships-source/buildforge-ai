/**
 * Repair Memory DB Adapter — future Supabase/PostgreSQL persistence layer.
 *
 * When you're ready to persist repair memory across server restarts:
 * 1. Create the table (SQL below)
 * 2. Replace the in-memory store in repair-memory.ts with calls to this adapter
 *
 * Supabase table DDL:
 * ─────────────────────────────────────────────────────────────────────────────
 * create table repair_memory (
 *   id          uuid primary key default gen_random_uuid(),
 *   pattern     text unique not null,
 *   fix         jsonb not null,
 *   error_type  text not null,
 *   strategy    text not null,
 *   usage_count integer not null default 0,
 *   last_used   bigint not null,
 *   created_at  bigint not null
 * );
 * create index on repair_memory (usage_count desc);
 * create index on repair_memory (last_used desc);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { RepairMemoryEntry, FixTransform } from '@/lib/services/ai/repair-memory'
import type { ErrorCategory } from '@/lib/services/ai/error-collector'
import type { RepairStrategy } from '@/lib/services/ai/error-analyzer'
import { logger } from '@/lib/core/logger'

// ── Adapter interface ─────────────────────────────────────────────────────────

export interface RepairMemoryAdapter {
  get(pattern: string): Promise<RepairMemoryEntry | null>
  save(pattern: string, fix: FixTransform, errorType: ErrorCategory, strategy: RepairStrategy): Promise<void>
  incrementUsage(pattern: string): Promise<void>
  list(limit?: number): Promise<RepairMemoryEntry[]>
  delete(pattern: string): Promise<boolean>
  clear(): Promise<void>
}

// ── Supabase adapter (wired up when SUPABASE_URL + SUPABASE_SERVICE_KEY are set) ──

export function createSupabaseAdapter(supabaseUrl: string, serviceKey: string): RepairMemoryAdapter {
  // Lazy import to avoid bundling supabase-js when not needed
  const getClient = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { createClient } = await import('@supabase/supabase-js' as any)
    return createClient(supabaseUrl, serviceKey)
  }

  return {
    async get(pattern) {
      try {
        const sb = await getClient()
        const { data } = await sb
          .from('repair_memory')
          .select('*')
          .eq('pattern', pattern)
          .single()
        if (!data) return null
        return rowToEntry(data)
      } catch (err) {
        logger.warn('system', 'repair-memory-db get failed', err instanceof Error ? err.message : String(err))
        return null
      }
    },

    async save(pattern, fix, errorType, strategy) {
      try {
        const sb = await getClient()
        await sb.from('repair_memory').upsert({
          pattern,
          fix,
          error_type: errorType,
          strategy,
          last_used: Date.now(),
          created_at: Date.now(),
        }, { onConflict: 'pattern' })
      } catch (err) {
        logger.warn('system', 'repair-memory-db save failed', err instanceof Error ? err.message : String(err))
      }
    },

    async incrementUsage(pattern) {
      try {
        const sb = await getClient()
        await sb.rpc('increment_repair_usage', { p_pattern: pattern })
      } catch (err) {
        logger.warn('system', 'repair-memory-db incrementUsage failed', err instanceof Error ? err.message : String(err))
      }
    },

    async list(limit = 100) {
      try {
        const sb = await getClient()
        const { data } = await sb
          .from('repair_memory')
          .select('*')
          .order('usage_count', { ascending: false })
          .limit(limit)
        return (data ?? []).map(rowToEntry)
      } catch {
        return []
      }
    },

    async delete(pattern) {
      try {
        const sb = await getClient()
        const { error } = await sb.from('repair_memory').delete().eq('pattern', pattern)
        return !error
      } catch {
        return false
      }
    },

    async clear() {
      try {
        const sb = await getClient()
        await sb.from('repair_memory').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      } catch (err) {
        logger.warn('system', 'repair-memory-db clear failed', err instanceof Error ? err.message : String(err))
      }
    },
  }
}

function rowToEntry(row: Record<string, unknown>): RepairMemoryEntry {
  return {
    pattern: row.pattern as string,
    fix: row.fix as FixTransform,
    errorType: row.error_type as ErrorCategory,
    strategy: row.strategy as RepairStrategy,
    usageCount: row.usage_count as number,
    lastUsed: row.last_used as number,
    createdAt: row.created_at as number,
  }
}
