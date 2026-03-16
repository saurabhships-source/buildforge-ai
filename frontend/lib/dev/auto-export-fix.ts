/**
 * Auto Export Fix — reads files with missing exports and patches them.
 * Converts bare function/class declarations to named exports.
 * Converts default exports to named exports when a named import is expected.
 */

import fs from 'fs'
import path from 'path'
import { validateExports, type ExportMismatch } from './export-validator'
import { logger } from '@/lib/core/logger'

const PROJECT_ROOT = path.resolve(process.cwd())

/** Convert `function Foo(` → `export function Foo(` */
function addNamedExport(source: string, name: string): string {
  // Already exported — nothing to do
  if (new RegExp(`export\\s+(?:async\\s+)?(?:function|const|class)\\s+${name}\\b`).test(source)) {
    return source
  }

  // Bare function declaration
  source = source.replace(
    new RegExp(`(^|\\n)(\\s*)(async\\s+)?function\\s+(${name})\\b`),
    (_, pre, indent, asyncKw, fn) => `${pre}${indent}export ${asyncKw ?? ''}function ${fn}`,
  )

  // Bare class declaration
  source = source.replace(
    new RegExp(`(^|\\n)(\\s*)class\\s+(${name})\\b`),
    (_, pre, indent, cls) => `${pre}${indent}export class ${cls}`,
  )

  // Bare const/let/var arrow function
  source = source.replace(
    new RegExp(`(^|\\n)(\\s*)const\\s+(${name})\\s*=`),
    (_, pre, indent, varName) => `${pre}${indent}export const ${varName} =`,
  )

  return source
}

/** Convert `export default function Foo(` → `export function Foo(` */
function convertDefaultToNamed(source: string, name: string): string {
  // export default function Foo
  source = source.replace(
    /export\s+default\s+function\s+(\w+)/g,
    (_, fn) => `export function ${fn}`,
  )
  // export default class Foo
  source = source.replace(
    /export\s+default\s+class\s+(\w+)/g,
    (_, cls) => `export class ${cls}`,
  )
  // anonymous: export default function() → export function <Name>()
  source = source.replace(
    /export\s+default\s+function\s*\(/,
    `export function ${name}(`,
  )
  return source
}

/** Fix a single file for a given missing export name */
function fixFile(absolutePath: string, missingName: string): boolean {
  if (!fs.existsSync(absolutePath)) return false

  let source = fs.readFileSync(absolutePath, 'utf-8')
  const original = source

  // Try converting default export first
  source = convertDefaultToNamed(source, missingName)
  // Then ensure named export exists
  source = addNamedExport(source, missingName)

  if (source !== original) {
    fs.writeFileSync(absolutePath, source, 'utf-8')
    logger.info('system', `Auto-fixed export "${missingName}" in ${absolutePath}`)
    return true
  }

  logger.warn('system', `Could not auto-fix "${missingName}" in ${absolutePath} — manual fix required`)
  return false
}

/** Resolve @/ alias to absolute path with extension probing */
function resolveModulePath(modulePath: string): string | null {
  let base: string
  if (modulePath.startsWith('@/')) {
    base = path.join(PROJECT_ROOT, modulePath.slice(2))
  } else {
    return null
  }

  const exts = ['.ts', '.tsx', '/index.ts', '/index.tsx', '']
  for (const ext of exts) {
    const candidate = base + ext
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  return null
}

/** Main entry point — validate and fix all mismatches */
export function autoFixMissingExports(rootDir?: string): { fixed: number; failed: ExportMismatch[] } {
  const mismatches = validateExports(rootDir)

  if (mismatches.length === 0) {
    logger.info('system', 'No export mismatches found — nothing to fix')
    return { fixed: 0, failed: [] }
  }

  let fixed = 0
  const failed: ExportMismatch[] = []

  for (const mismatch of mismatches) {
    const absolutePath = resolveModulePath(mismatch.module)
    if (!absolutePath) {
      failed.push(mismatch)
      continue
    }

    const success = fixFile(absolutePath, mismatch.missingExport)
    if (success) fixed++
    else failed.push(mismatch)
  }

  logger.info('system', `Auto-fix complete: ${fixed} fixed, ${failed.length} require manual attention`)
  return { fixed, failed }
}
