/**
 * Error Analyzer — classifies BuildErrors and enriches them with repair context.
 * Determines which file needs to be read, what kind of fix is needed,
 * and whether the error is auto-repairable.
 */

import type { BuildError, ErrorCategory } from './error-collector'
import { logger } from '@/lib/core/logger'

export interface AnalyzedError {
  original: BuildError
  /** Canonical category after deeper analysis */
  category: ErrorCategory
  /** Human-readable description of what went wrong */
  description: string
  /** The file that needs to be modified to fix this error */
  targetFile: string | null
  /** Whether the repair agent can attempt an automatic fix */
  autoRepairable: boolean
  /** Suggested fix strategy */
  strategy: RepairStrategy
  /** Priority — lower = fix first */
  priority: number
}

export type RepairStrategy =
  | 'add-named-export'       // function exists but isn't exported
  | 'convert-default-export' // default export where named is expected
  | 'add-import'             // symbol used but not imported
  | 'fix-type'               // type annotation mismatch
  | 'fix-syntax'             // syntax error in file
  | 'fix-hook-placement'     // hook called outside component
  | 'ai-repair'              // complex — delegate to AI fix generator
  | 'manual'                 // cannot auto-repair safely

// ── Safety: files we never auto-modify ───────────────────────────────────────

const PROTECTED_PATTERNS = [
  /middleware\.ts$/,
  /auth\./,
  /stripe\./,
  /billing\./,
  /webhook/,
  /prisma\/schema/,
  /lib\/db\.ts$/,
]

function isProtected(file: string | null): boolean {
  if (!file) return false
  return PROTECTED_PATTERNS.some(p => p.test(file))
}

// ── Strategy mapping ──────────────────────────────────────────────────────────

function pickStrategy(error: BuildError): RepairStrategy {
  switch (error.category) {
    case 'missing-export':
      if (/doesn't exist in target module/i.test(error.message)) return 'add-named-export'
      if (/does not provide an export named/i.test(error.message)) return 'convert-default-export'
      return 'add-named-export'
    case 'missing-import':
      return 'add-import'
    case 'type-mismatch':
      return 'fix-type'
    case 'syntax-error':
      return 'fix-syntax'
    case 'react-hook-misuse':
      return 'fix-hook-placement'
    case 'undefined-symbol':
      return 'ai-repair'
    default:
      return 'ai-repair'
  }
}

function describeError(error: BuildError): string {
  switch (error.category) {
    case 'missing-export':
      return `A named export is missing from the target module. The import expects a symbol that isn't exported.`
    case 'missing-import':
      return `A module cannot be found. Either the path is wrong or the package isn't installed.`
    case 'type-mismatch':
      return `TypeScript type mismatch. The value passed doesn't match the expected type.`
    case 'syntax-error':
      return `Syntax error in the file. The code cannot be parsed.`
    case 'react-hook-misuse':
      return `React Hook called in an invalid location (outside a component or inside a condition/loop).`
    case 'undefined-symbol':
      return `A variable or function is used but never defined or imported.`
    default:
      return `Unknown build error.`
  }
}

function priorityFor(category: ErrorCategory): number {
  // Fix syntax first (blocks everything), then exports, then imports, then types
  const order: Record<ErrorCategory, number> = {
    'syntax-error': 1,
    'missing-export': 2,
    'missing-import': 3,
    'undefined-symbol': 4,
    'react-hook-misuse': 5,
    'type-mismatch': 6,
    'unknown': 99,
  }
  return order[category] ?? 99
}

// ── Main analyzer ─────────────────────────────────────────────────────────────

export function analyzeErrors(errors: BuildError[]): AnalyzedError[] {
  const analyzed = errors.map((error): AnalyzedError => {
    const strategy = pickStrategy(error)
    const protected_ = isProtected(error.file)

    const autoRepairable =
      !protected_ &&
      strategy !== 'manual' &&
      error.severity === 'error'

    const result: AnalyzedError = {
      original: error,
      category: error.category,
      description: describeError(error),
      targetFile: error.file,
      autoRepairable,
      strategy: protected_ ? 'manual' : strategy,
      priority: priorityFor(error.category),
    }

    if (protected_) {
      logger.warn('system', `Skipping protected file: ${error.file}`, error.message)
    }

    return result
  })

  // Sort by priority
  analyzed.sort((a, b) => a.priority - b.priority)

  logger.info('system',
    `Analyzed ${analyzed.length} error(s)`,
    `${analyzed.filter(e => e.autoRepairable).length} auto-repairable`,
  )

  return analyzed
}
