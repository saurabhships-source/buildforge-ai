/**
 * Product Spec Generator — produces a full product blueprint from brain output.
 * Includes pages, components, entities, API routes, DB schema, auth strategy.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface EntityField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'relation'
  required: boolean
  relation?: string   // related entity name
}

export interface EntitySpec {
  name: string
  fields: EntityField[]
  relations: string[]
}

export interface PageSpec {
  path: string
  name: string
  components: string[]
  requiresAuth: boolean
  isPublic: boolean
}

export interface ApiRouteSpec {
  path: string
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[]
  description: string
  requiresAuth: boolean
}

export interface ProductSpec {
  name: string
  description: string
  pages: PageSpec[]
  entities: EntitySpec[]
  apiRoutes: ApiRouteSpec[]
  dbSchema: string          // Prisma schema string
  authStrategy: string
  techStack: {
    frontend: string
    backend: string
    database: string
    auth: string
    styling: string
  }
  generatedAt: string
}

export interface ProductBrainLike {
  productName: string
  productType: string
  description: string
  features: string[]
  entities: string[]
  pages: string[]
  apiRoutes: string[]
  dbModel: string
  hasPayments: boolean
}

const SYSTEM = `You are a SaaS architect. Generate a complete product specification.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "name": "Product Name",
  "description": "One sentence",
  "pages": [{ "path": "/", "name": "Landing", "components": ["Hero", "Features"], "requiresAuth": false, "isPublic": true }],
  "entities": [{ "name": "Contact", "fields": [{ "name": "email", "type": "string", "required": true }], "relations": [] }],
  "apiRoutes": [{ "path": "/api/contacts", "methods": ["GET", "POST"], "description": "CRUD contacts", "requiresAuth": true }],
  "dbSchema": "model Contact { id String @id @default(cuid()) email String createdAt DateTime @default(now()) }",
  "authStrategy": "Clerk",
  "techStack": { "frontend": "Next.js 14 App Router", "backend": "Next.js API Routes", "database": "PostgreSQL + Prisma", "auth": "Clerk", "styling": "Tailwind CSS" }
}`

export async function generateProductSpec(
  brain: ProductBrainLike,
  modelId: ModelId = 'gemini_flash',
): Promise<ProductSpec> {
  logger.info('ai-pipeline', 'Generating product spec', brain.productName)

  const prompt = `Generate a complete product spec for:
Product: ${brain.productName}
Type: ${brain.productType}
Features: ${brain.features.join(', ')}
Entities: ${brain.entities.join(', ')}
Pages: ${brain.pages.join(', ')}
API Routes: ${brain.apiRoutes.join(', ')}`

  const result = await aiJsonRequest<Omit<ProductSpec, 'generatedAt'>>(
    { system: SYSTEM, prompt, modelId, maxOutputTokens: 2000, timeoutMs: 20_000 },
    () => buildFallbackSpec(brain),
  )

  return { ...result, generatedAt: new Date().toISOString() }
}

function buildFallbackSpec(brain: ProductBrainLike): Omit<ProductSpec, 'generatedAt'> {
  const pages: PageSpec[] = brain.pages.map((p: string) => ({
    path: p,
    name: p.replace('/', '').replace(/\[.*\]/, '[id]') || 'Home',
    components: ['Header', 'Main', 'Footer'],
    requiresAuth: p.includes('dashboard') || p.includes('admin'),
    isPublic: !p.includes('dashboard') && !p.includes('admin'),
  }))

  const entities: EntitySpec[] = brain.entities.map((e: string) => ({
    name: e,
    fields: [
      { name: 'id', type: 'string' as const, required: true },
      { name: 'name', type: 'string' as const, required: true },
      { name: 'createdAt', type: 'date' as const, required: true },
    ],
    relations: [],
  }))

  const apiRoutes: ApiRouteSpec[] = brain.apiRoutes.map((r: string) => ({
    path: r,
    methods: ['GET', 'POST'] as ('GET' | 'POST')[],
    description: `CRUD for ${r.split('/').pop()}`,
    requiresAuth: true,
  }))

  const dbSchema = brain.entities.map((e: string) =>
    `model ${e} {\n  id        String   @id @default(cuid())\n  name      String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}`
  ).join('\n\n')

  return {
    name: brain.productName,
    description: brain.description,
    pages,
    entities,
    apiRoutes,
    dbSchema,
    authStrategy: 'Clerk',
    techStack: {
      frontend: 'Next.js 14 App Router',
      backend: 'Next.js API Routes',
      database: 'PostgreSQL + Prisma',
      auth: 'Clerk',
      styling: 'Tailwind CSS',
    },
  }
}
