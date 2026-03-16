// Dependency-aware patch system
// Builds an import dependency map for the virtual file system so that
// when a file changes, all files that import it are also checked/updated.

export type DependencyMap = Record<string, string[]> // file → files that import it (reverse map)
export type ImportMap = Record<string, string[]>     // file → files it imports

/**
 * Extract all import paths from a file's content.
 * Handles: import ... from '...', require('...'), dynamic import('...')
 */
export function extractImports(content: string): string[] {
  const imports: string[] = []
  // Static imports: import X from './path'
  const staticRe = /import\s+(?:[\w*{},\s]+\s+from\s+)?['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = staticRe.exec(content)) !== null) imports.push(m[1])
  // require('...')
  const requireRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((m = requireRe.exec(content)) !== null) imports.push(m[1])
  // dynamic import('...')
  const dynamicRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((m = dynamicRe.exec(content)) !== null) imports.push(m[1])
  return imports
}

/**
 * Resolve a relative import path to a canonical file path in the virtual FS.
 * e.g. from 'components/Navbar.tsx', import '../components/Hero' → 'components/Hero.tsx'
 */
function resolveImport(fromFile: string, importPath: string, allFiles: string[]): string | null {
  // Skip node_modules and absolute paths
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) return null

  const fromDir = fromFile.includes('/') ? fromFile.split('/').slice(0, -1).join('/') : ''
  const parts = (fromDir ? `${fromDir}/${importPath}` : importPath).split('/')
  // Normalize ../ and ./
  const resolved: string[] = []
  for (const p of parts) {
    if (p === '..') resolved.pop()
    else if (p !== '.') resolved.push(p)
  }
  const base = resolved.join('/')

  // Try exact match first, then with extensions
  if (allFiles.includes(base)) return base
  for (const ext of ['.tsx', '.ts', '.jsx', '.js', '.css', '.json']) {
    if (allFiles.includes(base + ext)) return base + ext
  }
  // Try index files
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const idx = `${base}/index${ext}`
    if (allFiles.includes(idx)) return idx
  }
  return null
}

/**
 * Build a full import map (file → what it imports) and
 * reverse dependency map (file → who imports it).
 */
export function buildDependencyMaps(files: Record<string, string>): {
  importMap: ImportMap
  dependencyMap: DependencyMap
} {
  const allFiles = Object.keys(files)
  const importMap: ImportMap = {}
  const dependencyMap: DependencyMap = {}

  for (const file of allFiles) {
    importMap[file] = []
    dependencyMap[file] = []
  }

  for (const [file, content] of Object.entries(files)) {
    const rawImports = extractImports(content)
    for (const raw of rawImports) {
      const resolved = resolveImport(file, raw, allFiles)
      if (resolved) {
        importMap[file].push(resolved)
        if (!dependencyMap[resolved]) dependencyMap[resolved] = []
        if (!dependencyMap[resolved].includes(file)) {
          dependencyMap[resolved].push(file)
        }
      }
    }
  }

  return { importMap, dependencyMap }
}

/**
 * Given a set of changed files, return all files that transitively depend on them.
 * Used to determine which files need to be re-validated after a patch.
 */
export function getAffectedFiles(
  changedFiles: string[],
  dependencyMap: DependencyMap,
  maxDepth = 3
): string[] {
  const affected = new Set<string>()
  const queue = [...changedFiles]
  let depth = 0

  while (queue.length > 0 && depth < maxDepth) {
    const next: string[] = []
    for (const file of queue) {
      const dependents = dependencyMap[file] ?? []
      for (const dep of dependents) {
        if (!affected.has(dep) && !changedFiles.includes(dep)) {
          affected.add(dep)
          next.push(dep)
        }
      }
    }
    queue.splice(0, queue.length, ...next)
    depth++
  }

  return Array.from(affected)
}

export interface ImportValidationResult {
  valid: boolean
  brokenImports: Array<{ file: string; importPath: string; reason: string }>
  warnings: string[]
}

/**
 * Validate that all imports in the patched files still resolve correctly.
 * Returns broken imports so the patch system can warn or auto-fix.
 */
export function validateImports(
  files: Record<string, string>,
  changedFiles: string[]
): ImportValidationResult {
  const allFiles = Object.keys(files)
  const brokenImports: ImportValidationResult['brokenImports'] = []
  const warnings: string[] = []

  // Check all changed files + their dependents
  const { dependencyMap } = buildDependencyMaps(files)
  const toCheck = new Set([...changedFiles, ...getAffectedFiles(changedFiles, dependencyMap)])

  for (const file of toCheck) {
    if (!files[file]) {
      warnings.push(`File ${file} was referenced but does not exist`)
      continue
    }
    const rawImports = extractImports(files[file])
    for (const raw of rawImports) {
      if (!raw.startsWith('.') && !raw.startsWith('/')) continue // skip node_modules
      const resolved = resolveImport(file, raw, allFiles)
      if (!resolved) {
        brokenImports.push({
          file,
          importPath: raw,
          reason: `Cannot resolve '${raw}' from '${file}'`,
        })
      }
    }
  }

  return {
    valid: brokenImports.length === 0,
    brokenImports,
    warnings,
  }
}

/**
 * Build a human-readable dependency summary for the AI patch prompt.
 * Tells the AI which files import which, so it can update them if needed.
 */
export function buildDependencyContext(
  files: Record<string, string>,
  focusFiles: string[]
): string {
  const { importMap, dependencyMap } = buildDependencyMaps(files)
  const lines: string[] = ['DEPENDENCY MAP (for context):']

  for (const file of focusFiles) {
    const imports = importMap[file] ?? []
    const importedBy = dependencyMap[file] ?? []
    if (imports.length > 0) {
      lines.push(`  ${file} imports: ${imports.join(', ')}`)
    }
    if (importedBy.length > 0) {
      lines.push(`  ${file} is imported by: ${importedBy.join(', ')}`)
    }
  }

  if (lines.length === 1) return '' // nothing to show
  return lines.join('\n')
}
