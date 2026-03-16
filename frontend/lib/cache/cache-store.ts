// Cache Store — in-memory LRU cache with optional Redis backend
// Falls back to in-memory when Redis is not configured.
// In production: set REDIS_URL env var to enable Redis persistence.

export interface CacheEntry {
  promptHash: string
  prompt: string
  files: Record<string, string>
  entrypoint: string
  description: string
  agent: string
  model: string
  appType: string
  embedding: Record<string, number>
  hitCount: number
  createdAt: number
  expiresAt: number
}

// TTLs in milliseconds
const TTL_TEMPLATE = 7 * 24 * 60 * 60 * 1000   // 7 days
const TTL_COMMON   = 30 * 24 * 60 * 60 * 1000  // 30 days
const MAX_MEMORY_ENTRIES = 500

// ── In-memory LRU store ───────────────────────────────────────────────────────

class LRUCache {
  private map = new Map<string, CacheEntry>()
  private readonly max: number

  constructor(max: number) { this.max = max }

  get(key: string): CacheEntry | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) { this.map.delete(key); return undefined }
    // Move to end (most recently used)
    this.map.delete(key)
    this.map.set(key, entry)
    return entry
  }

  set(key: string, value: CacheEntry): void {
    if (this.map.has(key)) this.map.delete(key)
    else if (this.map.size >= this.max) {
      // Evict oldest
      const firstKey = this.map.keys().next().value
      if (firstKey) this.map.delete(firstKey)
    }
    this.map.set(key, value)
  }

  delete(key: string): void { this.map.delete(key) }

  values(): IterableIterator<CacheEntry> { return this.map.values() }

  size(): number { return this.map.size }

  clear(): void { this.map.clear() }
}

const memoryCache = new LRUCache(MAX_MEMORY_ENTRIES)

// ── Redis client (optional) ───────────────────────────────────────────────────

let redisClient: {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, options?: { ex?: number }) => Promise<void>
  del: (key: string) => Promise<void>
} | null = null

async function getRedis() {
  if (redisClient) return redisClient
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    // Dynamic import so the app doesn't crash when Redis isn't installed
    const { createClient } = await import('redis')
    const client = createClient({ url })
    await client.connect()
    redisClient = {
      get: async (key) => client.get(key),
      set: async (key, value, opts) => {
        if (opts?.ex) await client.setEx(key, opts.ex, value)
        else await client.set(key, value)
      },
      del: async (key) => { await client.del(key) },
    }
    return redisClient
  } catch (err) {
    console.warn('[cache] Redis unavailable, using memory cache:', (err as Error).message)
    return null
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getCacheEntry(hash: string): Promise<CacheEntry | null> {
  // Memory first
  const mem = memoryCache.get(hash)
  if (mem) { mem.hitCount++; return mem }

  // Redis fallback
  const redis = await getRedis()
  if (redis) {
    try {
      const raw = await redis.get(`ai_prompt_cache:${hash}`)
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry
        if (Date.now() <= entry.expiresAt) {
          entry.hitCount++
          memoryCache.set(hash, entry) // warm memory cache
          return entry
        }
      }
    } catch (err) {
      console.warn('[cache] Redis get error:', err)
    }
  }

  return null
}

export async function setCacheEntry(entry: CacheEntry): Promise<void> {
  memoryCache.set(entry.promptHash, entry)

  const redis = await getRedis()
  if (redis) {
    try {
      const ttlMs = entry.expiresAt - Date.now()
      const ttlSec = Math.max(1, Math.floor(ttlMs / 1000))
      await redis.set(`ai_prompt_cache:${entry.promptHash}`, JSON.stringify(entry), { ex: ttlSec })
    } catch (err) {
      console.warn('[cache] Redis set error:', err)
    }
  }
}

export async function deleteCacheEntry(hash: string): Promise<void> {
  memoryCache.delete(hash)
  const redis = await getRedis()
  if (redis) {
    try { await redis.del(`ai_prompt_cache:${hash}`) } catch { /* ignore */ }
  }
}

export function getAllMemoryEntries(): CacheEntry[] {
  return Array.from(memoryCache.values())
}

export function getCacheStats() {
  const entries = getAllMemoryEntries()
  const now = Date.now()
  const active = entries.filter(e => e.expiresAt > now)
  return {
    totalEntries: memoryCache.size(),
    activeEntries: active.length,
    totalHits: active.reduce((s, e) => s + e.hitCount, 0),
    redisEnabled: !!process.env.REDIS_URL,
    memoryUsageKb: Math.round(JSON.stringify(entries).length / 1024),
  }
}

export function buildCacheEntry(opts: {
  promptHash: string
  prompt: string
  files: Record<string, string>
  entrypoint: string
  description: string
  agent: string
  model: string
  appType: string
  embedding: Record<string, number>
  isTemplate?: boolean
}): CacheEntry {
  const ttl = opts.isTemplate ? TTL_TEMPLATE : TTL_COMMON
  return {
    ...opts,
    hitCount: 0,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttl,
  }
}
