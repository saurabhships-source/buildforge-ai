import { generateText } from 'ai'
import { getModel, routeAgent, type ModelId, type AgentType } from './model-router'
import { builderSystemPrompt, buildUserMessage } from './agents/builder-agent'
import { refactorSystemPrompt } from './agents/refactor-agent'
import { uiSystemPrompt } from './agents/ui-agent'
import { deploySystemPrompt } from './agents/deploy-agent'
import { debugSystemPrompt } from './agents/debug-agent'
import { uxSystemPrompt } from './agents/ux-agent'
import { securitySystemPrompt, staticSecurityScan } from './agents/security-agent'
import { githubAgentSystemPrompt } from './agents/github-agent'
import { seoSystemPrompt, generateStaticSEO } from './agents/seo-agent'
import { startupGeneratorSystemPrompt, parseStartupPrompt } from './agents/startup-generator'
import { performanceSystemPrompt, staticPerformanceScan } from './agents/performance-agent'
import { parseFilesJson } from './tool-adapters/base-adapter'
import { buildCodebaseGraph, summarizeGraph } from '../codebase-intelligence'
import { analyzeProject, computeHealthScore } from './codebase-graph/codebase-analyzer'
import { buildDependencyGraph, summarizeDependencyGraph } from './codebase-graph/dependency-mapper'
import { buildComponentGraph, summarizeComponentGraph } from './codebase-graph/component-graph'
import { generateFallbackProject } from './fallback-generator'

// AgentType is imported from model-router — re-export for consumers of orchestrator
export type { AgentType } from './model-router'

const AI_TIMEOUT_MS = 55_000 // 55s — under Vercel's 60s function limit

// Wraps generateText with a hard timeout so a hung AI call never blocks forever
async function generateWithTimeout(opts: Parameters<typeof generateText>[0]): Promise<{ text: string }> {
  return Promise.race([
    generateText(opts),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out after 55s')), AI_TIMEOUT_MS)
    ),
  ])
}

type AppType = string

export interface CodebaseAnalysis {
  graph: ReturnType<typeof buildCodebaseGraph>
  summary: string
  deepAnalysis?: ReturnType<typeof analyzeProject>
  dependencyGraph?: ReturnType<typeof buildDependencyGraph>
  componentGraph?: ReturnType<typeof buildComponentGraph>
}

export interface ProjectFiles {
  [filename: string]: string
}

export interface GenerationResult {
  files: ProjectFiles
  entrypoint: string
  description: string
  agent: AgentType
  model: ModelId
}

export interface PipelineStep {
  agent: AgentType
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  description: string
  changes: string[]
  durationMs?: number
}

export interface PipelineResult {
  files: ProjectFiles
  entrypoint: string
  steps: PipelineStep[]
  model: ModelId
}

// Full autonomous pipeline order (builder → debug → ui → ux → seo → performance → refactor → security → deploy → github)
const PIPELINE_AGENTS: AgentType[] = [
  'builder', 'debug', 'ui', 'ux', 'seo', 'performance', 'refactor', 'security', 'deploy', 'github',
]

function getSystemPrompt(agent: AgentType, appType: AppType, existingFiles?: ProjectFiles, prompt?: string): string {
  switch (agent) {
    case 'refactor':  return refactorSystemPrompt(existingFiles ?? {})
    case 'ui':        return uiSystemPrompt(existingFiles ?? {})
    case 'deploy':    return deploySystemPrompt(existingFiles ?? {})
    case 'debug':     return debugSystemPrompt(existingFiles ?? {})
    case 'ux':        return uxSystemPrompt(existingFiles ?? {})
    case 'security':  return securitySystemPrompt(existingFiles ?? {})
    case 'github':    return githubAgentSystemPrompt(existingFiles ?? {})
    case 'seo':       return seoSystemPrompt(existingFiles ?? {})
    case 'startup':   return startupGeneratorSystemPrompt(parseStartupPrompt(''))
    case 'performance': return performanceSystemPrompt(existingFiles ?? {})
    default:          return builderSystemPrompt(appType, existingFiles, prompt)
  }
}

function buildAgentUserMessage(agent: AgentType, prompt: string, appType: AppType, files?: ProjectFiles): string {
  if (agent === 'builder') return buildUserMessage(prompt, appType, files)
  const filesContext = Object.entries(files ?? {})
    .map(([k, v]) => `=== ${k} ===\n${v}`)
    .join('\n\n')
  return `${prompt}\n\nExisting files:\n${filesContext}`
}

