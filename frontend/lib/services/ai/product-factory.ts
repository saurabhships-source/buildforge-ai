/**
 * Product Factory — unified SaaS generation pipeline.
 *
 * Prompt → Intent → Plan → Architecture → Frontend → Backend → DB
 *        → Integration → Repair → Preview → Deploy
 */

import { analyzeProductIntent } from './product-intent'
import { planProduct } from './product-planner'
import { buildProductArchitecture } from './product-architecture'
import { generateAllFrontendFiles } from './frontend-generator'
import { generateAllBackendFiles } from './backend-generator'
import { generateAllDatabaseFiles } from './database-generator'
import { runIntegrationAgent } from './integration-agent'
import { runRepairAgent } from './repair-agent'
import { rebuild } from '@/lib/services/build/rebuild'
import { deployProject } from '@/lib/services/deploy/deployment-engine'
import { projectStorage, LIMITS } from '@/lib/services/storage/project-storage'
import { promptCache } from '@/lib/services/cache/prompt-cache'
import { logger } from '@/lib/core/logger'
import { analyzeProject } from './project-analyzer'
import { extractPatterns } from './pattern-extractor'
import { scoreProject } from './project-scorer'
import { generatorFeedback } from './generator-feedback'
import { deriveRules } from './generator-improver'
import type { ModelId } from '@/lib/ai-engine/model-router'

// ── Rate limiting ─────────────────────────────────────────────────────────────

const activeGenerations = new Map<string, number>() // ownerId → count
const MAX_CONCURRENT_PER_USER = 2
const GENERATION_TIMEOUT_MS = 60_000

export type FactoryStage =
  | 'cache-check' | 'intent' | 'plan' | 'architecture'
  | 'frontend' | 'backend' | 'database' | 'integration'
  | 'repair' | 'storage' | 'deploy' | 'analyze' | 'done'

export interface FactoryProgress {
  stage: FactoryStage
  message: string
  detail?: string
}

export interface ProductFactoryResult {
  projectId: string
  previewUrl: string
  deploymentUrl: string | null
  deployJobId: string | null
  files: Record<string, string>
  fileCount: number
  fromCache: boolean
  qualityScore?: number
  qualityGrade?: string
}

export interface FactoryOptions {
  ownerId?: string
  ownerName?: string
  modelId?: ModelId
  deploy?: boolean
  deployProvider?: 'vercel' | 'netlify'
  onProgress?: (progress: FactoryProgress) => void
}

