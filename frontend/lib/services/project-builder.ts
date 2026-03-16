// Project Builder — orchestrates the full generation pipeline
// User Prompt → Planner → File Tree → Code Generator → Repo Service → Preview

import { generateProjectPlan, type ProjectPlan } from './ai/planner'
import { generateFileTree } from './ai/file-tree'
import { generateFileCode } from './ai/codegen'
import { repoService } from '@/lib/hub/repo-service'
import { generateProjectTitle } from '@/lib/brand-generator'
import { aiCache } from '@/lib/cache/ai-cache'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface BuildStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
  detail?: string
}

export interface BuildResult {
  projectId: string
  files: Record<string, string>
  entrypoint: string
  plan: ProjectPlan
  previewUrl: string
  description: string
  fromCache: boolean
}

export type BuildProgressCallback = (steps: BuildStep[]) => void

const STEPS: BuildStep[] = [
  { id: 'plan', label: 'Planning project', status: 'pending' },
  { id: 'cache', label: 'Checking AI cache', status: 'pending' },
  { id: 'files', label: 'Generating file tree', status: 'pending' },
  { id: 'code', label: 'Writing code', status: 'pending' },
  { id: 'save', label: 'Saving project', status: 'pending' },
  { id: 'preview', label: 'Launching preview', status: 'pending' },
]

export async function buildProject(
  prompt: string,
  opts: {
    ownerId?: string
    ownerName?: string
    modelId?: ModelId
    onProgress?: BuildProgressCallback
  } = {},
): Promise<BuildResult> {
  const { ownerId = 'anonymous', ownerName = 'anonymous', modelId = 'gemini_flash', onProgress } = opts
  const steps = STEPS.map(s => ({ ...s }))

  const emit = (id: string, status: BuildStep['status'], detail?: string) => {
    const step = steps.find(s => s.id === id)
    if (step) { step.status = status; step.detail = detail }
    onProgress?.(steps.map(s => ({ ...s })))
  }

  // ── Step 1: Plan ────────────────────────────────────────────────────────────
  emit('plan', 'running')
  const plan = await generateProjectPlan(prompt, modelId)
  emit('plan', 'done', `${plan.appType} — ${plan.pages.length} pages`)

  // ── Step 2: Cache check ─────────────────────────────────────────────────────
  emit('cache', 'running')
  const cacheResult = await aiCache.lookup(prompt, plan.appType)
  if (cacheResult.hit) {
    emit('cache', 'done', `L${cacheResult.level} hit`)
    emit('files', 'done', 'from cache')
    emit('code', 'done', 'from cache')

    const { entry } = cacheResult
    const brand = generateProjectTitle(prompt)
    const projectId = `proj-${Date.now()}`

    emit('save', 'running')
    repoService.createRepo({
      name: brand.fullName,
      description: plan.description,
      ownerId, ownerName,
      appType: plan.appType,
      files: entry.files,
      prompt,
      agent: entry.agent,
    })
    emit('save', 'done')
    emit('preview', 'done')

    return {
      projectId,
      files: entry.files,
      entrypoint: entry.entrypoint,
      plan,
      previewUrl: `/preview/${projectId}`,
      description: entry.description,
      fromCache: true,
    }
  }
  emit('cache', 'done', 'miss — generating')

  // ── Step 3: File tree ───────────────────────────────────────────────────────
  emit('files', 'running')
  const filePaths = generateFileTree(plan)
  emit('files', 'done', `${filePaths.length} files`)

  // ── Step 4: Code generation ─────────────────────────────────────────────────
  emit('code', 'running', `0/${filePaths.length}`)
  const generatedFiles: Record<string, string> = {}

  // Generate files sequentially — index.html first so others can reference it
  const ordered = ['index.html', ...filePaths.filter(f => f !== 'index.html')]
  for (let i = 0; i < ordered.length; i++) {
    const filePath = ordered[i]
    emit('code', 'running', `${i + 1}/${ordered.length} — ${filePath}`)
    const result = await generateFileCode(filePath, plan, generatedFiles, modelId)
    generatedFiles[result.path] = result.content
  }
  emit('code', 'done', `${Object.keys(generatedFiles).length} files written`)

  // ── Step 5: Save ────────────────────────────────────────────────────────────
  emit('save', 'running')
  const brand = generateProjectTitle(prompt)
  const repo = repoService.createRepo({
    name: brand.fullName,
    description: plan.description,
    ownerId, ownerName,
    appType: plan.appType,
    files: generatedFiles,
    prompt,
    agent: 'builder',
  })

  // Store in cache for future requests
  aiCache.store(prompt, plan.appType, {
    files: generatedFiles,
    entrypoint: 'index.html',
    description: plan.description,
    agent: 'builder',
    model: modelId,
  }).catch(() => {})

  emit('save', 'done', `ID: ${repo.id.slice(0, 8)}`)

  // ── Step 6: Preview ─────────────────────────────────────────────────────────
  emit('preview', 'running')
  const entrypoint = generatedFiles['index.html'] ? 'index.html' : Object.keys(generatedFiles)[0] ?? 'index.html'
  emit('preview', 'done')

  return {
    projectId: repo.id,
    files: generatedFiles,
    entrypoint,
    plan,
    previewUrl: `/preview/${repo.id}`,
    description: plan.description,
    fromCache: false,
  }
}