export async function runAgent(opts: {
  prompt: string
  appType: AppType
  modelId: ModelId
  existingFiles?: ProjectFiles
  forceAgent?: AgentType
}): Promise<GenerationResult> {
  const { prompt, appType, modelId, existingFiles, forceAgent } = opts

  const agent = forceAgent ?? routeAgent(prompt)
  const systemPrompt = getSystemPrompt(agent, appType, existingFiles, prompt)
  const userMessage = buildAgentUserMessage(agent, prompt, appType, existingFiles)

  // Try primary model, then fallback model, then static fallback
  const modelsToTry: ModelId[] = modelId === 'gemini_flash'
    ? ['gemini_flash', 'gemini_pro']
    : modelId === 'gpt4o'
      ? ['gpt4o', 'gpt4o_mini', 'gemini_flash']
      : [modelId, 'gemini_flash']

  let lastError: Error | null = null

  for (const tryModel of modelsToTry) {
    try {
      const start = Date.now()
      const { text } = await generateWithTimeout({
        model: getModel(tryModel),
        system: systemPrompt,
        prompt: userMessage,
        maxOutputTokens: 12000,
      })
      console.log(`[orchestrator] runAgent ${agent} on ${tryModel} — ${Date.now() - start}ms, ${text.length} chars`)
      const result = parseFilesJson(text)
      return { ...result, agent, model: tryModel }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`[orchestrator] runAgent ${agent} failed on ${tryModel}:`, lastError.message)
    }
  }

  // All models failed — return static fallback so UI always gets files
  console.error('[orchestrator] all models failed, using static fallback. Last error:', lastError?.message)
  const fallback = generateFallbackProject(prompt, lastError?.message ?? 'AI unavailable')
  return { ...fallback, agent, model: modelId }
}

// Run a single pipeline step — returns updated files or original on failure
async function runPipelineStep(
  agent: AgentType,
  files: ProjectFiles,
  appType: AppType,
  modelId: ModelId,
  initialPrompt: string,
): Promise<{ files: ProjectFiles; description: string; changes: string[] }> {
  const prevKeys = new Set(Object.keys(files))

  // Security agent: run static scan first, skip AI if clean
  if (agent === 'security') {
    const issues = staticSecurityScan(files)
    if (issues.length === 0) {
      return { files, description: 'No security issues found', changes: [] }
    }
  }

  // Performance agent: run static scan first, skip AI if clean
  if (agent === 'performance') {
    const issues = staticPerformanceScan(files)
    if (issues.length === 0) {
      return { files, description: 'No performance issues found', changes: [] }
    }
  }

  const systemPrompt = getSystemPrompt(agent, appType, files, initialPrompt)
  const userMessage = agent === 'builder'
    ? buildUserMessage(initialPrompt, appType, files)
    : `Improve this project.\n\nExisting files:\n${Object.entries(files).map(([k, v]) => `=== ${k} ===\n${v}`).join('\n\n')}`

  try {
    const { text } = await generateWithTimeout({
      model: getModel(modelId),
      system: systemPrompt,
      prompt: userMessage,
      maxOutputTokens: 12000,
    })

    const result = parseFilesJson(text)
    const newKeys = new Set(Object.keys(result.files))
    const changes: string[] = []

    for (const key of newKeys) {
      if (!prevKeys.has(key)) changes.push(`Added ${key}`)
      else if (result.files[key] !== files[key]) changes.push(`Modified ${key}`)
    }

    return { files: result.files, description: result.description, changes }
  } catch (err) {
    // Step failed — return original files unchanged so pipeline continues
    const msg = err instanceof Error ? err.message : 'Step failed'
    console.warn(`[orchestrator] pipeline step ${agent} failed:`, msg)
    return { files, description: `${agent} skipped: ${msg}`, changes: [] }
  }
}

