/**
 * Error Collector — parses raw build/runtime output into structured BuildError objects.
 * Supports: Next.js compiler errors, TypeScript errors, runtime console errors.
 */

import { logger } from '@/lib/core/logger'

export type ErrorCategory =
  | 'missing-export'
  | 'missing-import'
  | 'type-mismatch'
  | 'syntax-error'
  | 'undefined-symbol'
  | 'react-hook-misuse'
  | 'unknown'

export interface BuildError {
  id: string
  category: ErrorCategory
  message: string
  file: string | null
  line: number | null
  column: number | null
  raw: string
  /** Severity: error blocks build, warning does not */
  severity: 'error' | 'warning'
}

// ── Regex patterns for common error shapes ────────────────────────────────────

const PATTERNS: Array<{ re: RegExp; category: ErrorCategory; severity: BuildError['severity'] }> = [
  // Export X doesn't exist in target module
  { re: /Export '(\w+)' doesn't exist in target module/i, category: 'missing-export', severity: 'error' },
  // Module not found / Cannot find module
  { re: /Cannot find module '([^']+)'/i, category: 'missing-import', severity: 'error' },
  { re: /Module not found.*'([^']+)'/i, category: 'missing-import', severity: 'error' },
  // TypeScript type errors
  { re: /Type '(.+)' is not assignable to type/i, category: 'type-mismatch', severity: 'error' },
  { re: /Argument of type '(.+)' is not assignable/i, category: 'type-mismatch', severity: 'error' },
  // Undefined / not defined
  { re: /(\w+) is not defined/i, category: 'undefined-symbol', severity: 'error' },
  { re: /Cannot read propert(?:y|ies) of undefined/i, category: 'undefined-symbol', severity: 'error' },
  // React hooks
  { re: /React Hook .+ cannot be called/i, category: 'react-hook-misuse', severity: 'error' },
  { re: /Rules of Hooks/i, category: 'react-hook-misuse', severity: 'error' },
  // Syntax
  { re: /SyntaxError:/i, category: 'syntax-error', severity: 'error' },
  { re: /Unexpected token/i, category: 'syntax-error', severity: 'error' },
  { re: /Unexpected end of/i, category: 'syntax-error', severity: 'error' },
  // Named import not found (Next.js / Turbopack)
  { re: /The requested module .+ does not provide an export named '(\w+)'/i, category: 'missing-export', severity: 'error' },
]

// ── File + line extraction ────────────────────────────────────────────────────

/** Try to extract file path and line/col from a compiler error line */
function extractLocation(line: string): { file: string | null; lineNum: number | null; col: number | null } {
  // ./path/to/file.tsx:12:5 or /abs/path.ts(12,5)
  const m1 = line.match(/([./][\w./-]+\.[tj]sx?)[:\(](\d+)[,:](\d+)/)
  if (m1) return { file: m1[1], lineNum: parseInt(m1[2]), col: parseInt(m1[3]) }

  const m2 = line.match(/([./][\w./-]+\.[tj]sx?)/)
  if (m2) return { file: m2[1], lineNum: null, col: null }

  return { file: null, lineNum: null, col: null }
}

let _idSeq = 0
function nextId() { return `err-${Date.now()}-${++_idSeq}` }

// ── Main collector ────────────────────────────────────────────────────────────

/**
 * Parse a raw build/compiler output string into structured BuildError objects.
 * Pass the full stderr/stdout from `next build` or tsc.
 */
export function collectErrors(rawOutput: string): BuildError[] {
  const errors: BuildError[] = []
  const lines = rawOutput.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    for (const { re, category, severity } of PATTERNS) {
      if (re.test(line)) {
        const loc = extractLocation(line)
        // Look ahead up to 3 lines for location if not found on this line
        let file = loc.file
        let lineNum = loc.lineNum
        let col = loc.col
        if (!file) {
          for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
            const ahead = extractLocation(lines[j])
            if (ahead.file) { file = ahead.file; lineNum = ahead.lineNum; col = ahead.col; break }
          }
        }

        errors.push({
          id: nextId(),
          category,
          message: line,
          file,
          line: lineNum,
          column: col,
          raw: lines.slice(i, Math.min(i + 4, lines.length)).join('\n'),
          severity,
        })
        break // one category per line
      }
    }
  }

  // Deduplicate by (category + file + message prefix)
  const seen = new Set<string>()
  const deduped = errors.filter(e => {
    const key = `${e.category}|${e.file}|${e.message.slice(0, 80)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (deduped.length > 0) {
    logger.warn('system', `Collected ${deduped.length} build error(s)`, deduped.map(e => e.message).join(' | '))
  }

  return deduped
}

/**
 * Collect errors from an array of runtime log entries (e.g. from console.error captures).
 */
export function collectRuntimeErrors(logs: string[]): BuildError[] {
  return collectErrors(logs.join('\n'))
}
