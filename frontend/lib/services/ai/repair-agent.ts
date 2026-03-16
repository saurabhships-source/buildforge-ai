/**
 * AI Code Repair Agent — orchestrates the full detect → analyze → fix → rebuild loop.
 *
 * Priority order per iteration:
 *   1. Check repair memory for known fixes (instant, no AI)
 *   2. Apply deterministic fixes
 *   3. Call AI only for errors with no known fix
 */

import { collectErrors } from './error-collector'
import { analyzeErrors } from './error-analyzer'
import { generateFix } from './fix-generator'
import { applyPatches, rollbackPatch } from './patch-applier'
import { rebuild } from '@/lib/services/build/rebuild'
import { repairMemory, normalizeError } from './repair-memory'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

const MAX_ITERATIONS = 4

export interface RepairIteration {
  iteration: number
  errorsFound: number
  fixesApplied: number
  filesPatched: string[]
  buildPassed: boolean
  memoryHits: number
  aiCalls: number
}

export interface RepairResult {
  /** Final file set after all repairs */
  files: Record<string, string>
  /** true if the final rebuild passed with no errors */
  success: boolean
  /** Number of repair iterations run */
  iterations: number
  /** Per-iteration detail */
  log: RepairIteration[]
  /** Snapshot ID to rollback to if caller decides to revert */
  firstSnapshotId: string | null
}

export type RepairProgressCallback = (msg: string, iteration: number) => void

export interface RepairOptions {
  projectId: string
  modelId?: ModelId
  onProgress?: RepairProgressCallback
}

export async function runRepairAgent(
  /** Raw build output (stderr/stdout from compiler or rebuild()) */
  rawBuildOutput: string,
  /** Current project file set */
  files: Record<string, string>,
  opts: RepairOptions,
): Promise<RepairResult> {
  const { projectId, modelId = 'gemini_flash', onProgress } = opts
  const emit = (msg: string, iter: number) => onProgress?.(msg, iter)

  let currentFiles = { ...files }
  const log: RepairIteration[] = []
  let firstSnapshotId: string | null = null
  let currentOutput = rawBuildOutput

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    emit(`Iteration ${iteration}: collecting errors...`, iteration)

    const errors = collectErrors(currentOutput)
    if (errors.length === 0) {
      logger.info('system', `Repair agent: no errors on iteration ${iteration} — done`)
      log.push({ iteration, errorsFound: 0, fixesApplied: 0, filesPatched: [], buildPassed: true, memoryHits: 0, aiCalls: 0 })
      break
    }

    emit(`Found ${errors.length} error(s), analyzing...`, iteration)
    const analyzed = analyzeErrors(errors)
    const repairable = analyzed.filter(e => e.autoRepairable)

    if (repairable.length === 0) {
      logger.warn('system', `Repair agent: ${errors.length} error(s) found but none are auto-repairable`)
      log.push({ iteration, errorsFound: errors.length, fixesApplied: 0, filesPatched: [], buildPassed: false, memoryHits: 0, aiCalls: 0 })
      break
    }

    // ── Memory-first fix generation ──────────────────────────────────────────
    // generateFix() already checks memory internally, but we log the split here
    emit(`Generating ${repairable.length} fix(es) (checking memory first)...`, iteration)
    const fixes = (
      await Promise.all(repairable.map(e => generateFix(e, currentFiles, modelId)))
    ).filter((f): f is NonNullable<typeof f> => f !== null)

    const memoryHits = fixes.filter(f => f.source === 'memory').length
    const aiCalls = fixes.filter(f => f.source === 'ai').length

    if (memoryHits > 0) {
      emit(`Memory: ${memoryHits} instant fix(es), ${aiCalls} AI call(s)`, iteration)
    }

    if (fixes.length === 0) {
      logger.warn('system', 'Repair agent: fix generator produced no patches')
      log.push({ iteration, errorsFound: errors.length, fixesApplied: 0, filesPatched: [], buildPassed: false, memoryHits: 0, aiCalls: 0 })
      break
    }

    // Apply patches (creates snapshots internally)
    emit(`Applying ${fixes.length} patch(es)...`, iteration)
    const patchResult = applyPatches(projectId, currentFiles, fixes)
    if (iteration === 1 && patchResult.snapshotId) {
      firstSnapshotId = patchResult.snapshotId
    }
    currentFiles = patchResult.files

    // Rebuild to check if errors are resolved
    emit('Rebuilding...', iteration)
    const rebuildResult = await rebuild(currentFiles)
    currentOutput = rebuildResult.output

    // ── If rebuild passed, increment usage for all memory-sourced fixes ──────
    if (rebuildResult.success) {
      for (const fix of fixes) {
        if (fix.source === 'memory' && fix.memoryPattern) {
          repairMemory.incrementUsage(fix.memoryPattern)
        }
      }
    }

    log.push({
      iteration,
      errorsFound: errors.length,
      fixesApplied: patchResult.patched.length,
      filesPatched: patchResult.patched,
      buildPassed: rebuildResult.success,
      memoryHits,
      aiCalls,
    })

    if (rebuildResult.success) {
      logger.info('system', `Repair agent: build passed after ${iteration} iteration(s)`)
      break
    }

    emit(`Build still has errors — continuing...`, iteration)
  }

  const finalRebuild = await rebuild(currentFiles)
  const success = finalRebuild.success

  // If we made things worse (more errors than we started with), rollback
  if (!success && firstSnapshotId) {
    const initialErrors = collectErrors(rawBuildOutput).length
    const finalErrors = collectErrors(finalRebuild.output).length
    if (finalErrors > initialErrors) {
      logger.warn('system', `Repair agent: final error count (${finalErrors}) > initial (${initialErrors}), rolling back`)
      const rolled = rollbackPatch(projectId, firstSnapshotId)
      if (rolled) currentFiles = rolled
    }
  }

  logger.info('system',
    `Repair agent complete: ${success ? 'SUCCESS' : 'PARTIAL'} after ${log.length} iteration(s)`,
    log.map(l => `iter${l.iteration}: ${l.fixesApplied} fixes`).join(', '),
  )

  return {
    files: currentFiles,
    success,
    iterations: log.length,
    log,
    firstSnapshotId,
  }
}
