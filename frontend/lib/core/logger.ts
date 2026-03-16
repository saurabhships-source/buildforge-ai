// Centralized logger — structured logging for AI pipeline, API, and preview errors
// Logs are stored in-memory (ring buffer) and exposed to the admin dashboard

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogCategory = 'ai-pipeline' | 'api' | 'preview' | 'cache' | 'system' | 'general'

export interface LogEntry {
  id: string
  level: LogLevel
  category: LogCategory
  message: string
  detail?: string
  timestamp: string
  durationMs?: number
}

const MAX_ENTRIES = 200
const entries: LogEntry[] = []

let idCounter = 0

function createEntry(
  level: LogLevel,
  category: LogCategory,
  message: string,
  detail?: string,
  durationMs?: number,
): LogEntry {
  return {
    id: `log-${++idCounter}`,
    level,
    category,
    message,
    detail: detail ? String(detail).slice(0, 500) : undefined,
    timestamp: new Date().toISOString(),
    durationMs,
  }
}

function push(entry: LogEntry) {
  entries.unshift(entry)
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES
  // Mirror to console in dev
  if (process.env.NODE_ENV !== 'production') {
    const fn = entry.level === 'error' ? console.error
      : entry.level === 'warn' ? console.warn
      : console.log
    fn(`[${entry.category}] ${entry.message}`, entry.detail ?? '')
  }
}

export const logger = {
  debug(category: LogCategory, message: string, detail?: string) {
    push(createEntry('debug', category, message, detail))
  },
  info(category: LogCategory, message: string, detail?: string, durationMs?: number) {
    push(createEntry('info', category, message, detail, durationMs))
  },
  warn(category: LogCategory, message: string, detail?: string) {
    push(createEntry('warn', category, message, detail))
  },
  error(category: LogCategory, message: string, detail?: string) {
    push(createEntry('error', category, message, detail))
  },

  /** Time an async operation and log the result */
  async time<T>(
    category: LogCategory,
    label: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      push(createEntry('info', category, label, undefined, Date.now() - start))
      return result
    } catch (err) {
      push(createEntry('error', category, `${label} failed`, err instanceof Error ? err.message : String(err), Date.now() - start))
      throw err
    }
  },

  getAll(): LogEntry[] {
    return [...entries]
  },

  getByCategory(category: LogCategory): LogEntry[] {
    return entries.filter(e => e.category === category)
  },

  getErrors(): LogEntry[] {
    return entries.filter(e => e.level === 'error' || e.level === 'warn')
  },

  clear() {
    entries.length = 0
  },
}