export async function buildProduct(
  prompt: string,
  opts: FactoryOptions = {},
): Promise<ProductFactoryResult> {
  const {
    ownerId = 'anonymous',
    ownerName = 'anonymous',
    modelId = 'gemini_flash',
    deploy = false,
    deployProvider = 'vercel',
    onProgress,
  } = opts

  const emit = (stage: FactoryStage, message: string, detail?: string) => {
    onProgress?.({ stage, message, detail })
    logger.info('ai-pipeline', `[factory] ${stage}: ${message}`, detail)
  }

  // ── Rate limit check ───────────────────────────────────────────────────────
  const active = activeGenerations.get(ownerId) ?? 0
  if (active >= MAX_CONCURRENT_PER_USER) {
    throw new Error(`Rate limit: max ${MAX_CONCURRENT_PER_USER} concurrent generations per user`)
  }
  activeGenerations.set(ownerId, active + 1)

  const timeout = setTimeout(() => {
    activeGenerations.set(ownerId, Math.max(0, (activeGenerations.get(ownerId) ?? 1) - 1))
  }, GENERATION_TIMEOUT_MS)

  try {
    // ── Cache check ──────────────────────────────────────────────────────────
    emit('cache-check', 'Checking prompt cache...')
    const cached = promptCache.get(prompt)
    if (cached) {
      emit('cache-check', 'Cache hit — returning cached blueprint')
      const projectId = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      projectStorage.save({
        id: projectId,
        name: cached.intent.name,
        description: cached.intent.description,
        ownerId,
        files: cached.files,
        deploymentUrl: null,
        previewUrl: `/preview/${projectId}`,
        createdAt: new Date().toISOString(),
        metadata: { fromCache: true },
      })
      emit('done', 'Done (from cache)')
      return {
        projectId,
        previewUrl: `/preview/${projectId}`,
        deploymentUrl: null,
        deployJobId: null,
        files: cached.files,
        fileCount: Object.keys(cached.files).length,
        fromCache: true,
      }
    }

    // ── Stage 1: Intent ──────────────────────────────────────────────────────
    emit('intent', 'Analyzing product intent...')
    const intent = await analyzeProductIntent(prompt, modelId)
    emit('intent', `${intent.productType} / ${intent.domain}`, `${intent.entities.length} entities`)

    // ── Stage 2: Plan ────────────────────────────────────────────────────────
    emit('plan', 'Planning product blueprint...')
    const blueprint = await planProduct(intent, modelId)
    emit('plan', `${blueprint.pages.length} pages, ${blueprint.apiRoutes.length} API routes`)

    // ── Stage 3: Architecture ────────────────────────────────────────────────
    emit('architecture', 'Designing architecture...')
    const architecture = buildProductArchitecture(intent, blueprint)
    emit('architecture', architecture.frontend.technology)

    // ── Stage 4: Frontend ────────────────────────────────────────────────────
    emit('frontend', 'Generating frontend...')
    const frontendFiles = await generateAllFrontendFiles(intent, blueprint, modelId, f => emit('frontend', `Writing ${f}`))
    emit('frontend', `${Object.keys(frontendFiles).length} files`)

    // ── Stage 5: Backend ─────────────────────────────────────────────────────
    emit('backend', 'Generating backend APIs...')
    const backendFiles = await generateAllBackendFiles(intent, modelId, f => emit('backend', `Writing ${f}`))
    emit('backend', `${Object.keys(backendFiles).length} API files`)

    // ── Stage 6: Database ────────────────────────────────────────────────────
    emit('database', 'Generating database schema...')
    const dbFiles = await generateAllDatabaseFiles(intent, modelId)
    emit('database', `${Object.keys(dbFiles).length} DB files`)

    // ── Stage 7: Integration ─────────────────────────────────────────────────
    emit('integration', 'Running integration agent...')
    const integration = runIntegrationAgent(intent, architecture)
    emit('integration', `${integration.integrationNotes.length} integrations configured`)

    // ── Merge all files ──────────────────────────────────────────────────────
    let allFiles: Record<string, string> = {
      ...integration.files,
      ...dbFiles,
      ...backendFiles,
      ...frontendFiles,
    }

    // Enforce file limit
    const fileKeys = Object.keys(allFiles)
    if (fileKeys.length > LIMITS.maxProjectFiles) {
      logger.warn('system', `Trimming project to ${LIMITS.maxProjectFiles} files (was ${fileKeys.length})`)
      allFiles = Object.fromEntries(fileKeys.slice(0, LIMITS.maxProjectFiles).map(k => [k, allFiles[k]]))
    }

    // ── Stage 8: Repair ──────────────────────────────────────────────────────
    emit('repair', 'Running code repair agent...')
    const rebuildResult = await rebuild(allFiles)
    if (!rebuildResult.success) {
      const projectId = `prod-${Date.now()}`
      const repairResult = await runRepairAgent(rebuildResult.output, allFiles, {
        projectId,
        modelId,
        onProgress: (msg) => emit('repair', msg),
      })
      allFiles = repairResult.files
      emit('repair', repairResult.success ? 'All errors fixed' : `${repairResult.iterations} repair iterations`)
    } else {
      emit('repair', 'No errors found — skipping repair')
    }

    // ── Stage 9: Storage ─────────────────────────────────────────────────────
    emit('storage', 'Saving project...')
    const projectId = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    projectStorage.save({
      id: projectId,
      name: intent.name,
      description: intent.description,
      ownerId,
      files: allFiles,
      deploymentUrl: null,
      previewUrl: `/preview/${projectId}`,
      createdAt: new Date().toISOString(),
      metadata: { intent, blueprint, architecture: architecture.integrations },
    })

    // Cache for future requests
    promptCache.set(prompt, { intent, blueprint, files: allFiles })

    // ── Stage 10: Deploy (optional) ──────────────────────────────────────────
    let deployJobId: string | null = null
    let deploymentUrl: string | null = null

    if (deploy) {
      emit('deploy', `Queuing deployment to ${deployProvider}...`)
      const deployment = await deployProject({
        projectId,
        ownerId,
        files: allFiles,
        projectName: intent.name,
        provider: deployProvider,
      })
      deployJobId = deployment.jobId
      emit('deploy', `Job queued: ${deployJobId}`)
    }

    emit('done', `Project ${projectId} ready`)

    // ── Stage 11: Post-generation analysis (async, non-blocking) ─────────────
    setImmediate(() => {
      try {
        emit('analyze', 'Analyzing project quality...')
        const analysis = analyzeProject(projectId, allFiles)
        const patterns = extractPatterns(allFiles, analysis)
        const score = scoreProject({
          projectId,
          analysis,
          patterns,
          buildSuccess: true,
          repairIterations: 0,
          deploySuccess: !!deployJobId,
        })

        // Record feedback for each bad pattern
        for (const p of patterns) {
          generatorFeedback.record(
            p.category,
            p.description,
            p.type === 'bad' ? 'negative' : 'positive',
            'all',
            p.suggestion,
            score.total,
          )
        }

        // Derive updated generator rules
        deriveRules()

        logger.info('system', `Project quality: ${score.grade} (${score.total}/100)`, score.summary)
      } catch (err) {
        logger.warn('system', 'Post-generation analysis failed', err instanceof Error ? err.message : String(err))
      }
    })

    return {
      projectId,
      previewUrl: `/preview/${projectId}`,
      deploymentUrl,
      deployJobId,
      files: allFiles,
      fileCount: Object.keys(allFiles).length,
      fromCache: false,
    }
  } finally {
    clearTimeout(timeout)
    activeGenerations.set(ownerId, Math.max(0, (activeGenerations.get(ownerId) ?? 1) - 1))
  }
}

/** Get current factory stats (for system dashboard) */
export function getFactoryStats() {
  return {
    activeGenerations: [...activeGenerations.entries()].reduce((sum, [, v]) => sum + v, 0),
    maxConcurrentPerUser: MAX_CONCURRENT_PER_USER,
    storage: projectStorage.stats(),
  }
}
