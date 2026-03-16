/**
 * Architect Agent — designs folder structure, API routes, DB schema, and UI layout.
 * Second agent in the multi-agent pipeline.
 */

import { buildProductArchitecture } from '@/lib/services/ai/product-architecture'
import { logger } from '@/lib/core/logger'
import type { ProductBrainAgentResult } from './product-brain-agent'
import type { ProductIntent } from '@/lib/services/ai/product-intent'

export interface ArchitectureBlueprint {
  folderStructure: string[]
  apiRoutes: string[]
  dbSchema: string
  uiLayout: {
    hasLanding: boolean
    hasDashboard: boolean
    hasSidebar: boolean
    hasNavbar: boolean
    primaryColor: string
  }
  techStack: {
    frontend: string
    backend: string
    database: string
    auth: string
  }
}

export async function runArchitectAgent(
  brainResult: ProductBrainAgentResult,
): Promise<ArchitectureBlueprint> {
  const { brain, spec } = brainResult
  logger.info('ai-pipeline', '[ArchitectAgent] Designing architecture', brain.productName)

  // Convert brain output to ProductIntent shape for existing architecture builder
  const intent: ProductIntent = {
    productType: brain.productType as ProductIntent['productType'],
    domain: brainResult.idea.domain.toLowerCase() as ProductIntent['domain'],
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

  // Use existing architecture builder
  const blueprint = buildProductArchitecture(intent, {
    name: brain.productName,
    description: brain.description,
    pages: spec.pages ?? brain.pages.map((p: string) => ({ name: p, route: p, description: p, components: [], requiresAuth: p.includes('dashboard') })),
    apiRoutes: spec.apiRoutes ?? brain.apiRoutes.map((r: string) => ({ path: r, methods: ['GET', 'POST'], entity: r.split('/').pop() ?? '', description: r })),
    components: [],
    folderStructure: [],
    envVars: ['DATABASE_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
  })

  const folderStructure = [
    'app/',
    'app/(auth)/login/',
    'app/(auth)/signup/',
    'app/dashboard/',
    ...brain.pages.filter(p => p !== '/' && !p.includes('['))
      .map(p => `app${p}/`),
    'components/',
    'components/ui/',
    'lib/',
    'lib/services/',
    'prisma/',
  ]

  logger.info('ai-pipeline', '[ArchitectAgent] Done', `${folderStructure.length} folders`)

  return {
    folderStructure,
    apiRoutes: brain.apiRoutes,
    dbSchema: spec.dbSchema ?? brain.dbModel,
    uiLayout: {
      hasLanding: brain.pages.includes('/'),
      hasDashboard: brain.pages.some(p => p.includes('dashboard')),
      hasSidebar: brain.entities.length >= 3,
      hasNavbar: true,
      primaryColor: 'indigo',
    },
    techStack: spec.techStack ?? {
      frontend: 'Next.js 14 App Router',
      backend: 'Next.js API Routes',
      database: 'PostgreSQL + Prisma',
      auth: 'Clerk',
    },
  }
}
