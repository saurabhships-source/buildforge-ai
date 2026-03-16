/**
 * Rebuild — lightweight in-process "build validator" for generated static sites.
 * Since generated apps are HTML/CSS/JS (not Next.js), "building" means:
 *   1. Validate HTML structure
 *   2. Check JS for syntax errors via Function() parse
 *   3. Verify all <script src> and <link href> references exist in the file set
 *   4. Check for common React/TS patterns if applicable
 *
 * Returns a raw error string (like compiler stderr) that error-collector can parse.
 */

import { logger } from '@/lib/core/logger'

export interface RebuildResult {
  /** true = no blocking errors found */
  success: boolean
  /** Raw error output — feed into collectErrors() */
  output: string
  /** Number of files checked */
  filesChecked: number
}

// ── HTML validator ────────────────────────────────────────────────────────────

function validateHtml(path: string, content: string, allFiles: Record<string, string>): string[] {
  const errors: string[] = []

  if (!content.includes('<!DOCTYPE') && !content.includes('<!doctype')) {
    errors.push(`${path}:1:1 SyntaxError: Missing DOCTYPE declaration`)
  }
  if (!content.includes('<html')) {
    errors.push(`${path}:1:1 SyntaxError: Missing <html> element`)
  }

  // Check referenced scripts/styles exist
  const scriptRefs = [...content.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => m[1])
  const linkRefs = [...content.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)].map(m => m[1])

  for (const ref of [...scriptRefs, ...linkRefs]) {
    // Skip CDN / absolute URLs
    if (ref.startsWith('http') || ref.startsWith('//')) continue
    const normalized = ref.replace(/^\.\//, '')
    if (!allFiles[normalized] && !allFiles[ref]) {
      errors.push(`${path}: Module not found: '${ref}' (referenced but not in project files)`)
    }
  }

  return errors
}

// ── JS syntax validator ───────────────────────────────────────────────────────

function validateJs(path: string, content: string): string[] {
  const errors: string[] = []
  try {
    // eslint-disable-next-line no-new-func
    new Function(content)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    errors.push(`${path}: SyntaxError: ${msg}`)
  }
  return errors
}

// ── Export consistency check ──────────────────────────────────────────────────

function validateExportConsistency(
  path: string,
  content: string,
  allFiles: Record<string, string>,
): string[] {
  const errors: string[] = []

  // Find named imports: import { Foo } from './bar'
  const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = importRe.exec(content)) !== null) {
    const names = m[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
    const from = m[2]

    // Only check relative imports
    if (!from.startsWith('.') && !from.startsWith('@/')) continue

    // Resolve path
    const base = from.replace(/^@\//, '').replace(/^\.\//, '')
    const candidates = [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`, base]
    const targetContent = candidates.map(c => allFiles[c]).find(Boolean)
    if (!targetContent) continue

    for (const name of names) {
      const exportRe = new RegExp(`export\\s+(?:async\\s+)?(?:function|const|class|type|interface|enum)\\s+${name}\\b`)
      const namedRe = new RegExp(`export\\s*\\{[^}]*\\b${name}\\b`)
      if (!exportRe.test(targetContent) && !namedRe.test(targetContent)) {
        errors.push(`${path}: Export '${name}' doesn't exist in target module '${from}'`)
      }
    }
  }

  return errors
}

// ── Main rebuild ──────────────────────────────────────────────────────────────

export async function rebuild(files: Record<string, string>): Promise<RebuildResult> {
  const allErrors: string[] = []
  let filesChecked = 0

  for (const [path, content] of Object.entries(files)) {
    if (!content) continue
    filesChecked++
    const ext = path.split('.').pop()?.toLowerCase()

    if (ext === 'html') {
      allErrors.push(...validateHtml(path, content, files))
    } else if (ext === 'js') {
      allErrors.push(...validateJs(path, content))
    } else if (ext === 'ts' || ext === 'tsx') {
      allErrors.push(...validateExportConsistency(path, content, files))
    }
  }

  const success = allErrors.length === 0
  const output = allErrors.join('\n')

  if (!success) {
    logger.warn('system', `Rebuild found ${allErrors.length} issue(s)`, output.slice(0, 300))
  } else {
    logger.info('system', `Rebuild passed — ${filesChecked} files checked`)
  }

  return { success, output, filesChecked }
}
