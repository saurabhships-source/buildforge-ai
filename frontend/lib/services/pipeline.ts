// 7-Stage AI Generation Pipeline
// Prompt → Intent → Planner → Architecture → FileTree → CodeGen → QA → Preview

import { analyzeIntent, type AnalyzedIntent } from './ai/intent'
import { generateProjectPlan, type ProjectPlan } from './ai/planner'
import { designArchitecture, type ArchitectureSpec } from './ai/architecture'
import { generateFileTree } from './ai/file-tree'
import { generateFileCode } from './ai/codegen'
import { validateAndFix, type QAResult } from './ai/qa'
import { repoService } from '@/lib/hub/repo-service'
import { generateProjectTitle } from '@/lib/brand-generator'
import { aiCache } from '@/lib/cache/ai-cache'
import type { ModelId } from '@/lib/ai-engine/model-router'

export type PipelineStage =
  | 'intent' | 'plan' | 'architecture' | 'file-tree'
  | 'codegen' | 'qa' | 'preview' | 'cache' | 'save'

export interface PipelineProgress {
  stage: PipelineStage
  status: 'running' | 'done' | 'error' | 'skipped'
  message?: string
  detail?: string
}

export interface PipelineResult {
  projectId: string
  files: Record<string, string>
  entrypoint: string
  plan: ProjectPlan
  intent: AnalyzedIntent
  architecture: ArchitectureSpec
  qaResult: QAResult
  previewUrl: string
  description: string
  fromCache: boolean
}

export type PipelineProgressCallback = (progress: PipelineProgress) => void

export interface PipelineOptions {
  ownerId?: string
  ownerName?: string
  modelId?: ModelId
  useAIQA?: boolean
  onProgress?: PipelineProgressCallback
}

export async function runPipeline(
  prompt: string,
  opts: PipelineOptions = {},
): Promise<PipelineResult> {
  const {
    ownerId = 'anonymous',
    ownerName = 'anonymous',
    modelId = 'gemini_flash',
    useAIQA = false,
    onProgress,
  } = opts

  const emit = (stage: PipelineStage, status: PipelineProgress['status'], message?: string, detail?: string) => {
    onProgress?.({ stage, status, message, detail })
  }

  // ── Stage 1: Intent Analysis ───────────────────────────────────────────────
  emit('intent', 'running', 'Analyzing intent...')
  const intent = await analyzeIntent(prompt, modelId)
  emit('intent', 'done', `${intent.category} / ${intent.domain}`, `complexity: ${intent.complexity}`)

  // ── Stage 2: Project Planning ──────────────────────────────────────────────
  emit('plan', 'running', 'Planning project...')
  const plan = await generateProjectPlan(prompt, modelId)
  emit('plan', 'done', plan.name, `${plan.pages.length} pages, ${plan.features.length} features`)

  // ── Cache check ────────────────────────────────────────────────────────────
  emit('cache', 'running', 'Checking cache...')
  const cacheResult = await aiCache.lookup(prompt, plan.appType)
  if (cacheResult.hit) {
    emit('cache', 'done', `L${cacheResult.level} cache hit`)
    const { entry } = cacheResult
    const brand = generateProjectTitle(prompt)
    const repo = repoService.createRepo({
      name: brand.fullName,
      description: plan.description,
      ownerId, ownerName,
      appType: plan.appType,
      files: entry.files,
      prompt,
      agent: entry.agent,
    })
    emit('save', 'done', 'Saved from cache')
    emit('preview', 'done')
    const arch = designArchitecture(plan, intent)
    return {
      projectId: repo.id,
      files: entry.files,
      entrypoint: entry.entrypoint,
      plan,
      intent,
      architecture: arch,
      qaResult: { files: entry.files, issues: [], fixedCount: 0, passedCount: Object.keys(entry.files).length },
      previewUrl: `/preview/${repo.id}`,
      description: entry.description,
      fromCache: true,
    }
  }
  emit('cache', 'done', 'Cache miss — generating')

  // ── Stage 3: Architecture Design ───────────────────────────────────────────
  emit('architecture', 'running', 'Designing architecture...')
  const architecture = designArchitecture(plan, intent)
  emit('architecture', 'done', architecture.styling, `${architecture.directories.length} dirs`)

  // ── Stage 4: File Tree Generation ──────────────────────────────────────────
  emit('file-tree', 'running', 'Building file tree...')
  const filePaths = generateFileTree(plan)
  emit('file-tree', 'done', `${filePaths.length} files planned`)

  // ── Stage 5: Code Generation ───────────────────────────────────────────────
  emit('codegen', 'running', 'Generating code...')
  const rawFiles: Record<string, string> = {}
  const ordered = ['index.html', ...filePaths.filter(f => f !== 'index.html')]
  for (let i = 0; i < ordered.length; i++) {
    const filePath = ordered[i]
    emit('codegen', 'running', `Writing ${filePath}`, `${i + 1}/${ordered.length}`)
    const result = await generateFileCode(filePath, plan, rawFiles, modelId)
    rawFiles[result.path] = result.content
  }
  emit('codegen', 'done', `${Object.keys(rawFiles).length} files written`)

  // ── Stage 6: QA & Auto-fix ─────────────────────────────────────────────────
  emit('qa', 'running', 'Running QA checks...')
  const qaResult = await validateAndFix(rawFiles, modelId, useAIQA)
  const fixMsg = qaResult.fixedCount > 0
    ? `Fixed ${qaResult.fixedCount} issues`
    : `${qaResult.passedCount} files passed`
  emit('qa', 'done', fixMsg, `${qaResult.issues.length} issues found`)

  // ── Save ───────────────────────────────────────────────────────────────────
  emit('save', 'running', 'Saving project...')
  const brand = generateProjectTitle(prompt)
  const repo = repoService.createRepo({
    name: brand.fullName,
    description: plan.description,
    ownerId, ownerName,
    appType: plan.appType,
    files: qaResult.files,
    prompt,
    agent: 'builder',
  })

  // Cache for future requests
  aiCache.store(prompt, plan.appType, {
    files: qaResult.files,
    entrypoint: 'index.html',
    description: plan.description,
    agent: 'builder',
    model: modelId,
  }).catch(() => {})

  emit('save', 'done', `ID: ${repo.id.slice(0, 8)}`)

  // ── Preview ────────────────────────────────────────────────────────────────
  emit('preview', 'running', 'Preparing preview...')
  const entrypoint = qaResult.files['index.html'] ? 'index.html' : Object.keys(qaResult.files)[0] ?? 'index.html'
  emit('preview', 'done')

  return {
    projectId: repo.id,
    files: qaResult.files,
    entrypoint,
    plan,
    intent,
    architecture,
    qaResult,
    previewUrl: `/preview/${repo.id}`,
    description: plan.description,
    fromCache: false,
  }
}
