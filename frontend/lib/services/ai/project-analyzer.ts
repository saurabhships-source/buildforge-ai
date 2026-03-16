/**
 * Project Analyzer — analyzes generated projects for quality metrics.
 * Metrics: file count, component reuse, duplicate logic, API consistency.
 */

import { logger } from '@/lib/core/logger'

export interface ProjectAnalysis {
  projectId: string
  fileCount: number
  componentCount: number
  apiRouteCount: number
  avgFileSize: number
  duplicateLogicScore: number   // 0–1, higher = more duplication
  componentReuseScore: number   // 0–1, higher = more reuse
  apiConsistencyScore: number   // 0–1, higher = more consistent
  largeFiles: string[]          // files > 200 lines
  duplicatePatterns: string[]   // detected duplicate code patterns
  sharedComponents: string[]    // components used in multiple places
  analyzedAt: string
}

const LARGE_FILE_THRESHOLD = 200 // lines

export function analyzeProject(
  projectId: string,
  files: Record<string, string>,
): ProjectAnalysis {
  const fileKeys = Object.keys(files)
  const fileCount = fileKeys.length

  // Categorize files
  const componentFiles = fileKeys.filter(f => /components?\//.test(f) && /\.(tsx|jsx)$/.test(f))
  const apiFiles = fileKeys.filter(f => /api\/.*route\.(ts|js)$/.test(f))
  const pageFiles = fileKeys.filter(f => /app\/.*page\.(tsx|jsx)$/.test(f))

  // Avg file size
  const totalChars = fileKeys.reduce((sum, k) => sum + (files[k]?.length ?? 0), 0)
  const avgFileSize = fileCount > 0 ? Math.round(totalChars / fileCount) : 0

  // Large files
  const largeFiles = fileKeys.filter(k => {
    const lines = (files[k] ?? '').split('\n').length
    return lines > LARGE_FILE_THRESHOLD
  })

  // Duplicate logic detection — look for repeated function bodies
  const functionBodies = new Map<string, string[]>()
  for (const [path, content] of Object.entries(files)) {
    const matches = content.matchAll(/(?:function|const)\s+\w+\s*[=(][^{]*\{([^}]{30,200})\}/g)
    for (const m of matches) {
      const body = m[1].trim().replace(/\s+/g, ' ')
      if (!functionBodies.has(body)) functionBodies.set(body, [])
      functionBodies.get(body)!.push(path)
    }
  }
  const duplicatePatterns = [...functionBodies.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([body]) => body.slice(0, 60) + '...')
    .slice(0, 10)

  const duplicateLogicScore = Math.min(1, duplicatePatterns.length / 10)

  // Component reuse — find components imported in multiple files
  const importCounts = new Map<string, number>()
  for (const content of Object.values(files)) {
    const imports = content.matchAll(/from\s+['"]([^'"]+)['"]/g)
    for (const m of imports) {
      const mod = m[1]
      if (mod.includes('components')) {
        importCounts.set(mod, (importCounts.get(mod) ?? 0) + 1)
      }
    }
  }
  const sharedComponents = [...importCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([mod]) => mod)
    .slice(0, 20)

  const componentReuseScore = componentFiles.length > 0
    ? Math.min(1, sharedComponents.length / componentFiles.length)
    : 0

  // API consistency — check if routes follow consistent patterns
  let consistentRoutes = 0
  for (const f of apiFiles) {
    const content = files[f] ?? ''
    const hasExportGet = /export\s+(?:async\s+)?function\s+GET/.test(content)
    const hasExportPost = /export\s+(?:async\s+)?function\s+POST/.test(content)
    const hasNextResponse = /NextResponse/.test(content)
    if ((hasExportGet || hasExportPost) && hasNextResponse) consistentRoutes++
  }
  const apiConsistencyScore = apiFiles.length > 0
    ? consistentRoutes / apiFiles.length
    : 1

  logger.info('system', `Project analysis complete: ${projectId}`, `${fileCount} files, ${duplicatePatterns.length} duplicates`)

  return {
    projectId,
    fileCount,
    componentCount: componentFiles.length,
    apiRouteCount: apiFiles.length,
    avgFileSize,
    duplicateLogicScore,
    componentReuseScore,
    apiConsistencyScore,
    largeFiles,
    duplicatePatterns,
    sharedComponents,
    analyzedAt: new Date().toISOString(),
  }
}
