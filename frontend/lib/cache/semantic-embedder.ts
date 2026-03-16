// Semantic embedding engine for Level 2 (similarity) cache
// Uses a lightweight TF-IDF style bag-of-words embedding that runs
// entirely in-process — no external vector DB required.
// For production, swap computeEmbedding() with an OpenAI/Gemini embeddings call.

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'be', 'as', 'it',
  'i', 'me', 'my', 'we', 'you', 'that', 'this', 'can', 'will', 'do',
  'make', 'create', 'build', 'generate', 'add', 'get', 'set', 'use',
])

// Domain vocabulary with semantic weights
const DOMAIN_VOCAB: Record<string, number> = {
  // App types
  saas: 3, landing: 3, dashboard: 3, ecommerce: 3, portfolio: 3,
  blog: 3, booking: 3, restaurant: 3, marketplace: 3, crm: 3,
  // Features
  stripe: 2, payment: 2, auth: 2, login: 2, signup: 2, checkout: 2,
  analytics: 2, chart: 2, table: 2, form: 2, modal: 2, sidebar: 2,
  // Tech
  react: 2, nextjs: 2, tailwind: 2, typescript: 2, api: 2, database: 2,
  // Style
  modern: 1, minimal: 1, dark: 1, light: 1, responsive: 1, mobile: 1,
  // Business
  startup: 2, agency: 2, fitness: 2, food: 2, travel: 2, finance: 2,
  healthcare: 2, education: 2, real: 1, estate: 2, realestate: 3,
}

/** Tokenize and weight a prompt into a sparse vector */
export function computeEmbedding(prompt: string): Map<string, number> {
  const tokens = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t))

  const vec = new Map<string, number>()

  for (const token of tokens) {
    const weight = DOMAIN_VOCAB[token] ?? 1
    vec.set(token, (vec.get(token) ?? 0) + weight)
  }

  // Bigrams for compound concepts
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]}_${tokens[i + 1]}`
    const weight = (DOMAIN_VOCAB[tokens[i]] ?? 1) + (DOMAIN_VOCAB[tokens[i + 1]] ?? 1)
    vec.set(bigram, (vec.get(bigram) ?? 0) + weight * 0.5)
  }

  return normalizeVector(vec)
}

/** L2-normalize a vector */
function normalizeVector(vec: Map<string, number>): Map<string, number> {
  let magnitude = 0
  for (const v of vec.values()) magnitude += v * v
  magnitude = Math.sqrt(magnitude)
  if (magnitude === 0) return vec
  const normalized = new Map<string, number>()
  for (const [k, v] of vec) normalized.set(k, v / magnitude)
  return normalized
}

/** Cosine similarity between two sparse vectors */
export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  for (const [k, v] of a) {
    const bv = b.get(k)
    if (bv !== undefined) dot += v * bv
  }
  // Vectors are already L2-normalized so dot product = cosine similarity
  return dot
}

/** Serialize embedding to a plain object for storage */
export function serializeEmbedding(vec: Map<string, number>): Record<string, number> {
  return Object.fromEntries(vec)
}

/** Deserialize embedding from storage */
export function deserializeEmbedding(obj: Record<string, number>): Map<string, number> {
  return new Map(Object.entries(obj))
}

/** Default similarity threshold — prompts above this score reuse cached result */
export const SIMILARITY_THRESHOLD = 0.82
