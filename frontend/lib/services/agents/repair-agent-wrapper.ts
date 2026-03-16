/**
 * Repair Agent Wrapper — runs build checks, collects errors, generates fixes, applies patches, rebuilds.
 * Fourth agent in the multi-agent pipeline.
 */

import { rebuild } from '@/lib/services/build/rebuild'
import { runRepairAgent } from '@/lib/services/ai/repair-agent'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface RepairAgentWrapperResult {
  files: Record<string, string>
  buildSuccess: boolean
  repairIterations: number
  errorsFixed: number
}

export async function runRepairAgentWrapper(
  projectId: string,
  files: Record<string, string>,
  modelId: ModelId = 'gemini_flash',
  onProgress?: (msg: string) => void,
): Promise<RepairAgentWrapperResult> {
  const emit = (msg: string) => {
    onProgress?.(msg)
    logger.info('ai-pipeline', `[RepairAgent] ${msg}`)
  }

  emit('Running initial build check...')
  const initial = await rebuild(files)

  if (initial.success) {
    emit('Build passed — no repairs needed')
    return { files, buildSuccess: true, repairIterations: 0, errorsFixed: 0 }
  }

  emit(`Build failed — starting repair loop...`)
  const result = await runRepairAgent(initial.output, files, {
    projectId,
    modelId,
    onProgress: (msg) => emit(msg),
  })

  const totalFixed = result.log.reduce((sum, l) => sum + l.fixesApplied, 0)
  emit(`Repair complete: ${result.success ? 'SUCCESS' : 'PARTIAL'} — ${totalFixed} fixes applied`)

  return {
    files: result.files,
    buildSuccess: result.success,
    repairIterations: result.iterations,
    errorsFixed: totalFixed,
  }
}
