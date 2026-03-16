/**
 * Command Agent — interprets natural language builder commands,
 * modifies project files, and triggers a rebuild.
 * Wraps the existing processCommand() with repair + rebuild integration.
 */

import { processCommand, detectCommandType } from './command'
import { runRepairAgent } from './repair-agent'
import { rebuild } from '@/lib/services/build/rebuild'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface CommandAgentResult {
  files: Record<string, string>
  description: string
  commandType: string
  repaired: boolean
  buildPassed: boolean
}

export async function runCommandAgent(
  command: string,
  currentFiles: Record<string, string>,
  projectId: string,
  modelId: ModelId = 'gemini_flash',
  onProgress?: (msg: string) => void,
): Promise<CommandAgentResult> {
  const emit = (msg: string) => onProgress?.(msg)

  emit(`Processing: "${command}"`)
  logger.info('ai-pipeline', `Command agent: ${command.slice(0, 80)}`)

  const commandType = detectCommandType(command)
  const result = await processCommand(command, currentFiles, modelId)

  // Merge changes into current files
  let updatedFiles: Record<string, string> = {
    ...currentFiles,
    ...result.updatedFiles,
    ...result.newFiles,
  }

  emit('Checking for errors...')
  const rebuildResult = await rebuild(updatedFiles)

  let repaired = false
  if (!rebuildResult.success) {
    emit('Repairing errors...')
    const repairResult = await runRepairAgent(rebuildResult.output, updatedFiles, {
      projectId,
      modelId,
      onProgress: (msg) => emit(msg),
    })
    updatedFiles = repairResult.files
    repaired = true
  }

  const finalRebuild = await rebuild(updatedFiles)

  logger.info('ai-pipeline', `Command agent done: ${result.description}`)

  return {
    files: updatedFiles,
    description: result.description,
    commandType,
    repaired,
    buildPassed: finalRebuild.success,
  }
}
