// Prompt History — localStorage-based prompt history service

export interface PromptHistoryEntry {
  id: string
  prompt: string
  projectId?: string
  projectName?: string
  appType?: string
  createdAt: string
  usedCount: number
}

const STORAGE_KEY = 'buildforge_prompt_history'
const MAX_ENTRIES = 100

function load(): PromptHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PromptHistoryEntry[]) : []
  } catch { return [] }
}

function save(entries: PromptHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch { /* quota */ }
}

export const promptHistory = {
  add(entry: Omit<PromptHistoryEntry, 'id' | 'createdAt' | 'usedCount'>): PromptHistoryEntry {
    const entries = load()
    // Check for duplicate prompt
    const existing = entries.find(e => e.prompt.trim().toLowerCase() === entry.prompt.trim().toLowerCase())
    if (existing) {
      existing.usedCount++
      existing.projectId = entry.projectId ?? existing.projectId
      existing.projectName = entry.projectName ?? existing.projectName
      save(entries)
      return existing
    }
    const newEntry: PromptHistoryEntry = {
      id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      usedCount: 1,
      ...entry,
    }
    save([newEntry, ...entries])
    return newEntry
  },

  getAll(): PromptHistoryEntry[] {
    return load()
  },

  getRecent(limit = 20): PromptHistoryEntry[] {
    return load().slice(0, limit)
  },

  getMostUsed(limit = 10): PromptHistoryEntry[] {
    return load()
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, limit)
  },

  search(query: string): PromptHistoryEntry[] {
    const q = query.toLowerCase()
    return load().filter(e => e.prompt.toLowerCase().includes(q))
  },

  delete(id: string) {
    save(load().filter(e => e.id !== id))
  },

  clear() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  },

  count(): number {
    return load().length
  },
}
