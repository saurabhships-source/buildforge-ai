// Sandbox Builder — applies a patch to an isolated in-memory environment
// Does NOT touch the production filesystem — all operations are in-memory

import type { GeneratedPatch, PatchFile } from './patch-generator'

export interface SandboxEnvironment {
  id: string
  patchId: string
  files: Record<string, string>
  appliedAt: string
  status: 'building' | 'ready' | 'failed'
  error?: string
}

export interface SandboxResult {
  sandboxId: string
  success: boolean
  files: Record<string, string>
  appliedFiles: string[]
  skippedFiles: string[]
  error?: string
}

// Protected paths — never apply patches to these even in sandbox
const PROTECTED_PATHS = [
  'middleware.ts',
  'lib/stripe',
  'lib/db',
  'prisma/',
  'app/api/billing',
  'app/(auth)',
]

function isProtected(path: string): boolean {
  return PROTECTED_PATHS.some(p => path.includes(p))
}

// In-memory sandbox store (keyed by sandboxId)
const sandboxStore = new Map<string, SandboxEnvironment>()

export function buildSandbox(patch: GeneratedPatch): SandboxResult {
  const sandboxId = `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const appliedFiles: string[] = []
  const skippedFiles: string[] = []
  const sandboxFiles: Record<string, string> = {}

  try {
    for (const file of patch.files) {
      if (isProtected(file.path)) {
        skippedFiles.push(file.path)
        console.warn(`[sandbox] Skipped protected file: ${file.path}`)
        continue
      }

      // Validate the patch content
      const validated = validatePatchContent(file)
      if (!validated.valid) {
        skippedFiles.push(file.path)
        console.warn(`[sandbox] Skipped invalid patch for ${file.path}: ${validated.reason}`)
        continue
      }

      sandboxFiles[file.path] = file.changes
      appliedFiles.push(file.path)
    }

    const env: SandboxEnvironment = {
      id: sandboxId,
      patchId: patch.id,
      files: sandboxFiles,
      appliedAt: new Date().toISOString(),
      status: 'ready',
    }
    sandboxStore.set(sandboxId, env)

    return {
      sandboxId,
      success: true,
      files: sandboxFiles,
      appliedFiles,
      skippedFiles,
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Sandbox build failed'
    sandboxStore.set(sandboxId, {
      id: sandboxId,
      patchId: patch.id,
      files: {},
      appliedAt: new Date().toISOString(),
      status: 'failed',
      error,
    })
    return { sandboxId, success: false, files: {}, appliedFiles, skippedFiles, error }
  }
}

function validatePatchContent(file: PatchFile): { valid: boolean; reason?: string } {
  if (!file.changes || file.changes.trim().length < 5) {
    return { valid: false, reason: 'Empty patch content' }
  }
  // Reject patches that contain dangerous patterns
  const dangerous = ['process.exit', 'eval(', 'Function(', '__dirname', 'require(\'fs\')']
  for (const d of dangerous) {
    if (file.changes.includes(d)) {
      return { valid: false, reason: `Contains dangerous pattern: ${d}` }
    }
  }
  return { valid: true }
}

export function getSandbox(sandboxId: string): SandboxEnvironment | null {
  return sandboxStore.get(sandboxId) ?? null
}

export function clearSandbox(sandboxId: string): void {
  sandboxStore.delete(sandboxId)
}
