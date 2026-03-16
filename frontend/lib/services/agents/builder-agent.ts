/**
 * Builder Agent — generates frontend, backend, and database code.
 * Third agent in the multi-agent pipeline.
 */

import { generateAllFrontendFiles } from '@/lib/services/ai/frontend-generator'
import { generateAllBackendFiles } from '@/lib/services/ai/backend-generator'
import { generateAllDatabaseFiles } from '@/lib/services/ai/database-generator'
import { runIntegrationAgent } from '@/lib/services/ai/integration-agent'
import { buildProductArchitecture } from '@/lib/services/ai/product-architecture'
import { logger } from '@/lib/core/logger'
import type { ProductBrainAgentResult } from './product-brain-agent'
import type { ArchitectureBlueprint } from './architect-agent'
import type { ProductIntent } from '@/lib/services/ai/product-intent'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface BuilderAgentResult {
  files: Record<string, string>
  fileCount: number
  frontendFileCount: number
  backendFileCount: number
  dbFileCount: number
}

export async function runBuilderAgent(
  brainResult: ProductBrainAgentResult,
  architecture: ArchitectureBlueprint,
  modelId: ModelId = 'gemini_flash',
  onProgress?: (msg: string) => void,
): Promise<BuilderAgentResult> {
  const { brain, spec, idea } = brainResult
  const emit = (msg: string) => {
    onProgress?.(msg)
    logger.info('ai-pipeline', `[BuilderAgent] ${msg}`)
  }

  emit('Generating frontend...')

  // Build intent for generators
  const intent: ProductIntent = {
    productType: brain.productType as ProductIntent['productType'],
    domain: idea.domain.toLowerCase() as ProductIntent['domain'],
    name: brain.productName,
    description: brain.description,
    features: brain.features,
    entities: brain.entities.map(e => ({
      name: e,
      fields: ['id', 'name', 'createdAt'],
      relations: [],
    })),
    authStrategy: 'clerk',
    database: 'postgres',
    hasPayments: brain.hasPayments,
    hasDashboard: brain.pages.some(p => p.includes('dashboard')),
    hasPublicLanding: brain.pages.includes('/'),
    apiRoutes: brain.apiRoutes,
    complexity: brain.entities.length >= 4 ? 'advanced' : brain.entities.length >= 2 ? 'medium' : 'simple',
  }

  const blueprint = {
    name: brain.productName,
    description: brain.description,
    pages: brain.pages.map((p: string) => ({ name: p, route: p, description: p, components: [], requiresAuth: p.includes('dashboard') })),
    apiRoutes: brain.apiRoutes.map((r: string) => ({ path: r, methods: ['GET', 'POST'] as ('GET' | 'POST' | 'PUT' | 'DELETE')[], entity: r.split('/').pop() ?? '', description: r })),
    components: [],
    folderStructure: architecture.folderStructure,
    envVars: ['DATABASE_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
  }

  const [frontendFiles, backendFiles, dbFiles] = await Promise.all([
    generateAllFrontendFiles(intent, blueprint, modelId, f => emit(`Writing ${f}`)),
    generateAllBackendFiles(intent, modelId, f => emit(`Writing ${f}`)),
    generateAllDatabaseFiles(intent, modelId),
  ])

  emit('Running integration agent...')
  const arch = buildProductArchitecture(intent, {
    name: brain.productName,
    description: brain.description,
    pages: brain.pages.map((p: string) => ({ name: p, route: p, description: p, components: [], requiresAuth: p.includes('dashboard') })),
    apiRoutes: brain.apiRoutes.map((r: string) => ({ path: r, methods: ['GET', 'POST'] as ('GET' | 'POST' | 'PUT' | 'DELETE')[], entity: r.split('/').pop() ?? '', description: r })),
    components: [],
    folderStructure: [],
    envVars: ['DATABASE_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
  })
  const integration = runIntegrationAgent(intent, arch)

  const files: Record<string, string> = {
    ...integration.files,
    ...dbFiles,
    ...backendFiles,
    ...frontendFiles,
  }

  emit(`Generated ${Object.keys(files).length} files`)

  return {
    files,
    fileCount: Object.keys(files).length,
    frontendFileCount: Object.keys(frontendFiles).length,
    backendFileCount: Object.keys(backendFiles).length,
    dbFileCount: Object.keys(dbFiles).length,
  }
}
