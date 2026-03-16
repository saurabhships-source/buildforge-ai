/**
 * Export Validator — scans TypeScript files for import/export mismatches.
 * Resolves @/ aliases and reports missing named exports.
 * Uses Node.js fs + regex (no AST dependency required).
 */

import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/core/logger'

export interface ExportMismatch {
  file: string
  missingExport: string
  module: string
}

const PROJECT_ROOT = path.resolve(process.cwd())
const SRC_ROOT = path.join(PROJECT_ROOT) // Next.js app root

/** Resolve @/ alias to absolute path */
function resolveAlias(importPath: string, fromFile: string): string | null {
  if (importPath.startsWith('@/')) {
    return path.join(SRC_ROOT, importPath.slice(2))
  }
  if (importPath.startsWith('.')) {
    return path.resolve(path.dirname(fromFile), importPath)
  }
  return null // external package — skip
}

/** Try to find the actual file on disk (handles .ts, .tsx, /index.ts, etc.) */
function resolveFile(base: string): string | null {
  const exts = ['.ts', '.tsx', '/index.ts', '/index.tsx']
  for (const ext of exts) {
    const candidate = base + ext
    if (fs.existsSync(candidate)) return candidate
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base
  return null
}

/** Extract all named exports from a file's source text */
function extractExports(source: string): Set<string> {
  const exports = new Set<string>()

  // export function Foo / export const Foo / export class Foo / export type Foo / export interface Foo
  const directExport = /export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+(\w+)/g
  let m: RegExpExecArray | null
  while ((m = directExport.exec(source)) !== null) exports.add(m[1])

  // export { Foo, Bar as Baz }
  const namedExport = /export\s*\{([^}]+)\}/g
  while ((m = namedExport.exec(source)) !== null) {
    m[1].split(',').forEach(part => {
      const alias = part.trim().split(/\s+as\s+/).pop()?.trim()
      if (alias && alias !== '') exports.add(alias)
    })
  }

  // export default function Foo / export default class Foo
  const defaultNamed = /export\s+default\s+(?:function|class)\s+(\w+)/g
  while ((m = defaultNamed.exec(source)) !== null) exports.add(m[1])

  return exports
}

/** Extract named imports from a file's source text */
function extractNamedImports(source: string): Array<{ names: string[]; from: string }> {
  const results: Array<{ names: string[]; from: string }> = []
  // import { Foo, Bar } from '...'
  const namedImport = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = namedImport.exec(source)) !== null) {
    const names = m[1]
      .split(',')
      .map(n => n.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean)
    results.push({ names, from: m[2] })
  }
  return results
}

/** Recursively collect all .ts/.tsx files under a directory */
function collectFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectFiles(full, files)
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(full)
  }
  return files
}

/** Main validation function — returns all import/export mismatches */
export function validateExports(rootDir?: string): ExportMismatch[] {
  const root = rootDir ?? SRC_ROOT
  const allFiles = collectFiles(root)
  const mismatches: ExportMismatch[] = []

  // Build export map: absolute path → Set<exportedName>
  const exportMap = new Map<string, Set<string>>()
  for (const file of allFiles) {
    const source = fs.readFileSync(file, 'utf-8')
    exportMap.set(file, extractExports(source))
  }

  // Check each file's imports against the export map
  for (const file of allFiles) {
    const source = fs.readFileSync(file, 'utf-8')
    const imports = extractNamedImports(source)

    for (const { names, from } of imports) {
      const resolved = resolveAlias(from, file)
      if (!resolved) continue // external package

      const resolvedFile = resolveFile(resolved)
      if (!resolvedFile) continue // file not found — handled by TS compiler

      const exported = exportMap.get(resolvedFile)
      if (!exported) continue

      for (const name of names) {
        if (!exported.has(name)) {
          const mismatch: ExportMismatch = {
            file: path.relative(root, file),
            missingExport: name,
            module: from,
          }
          mismatches.push(mismatch)
          logger.error('system', `Import mismatch: "${name}" not exported from "${from}"`, `in ${mismatch.file}`)
        }
      }
    }
  }

  return mismatches
}
