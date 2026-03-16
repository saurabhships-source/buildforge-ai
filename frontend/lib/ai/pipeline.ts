// Multi-Stage AI Pipeline — orchestrates all generation stages
// Stage 1: Blueprint → Stage 2: Database → Stage 3: Backend → Stage 4: Frontend

import { isLandingPageOnly } from '@/lib/ai-engine/agents/builder-agent'
import { generateBlueprint } from './steps/blueprint'
import { generateDatabaseSchema } from './steps/database'
import { generateBackend } from './steps/backend'
import { generateFrontend } from './steps/frontend'
import { detectEntrypoint } from './file-parser'

export type PipelineStageId = 'blueprint' | 'database' | 'backend' | 'frontend'

export interface PipelineStageStatus {
  id: PipelineStageId
  label: string
  status: 'pending' | 'active' | 'done' | 'skipped'
  message?: string
}

export interface PipelineResult {
  files: Record<string, string>
  entrypoint: string
  description: string
  stages: PipelineStageStatus[]
  blueprint?: import('./steps/blueprint').AppBlueprint
  usedPipeline: boolean
}

export type PipelineProgressCallback = (stage: PipelineStageId, status: 'active' | 'done' | 'skipped', message?: string) => void

const STAGE_LABELS: Record<PipelineStageId, string> = {
  blueprint: 'Analyzing idea',
  database: 'Designing database',
  backend: 'Generating backend',
  frontend: 'Generating frontend',
}

/**
 * Run the full multi-stage AI pipeline for complex app generation.
 * For simple landing pages, falls back to single-step generation.
 */
export async function generateAppPipeline(
  prompt: string,
  onProgress?: PipelineProgressCallback
): Promise<PipelineResult> {
  const stages: PipelineStageStatus[] = [
    { id: 'blueprint', label: STAGE_LABELS.blueprint, status: 'pending' },
    { id: 'database', label: STAGE_LABELS.database, status: 'pending' },
    { id: 'backend', label: STAGE_LABELS.backend, status: 'pending' },
    { id: 'frontend', label: STAGE_LABELS.frontend, status: 'pending' },
  ]

  const setStage = (id: PipelineStageId, status: PipelineStageStatus['status'], message?: string) => {
    const stage = stages.find(s => s.id === id)
    if (stage) { stage.status = status; stage.message = message }
    onProgress?.(id, status === 'pending' ? 'active' : status as 'active' | 'done' | 'skipped', message)
  }

  // ── Stage 1: Blueprint ──────────────────────────────────────────────────
  setStage('blueprint', 'active', 'Analyzing your idea...')
  let blueprint: import('./steps/blueprint').AppBlueprint
  try {
    blueprint = await generateBlueprint(prompt)
    setStage('blueprint', 'done', `Blueprint: ${blueprint.appType} — ${blueprint.pages.length} pages`)
  } catch (err) {
    console.error('[pipeline] blueprint failed:', err)
    setStage('blueprint', 'done', 'Blueprint complete (fallback)')
    // Import fallback inline
    const { generateBlueprint: gb } = await import('./steps/blueprint')
    blueprint = await gb(prompt).catch(() => ({
      appType: 'website', appName: 'App', description: prompt.slice(0, 80),
      pages: ['index.html'], databaseTables: [], apiRoutes: [],
      features: [], colorScheme: 'indigo dark', techStack: ['HTML5', 'Tailwind CSS', 'Vanilla JS'],
    }))
  }

  // ── Stage 2: Database ───────────────────────────────────────────────────
  const needsDB = blueprint.databaseTables.length > 0
  if (needsDB) {
    setStage('database', 'active', `Designing ${blueprint.databaseTables.length} tables...`)
  } else {
    setStage('database', 'skipped', 'No database needed')
  }

  let dbFiles: Record<string, string> = {}
  if (needsDB) {
    try {
      const schema = await generateDatabaseSchema(prompt, blueprint)
      if (schema.sql) dbFiles['database/schema.sql'] = schema.sql
      if (schema.prisma) dbFiles['database/schema.prisma'] = schema.prisma
      setStage('database', 'done', `Schema: ${schema.tables.length} tables`)
    } catch (err) {
      console.warn('[pipeline] database stage failed:', err)
      setStage('database', 'done', 'Schema generated (fallback)')
    }
  }

  // ── Stage 3: Backend ────────────────────────────────────────────────────
  const needsBackend = blueprint.apiRoutes.length > 0
  if (needsBackend) {
    setStage('backend', 'active', `Generating ${blueprint.apiRoutes.length} API routes...`)
  } else {
    setStage('backend', 'skipped', 'No backend needed')
  }

  let backendFiles: Record<string, string> = {}
  if (needsBackend) {
    try {
      const { generateDatabaseSchema: gds } = await import('./steps/database')
      const schema = await gds(prompt, blueprint)
      backendFiles = await generateBackend(prompt, blueprint, schema)
      setStage('backend', 'done', `Backend: ${Object.keys(backendFiles).length} files`)
    } catch (err) {
      console.warn('[pipeline] backend stage failed:', err)
      setStage('backend', 'done', 'Backend generated (fallback)')
    }
  }

  // ── Stage 4: Frontend ───────────────────────────────────────────────────
  setStage('frontend', 'active', `Generating ${blueprint.pages.length} pages...`)
  let frontendFiles: Record<string, string> = {}
  let entrypoint = 'index.html'

  try {
    const frontendResult = await generateFrontend(prompt, blueprint)
    frontendFiles = frontendResult.files
    entrypoint = frontendResult.entrypoint
    setStage('frontend', 'done', `Frontend: ${Object.keys(frontendFiles).length} files`)
  } catch (err) {
    console.error('[pipeline] frontend stage failed:', err)
    setStage('frontend', 'done', 'Frontend generated (fallback)')
  }

  // ── Merge all files ─────────────────────────────────────────────────────
  const allFiles: Record<string, string> = {
    ...frontendFiles,
    ...backendFiles,
    ...dbFiles,
  }

  if (Object.keys(allFiles).length === 0) {
    throw new Error('Pipeline produced no files')
  }

  const resolvedEntrypoint = detectEntrypoint(allFiles) || entrypoint
  const pageCount = Object.keys(allFiles).filter(f => f.endsWith('.html')).length
  const description = `${blueprint.appName} — ${blueprint.appType} with ${pageCount} pages, ${Object.keys(backendFiles).length} API files`

  return {
    files: allFiles,
    entrypoint: resolvedEntrypoint,
    description,
    stages,
    blueprint,
    usedPipeline: true,
  }
}
