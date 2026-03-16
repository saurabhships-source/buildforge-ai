/**
 * Improve Agent — runs a full improvement pass over all project files,
 * then runs the repair agent to ensure nothing broke.
 */

import { improveCode } from './improve'
import { runRepairAgent } from './repair-agent'
import { rebuild } from '@/lib/services/build/rebuild'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

const IMPROVEMENT_PASSES = [
  { instruction: 'Improve UI design: better spacing, typography, and visual hierarchy', fileTypes: ['html', 'tsx', 'jsx'] },
  { instruction: 'Optimize performance: remove unused code, add loading states', fileTypes: ['js', 'ts', 'tsx'] },
  { instruction: 'Fix accessibility: add aria labels, improve contrast, keyboard navigation', fileTypes: ['html', 'tsx'] },
]

export interface ImproveAgentResult {
  files: Record<string, string>
  improvements: string[]
  filesImproved: number
  buildPassed: boolean
}

export async function runImproveAgent(
  currentFiles: Record<string, string>,
  projectId: string,
  modelId: ModelId = 'gemini_flash',
  onProgress?: (msg: string) => void,
): Promise<ImproveAgentResult> {
  const emit = (msg: string) => onProgress?.(msg)
  const improvements: string[] = []
  let updatedFiles = { ...currentFiles }
  let filesImproved = 0

  // Run each improvement pass over relevant files
  for (const pass of IMPROVEMENT_PASSES) {
    const targets = Object.entries(updatedFiles).filter(([path]) => {
      const ext = path.split('.').pop() ?? ''
      return pass.fileTypes.includes(ext)
    })

    for (const [path, content] of targets.slice(0, 3)) { // cap at 3 files per pass
      emit(`Improving ${path}: ${pass.instruction.slice(0, 40)}...`)
      try {
        const result = await improveCode(content, pass.instruction, path, modelId)
        if (result.content !== content) {
          updatedFiles[path] = result.content
          filesImproved++
          improvements.push(`${path}: ${result.summary}`)
          logger.info('ai-pipeline', `Improved ${path}`)
        }
      } catch (err) {
        logger.warn('ai-pipeline', `Improve failed for ${path}`, err instanceof Error ? err.message : String(err))
      }
    }
  }

  // Repair anything that broke
  emit('Running repair check...')
  const rebuildResult = await rebuild(updatedFiles)
  if (!rebuildResult.success) {
    emit('Repairing post-improvement errors...')
    const repairResult = await runRepairAgent(rebuildResult.output, updatedFiles, {
      projectId,
      modelId,
      onProgress: emit,
    })
    updatedFiles = repairResult.files
  }

  const finalRebuild = await rebuild(updatedFiles)

  logger.info('ai-pipeline', `Improve agent done: ${filesImproved} files improved`)

  return {
    files: updatedFiles,
    improvements,
    filesImproved,
    buildPassed: finalRebuild.success,
  }
}
