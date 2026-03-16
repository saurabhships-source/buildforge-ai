// Prompt hashing utilities for Level 1 (exact) cache
// Uses Web Crypto API — works in both Node.js and Edge runtimes

/** SHA-256 hex digest of a string */
export async function hashPrompt(prompt: string): Promise<string> {
  const normalized = prompt.trim().toLowerCase().replace(/\s+/g, ' ')
  const data = new TextEncoder().encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Normalize a prompt for consistent hashing */
export function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Build the Redis key for an exact prompt cache entry */
export function exactCacheKey(hash: string): string {
  return `ai_prompt_cache:${hash}`
}

/** Build the Redis key for semantic embedding storage */
export function embeddingKey(hash: string): string {
  return `ai_embedding:${hash}`
}

/** Build the Redis key for the embedding index list */
export const EMBEDDING_INDEX_KEY = 'ai_embedding_index'
