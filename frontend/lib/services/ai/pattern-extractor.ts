/**
 * Pattern Extractor — identifies good and bad patterns in generated projects.
 * Good: shared components, consistent API structure, typed interfaces.
 * Bad: duplicate validation, large files, inline styles, magic strings.
 */

import type { ProjectAnalysis } from './project-analyzer'

export type PatternType = 'good' | 'bad'
export type PatternCategory =
  | 'shared-component'
  | 'duplicate-validation'
  | 'large-file'
  | 'inline-style'
  | 'magic-string'
  | 'consistent-api'
  | 'typed-interface'
  | 'missing-error-handling'
  | 'unoptimized-import'

export interface ExtractedPattern {
  type: PatternType
  category: PatternCategory
  description: string
  occurrences: number
  files: string[]
  suggestion: string
}

export function extractPatterns(
  files: Record<string, string>,
  analysis: ProjectAnalysis,
): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = []

  // ── Good patterns ──────────────────────────────────────────────────────────

  if (analysis.sharedComponents.length > 0) {
    patterns.push({
      type: 'good',
      category: 'shared-component',
      description: `${analysis.sharedComponents.length} components reused across multiple files`,
      occurrences: analysis.sharedComponents.length,
      files: analysis.sharedComponents,
      suggestion: 'Continue extracting reusable components',
    })
  }

  if (analysis.apiConsistencyScore > 0.8) {
    patterns.push({
      type: 'good',
      category: 'consistent-api',
      description: 'API routes follow consistent NextResponse patterns',
      occurrences: analysis.apiRouteCount,
      files: [],
      suggestion: 'Maintain this pattern across all routes',
    })
  }

  // Check for typed interfaces
  const typedFiles: string[] = []
  for (const [path, content] of Object.entries(files)) {
    if (/interface\s+\w+|type\s+\w+\s*=/.test(content)) typedFiles.push(path)
  }
  if (typedFiles.length > 0) {
    patterns.push({
      type: 'good',
      category: 'typed-interface',
      description: `${typedFiles.length} files use TypeScript interfaces/types`,
      occurrences: typedFiles.length,
      files: typedFiles.slice(0, 5),
      suggestion: 'Keep using typed interfaces for all data structures',
    })
  }

  // ── Bad patterns ───────────────────────────────────────────────────────────

  if (analysis.largeFiles.length > 0) {
    patterns.push({
      type: 'bad',
      category: 'large-file',
      description: `${analysis.largeFiles.length} files exceed ${200} lines`,
      occurrences: analysis.largeFiles.length,
      files: analysis.largeFiles,
      suggestion: 'Split large files into smaller focused modules',
    })
  }

  if (analysis.duplicatePatterns.length > 0) {
    patterns.push({
      type: 'bad',
      category: 'duplicate-validation',
      description: `${analysis.duplicatePatterns.length} duplicate logic patterns detected`,
      occurrences: analysis.duplicatePatterns.length,
      files: [],
      suggestion: 'Extract shared validation into utility functions',
    })
  }

  // Inline styles
  const inlineStyleFiles: string[] = []
  for (const [path, content] of Object.entries(files)) {
    if (/style=\{\{/.test(content)) inlineStyleFiles.push(path)
  }
  if (inlineStyleFiles.length > 2) {
    patterns.push({
      type: 'bad',
      category: 'inline-style',
      description: `${inlineStyleFiles.length} files use inline styles instead of Tailwind`,
      occurrences: inlineStyleFiles.length,
      files: inlineStyleFiles.slice(0, 5),
      suggestion: 'Replace inline styles with Tailwind utility classes',
    })
  }

  // Missing error handling in API routes
  const noErrorHandling: string[] = []
  for (const [path, content] of Object.entries(files)) {
    if (/api\/.*route\.ts$/.test(path) && !/try\s*\{/.test(content)) {
      noErrorHandling.push(path)
    }
  }
  if (noErrorHandling.length > 0) {
    patterns.push({
      type: 'bad',
      category: 'missing-error-handling',
      description: `${noErrorHandling.length} API routes missing try/catch`,
      occurrences: noErrorHandling.length,
      files: noErrorHandling,
      suggestion: 'Wrap all API route handlers in try/catch with NextResponse.json error responses',
    })
  }

  // Magic strings (hardcoded URLs/keys)
  const magicStringFiles: string[] = []
  for (const [path, content] of Object.entries(files)) {
    if (/['"]https?:\/\/[^'"]{10,}['"]/.test(content) && !/\.env/.test(path)) {
      magicStringFiles.push(path)
    }
  }
  if (magicStringFiles.length > 0) {
    patterns.push({
      type: 'bad',
      category: 'magic-string',
      description: `${magicStringFiles.length} files contain hardcoded URLs`,
      occurrences: magicStringFiles.length,
      files: magicStringFiles.slice(0, 5),
      suggestion: 'Move hardcoded URLs to environment variables',
    })
  }

  return patterns
}
