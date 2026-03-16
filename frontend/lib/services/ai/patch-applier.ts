/**
 * Patch Applier — safely applies CodeFix patches to the project file set.
 * Creates a version snapshot before every patch batch.
 * Never modifies protected files (auth, payments, DB schema).
 */

import { versionControl } from '@/lib/services/version-control'
import { logger } from '@/lib/core/logger'
import type { CodeFix } from './fix-generator'

export interface PatchResult {
  /** Files successfully patched */
  patched: string[]
  /** Files skipped (protected or no change) */
  skipped: string[]
  /** Version snapshot ID created before patching */
  snapshotId: string | null
  /** Updated full file set */
  files: Record<string, string>
}

// ── Protected file guard ──────────────────────────────────────────────────────

const PROTECTED_PATTERNS = [
  /middleware\.ts$/,
  /auth\./,
  /stripe\./,
  /billing\./,
  /webhook/,
  /prisma\/schema/,
  /lib\/db\.ts$/,
]

function isProtected(file: string): boolean {
  return PROTECTED_PATTERNS.some(p => p.test(file))
}

// ── Patch applier ─────────────────────────────────────────────────────────────

export function applyPatches(
  projectId: string,
  currentFiles: Record<string, string>,
  fixes: CodeFix[],
  author = 'repair-agent',
): PatchResult {
  const patched: string[] = []
  const skipped: string[] = []

  // Filter out protected files before touching anything
  const safeFixes = fixes.filter(fix => {
    if (isProtected(fix.file)) {
      logger.warn('system', `Patch blocked — protected file: ${fix.file}`)
      skipped.push(fix.file)
      return false
    }
    return true
  })

  if (safeFixes.length === 0) {
    return { patched, skipped, snapshotId: null, files: currentFiles }
  }

  // ── Snapshot before any changes ───────────────────────────────────────────
  let snapshotId: string | null = null
  try {
    const commit = versionControl.commit(
      projectId,
      currentFiles,
      `[repair-agent] pre-patch snapshot (${safeFixes.length} fix(es) pending)`,
      author,
      ['repair-agent', 'pre-patch'],
    )
    snapshotId = commit.id
    logger.info('system', `Pre-patch snapshot created: ${snapshotId}`)
  } catch (err) {
    logger.warn('system', 'Could not create pre-patch snapshot', err instanceof Error ? err.message : String(err))
  }

  // ── Apply fixes ───────────────────────────────────────────────────────────
  const updatedFiles = { ...currentFiles }

  for (const fix of safeFixes) {
    if (fix.updatedContent === updatedFiles[fix.file]) {
      skipped.push(fix.file)
      continue
    }
    updatedFiles[fix.file] = fix.updatedContent
    patched.push(fix.file)
    logger.info('system', `Patched: ${fix.file}`, fix.description)
  }

  // ── Post-patch snapshot ───────────────────────────────────────────────────
  if (patched.length > 0) {
    try {
      versionControl.commit(
        projectId,
        updatedFiles,
        `[repair-agent] applied ${patched.length} fix(es): ${patched.join(', ')}`,
        author,
        ['repair-agent', 'post-patch'],
      )
    } catch (err) {
      logger.warn('system', 'Could not create post-patch snapshot', err instanceof Error ? err.message : String(err))
    }
  }

  return { patched, skipped, snapshotId, files: updatedFiles }
}

/**
 * Rollback to the pre-patch snapshot if the repair made things worse.
 */
export function rollbackPatch(
  projectId: string,
  snapshotId: string,
): Record<string, string> | null {
  const files = versionControl.restore(snapshotId)
  if (files) {
    logger.info('system', `Rolled back project ${projectId} to snapshot ${snapshotId}`)
    versionControl.commit(
      projectId,
      files,
      `[repair-agent] rollback to ${snapshotId}`,
      'repair-agent',
      ['repair-agent', 'rollback'],
    )
  } else {
    logger.error('system', `Rollback failed — snapshot not found: ${snapshotId}`)
  }
  return files
}
