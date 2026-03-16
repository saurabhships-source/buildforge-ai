/**
 * Agent Coordinator — orchestrates the full multi-agent pipeline.
 *
 * Pipeline:
 *   prompt → ProductBrainAgent → ArchitectAgent → BuilderAgent → RepairAgent → DeployAgent
 *
 * Returns: { projectId, previewUrl, deploymentUrl }
 */

import { runProductBrainAgent } from './product-brain-agent'
import { runArchitectAgent } from './architect-agent'
import { runBuilderAgent } from './builder-agent'
import { runRepairAgentWrapper } from './repair-agent-wrapper'
import { runDeployAgent } from './deploy-agent'
import { projectStorage } from '@/lib/services/storage/project-storage'
import { analyzeProject } from '@/lib/services/ai/project-analyzer'
import { extractPatterns } from '@/lib/services/ai/pattern-extractor'
import { scoreProject } from '@/lib/services/ai/project-scorer'
import { generatorFeedback } from '@/lib/services/ai/generator-feedback'
import { deriveRules } from '@/lib/services/ai/generator-improver'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

export type AgentStage =
  | 'brain' | 'architect' | 'builder' | 'repair' | 'deploy' | 'analyze' | 'done'

export interface AgentProgress {
  stage: AgentStage
  message: string
  agentName: string
}

export interface CoordinatorOptions {
  ownerId?: string
  modelId?: ModelId
  deploy?: boolean
  deployProvider?: 'vercel' | 'netlify'
  onProgress?: (progress: AgentProgress) => void
}

export interface CoordinatorResult {
  projectId: string
  previewUrl: string
  deploymentUrl: string | null
  deployJobId: string | null
  files: Record<string, string>
  fileCount: number
  qualityScore: number
  qualityGrade: string
  needsClarification: boolean
  clarificationQuestions: string[]
  agentLog: { agent: string; duration: number; success: boolean }[]
}

export async function runAgentCoordinator(
  prompt: string,
  opts: CoordinatorOptions = {},
): Promise<CoordinatorResult> {
  const {
    ownerId = 'anonymous',
    modelId = 'gemini_flash',
    deploy = false,
    deployProvider = 'vercel',
    onProgress,
  } = opts

  const emit = (stage: AgentStage, agentName: string, message: string) => {
    onProgress?.({ stage, message, agentName })
    logger.info('ai-pipeline', `[Coordinator:${agentName}] ${message}`)
  }

  const agentLog: CoordinatorResult['agentLog'] = []
  const track = async <T>(agent: string, fn: () => Promise<T>): Promise<T> => {
    const start = Date.now()
    try {
      const result = await fn()
      agentLog.push({ agent, duration: Date.now() - start, success: true })
      return result
    } catch (err) {
      agentLog.push({ agent, duration: Date.now() - start, success: false })
      throw err
    }
  }

  // ── Stage 1: Product Brain ─────────────────────────────────────────────────
  emit('brain', 'ProductBrainAgent', 'Interpreting idea...')
  const brainResult = await track('ProductBrainAgent', () =>
    runProductBrainAgent(prompt, modelId)
  )

  if (brainResult.needsClarification) {
    return {
      projectId: '',
      previewUrl: '',
      deploymentUrl: null,
      deployJobId: null,
      files: {},
      fileCount: 0,
      qualityScore: 0,
      qualityGrade: 'N/A',
      needsClarification: true,
      clarificationQuestions: brainResult.clarificationQuestions,
      agentLog,
    }
  }

  emit('brain', 'ProductBrainAgent', `${brainResult.brain.productName} — ${brainResult.brain.productType}`)

  // ── Stage 2: Architect ─────────────────────────────────────────────────────
  emit('architect', 'ArchitectAgent', 'Designing architecture...')
  const architecture = await track('ArchitectAgent', () =>
    runArchitectAgent(brainResult)
  )
  emit('architect', 'ArchitectAgent', `${architecture.folderStructure.length} folders, ${architecture.apiRoutes.length} routes`)

  // ── Stage 3: Builder ───────────────────────────────────────────────────────
  emit('builder', 'BuilderAgent', 'Generating code...')
  const builderResult = await track('BuilderAgent', () =>
    runBuilderAgent(brainResult, architecture, modelId, msg => emit('builder', 'BuilderAgent', msg))
  )
  emit('builder', 'BuilderAgent', `${builderResult.fileCount} files generated`)

  // ── Stage 4: Repair ────────────────────────────────────────────────────────
  const projectId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  emit('repair', 'RepairAgent', 'Running build checks...')
  const repairResult = await track('RepairAgent', () =>
    runRepairAgentWrapper(projectId, builderResult.files, modelId, msg => emit('repair', 'RepairAgent', msg))
  )
  emit('repair', 'RepairAgent', `${repairResult.buildSuccess ? 'Build passed' : 'Partial repair'} — ${repairResult.errorsFixed} fixes`)

  const finalFiles = repairResult.files

  // ── Save project ───────────────────────────────────────────────────────────
  projectStorage.save({
    id: projectId,
    name: brainResult.brain.productName,
    description: brainResult.brain.description,
    ownerId,
    files: finalFiles,
    deploymentUrl: null,
    previewUrl: `/preview/${projectId}`,
    createdAt: new Date().toISOString(),
    metadata: {
      brain: brainResult.brain,
      architecture,
      agentPipeline: true,
    },
  })

  // ── Stage 5: Deploy (optional) ─────────────────────────────────────────────
  let deployJobId: string | null = null
  let deploymentUrl: string | null = null

  if (deploy) {
    emit('deploy', 'DeployAgent', `Deploying to ${deployProvider}...`)
    const deployResult = await track('DeployAgent', () =>
      runDeployAgent(projectId, ownerId, brainResult.brain.productName, finalFiles, deployProvider,
        msg => emit('deploy', 'DeployAgent', msg))
    )
    deployJobId = deployResult.jobId || null
    deploymentUrl = deployResult.deploymentUrl
  }

  // ── Stage 6: Analyze (async) ───────────────────────────────────────────────
  emit('analyze', 'AnalyzeAgent', 'Scoring project quality...')
  let qualityScore = 0
  let qualityGrade = 'B'

  try {
    const analysis = analyzeProject(projectId, finalFiles)
    const patterns = extractPatterns(finalFiles, analysis)
    const score = scoreProject({
      projectId,
      analysis,
      patterns,
      buildSuccess: repairResult.buildSuccess,
      repairIterations: repairResult.repairIterations,
      deploySuccess: !!deployJobId,
    })

    qualityScore = score.total
    qualityGrade = score.grade

    for (const p of patterns) {
      generatorFeedback.record(
        p.category, p.description,
        p.type === 'bad' ? 'negative' : 'positive',
        'all', p.suggestion, score.total,
      )
    }
    deriveRules()

    emit('analyze', 'AnalyzeAgent', `Quality: ${score.grade} (${score.total}/100)`)
  } catch (err) {
    logger.warn('system', 'Quality analysis failed', err instanceof Error ? err.message : String(err))
  }

  emit('done', 'Coordinator', `Project ${projectId} ready`)

  return {
    projectId,
    previewUrl: `/preview/${projectId}`,
    deploymentUrl,
    deployJobId,
    files: finalFiles,
    fileCount: Object.keys(finalFiles).length,
    qualityScore,
    qualityGrade,
    needsClarification: false,
    clarificationQuestions: [],
    agentLog,
  }
}