export async function runAutonomousPipeline(opts: {
  prompt: string
  appType: AppType
  modelId: ModelId
  existingFiles?: ProjectFiles
  onStepUpdate?: (step: PipelineStep) => void
}): Promise<PipelineResult> {
  const { prompt, appType, modelId, existingFiles, onStepUpdate } = opts

  let currentFiles: ProjectFiles = existingFiles ?? {}
  const steps: PipelineStep[] = PIPELINE_AGENTS.map(agent => ({
    agent,
    status: 'pending',
    description: '',
    changes: [],
  }))

  for (let i = 0; i < PIPELINE_AGENTS.length; i++) {
    const agent = PIPELINE_AGENTS[i]
    const step = steps[i]

    // Skip builder if we already have files (it was the initial generation)
    if (agent === 'builder' && Object.keys(currentFiles).length > 0) {
      step.status = 'skipped'
      step.description = 'Skipped — files already generated'
      onStepUpdate?.(step)
      continue
    }

    step.status = 'running'
    onStepUpdate?.(step)

    const start = Date.now()
    try {
      const result = await runPipelineStep(agent, currentFiles, appType, modelId, prompt)
      currentFiles = result.files
      step.status = 'completed'
      step.description = result.description
      step.changes = result.changes
      step.durationMs = Date.now() - start
    } catch (err) {
      step.status = 'failed'
      step.description = err instanceof Error ? err.message : 'Step failed'
      step.durationMs = Date.now() - start
      // Continue pipeline even if a step fails
    }

    onStepUpdate?.(step)
  }

  const entrypoint = currentFiles['index.html'] ? 'index.html' : Object.keys(currentFiles)[0] ?? 'index.html'
  return { files: currentFiles, entrypoint, steps, model: modelId }
}

// Analyze a codebase and return full intelligence graph
export function analyzeCodebase(files: ProjectFiles): CodebaseAnalysis {
  const graph = buildCodebaseGraph(files)
  const summary = summarizeGraph(graph)
  const deepAnalysis = analyzeProject(files)
  const dependencyGraph = buildDependencyGraph(deepAnalysis.analyses)
  const componentGraph = buildComponentGraph(deepAnalysis.analyses)
  return { graph, summary, deepAnalysis, dependencyGraph, componentGraph }
}

// Generate a complete startup stack
export async function runStartupGenerator(opts: {
  prompt: string
  modelId: ModelId
}): Promise<GenerationResult> {
  const { prompt, modelId } = opts
  const spec = parseStartupPrompt(prompt)
  const systemPrompt = startupGeneratorSystemPrompt(spec)

  const { text } = await generateWithTimeout({
    model: getModel(modelId),
    system: systemPrompt,
    prompt: `Build a complete SaaS startup: ${prompt}`,
    maxOutputTokens: 16000,
  })

  const result = parseFilesJson(text)
  // Merge static SEO files
  const seoFiles = generateStaticSEO(prompt.slice(0, 40), 'https://yourdomain.com', prompt)
  return {
    ...result,
    files: { ...seoFiles, ...result.files },
    agent: 'startup' as AgentType,
    model: modelId,
  }
}

// Maintenance pipeline — runs a targeted subset of agents on an existing project
export interface MaintenancePipelineResult {
  files: ProjectFiles
  steps: PipelineStep[]
  healthBefore: ReturnType<typeof computeHealthScore>
  healthAfter: ReturnType<typeof computeHealthScore>
  model: ModelId
}

export async function runMaintenancePipeline(opts: {
  files: ProjectFiles
  agents: AgentType[]
  modelId: ModelId
  onStepUpdate?: (step: PipelineStep) => void
}): Promise<MaintenancePipelineResult> {
  const { files: initialFiles, agents, modelId, onStepUpdate } = opts

  const { analyses: beforeAnalyses } = analyzeProject(initialFiles)
  const healthBefore = computeHealthScore(beforeAnalyses)

  let currentFiles = { ...initialFiles }
  const steps: PipelineStep[] = agents.map(agent => ({
    agent,
    status: 'pending' as const,
    description: '',
    changes: [],
  }))

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]
    const step = steps[i]
    step.status = 'running'
    onStepUpdate?.(step)

    const start = Date.now()
    try {
      const result = await runPipelineStep(agent, currentFiles, 'website', modelId, 'Autonomous maintenance cycle')
      currentFiles = result.files
      step.status = 'completed'
      step.description = result.description
      step.changes = result.changes
      step.durationMs = Date.now() - start
    } catch (err) {
      step.status = 'failed'
      step.description = err instanceof Error ? err.message : 'Step failed'
      step.durationMs = Date.now() - start
    }
    onStepUpdate?.(step)
  }

  const { analyses: afterAnalyses } = analyzeProject(currentFiles)
  const healthAfter = computeHealthScore(afterAnalyses)

  return { files: currentFiles, steps, healthBefore, healthAfter, model: modelId }
}
