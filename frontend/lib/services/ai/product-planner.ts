/**
 * Product Planner — generates a full SaaS product blueprint from ProductIntent.
 * Produces pages, components, API routes, and DB entities.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { ProductIntent } from './product-intent'

export interface PageSpec {
  name: string
  route: string
  description: string
  components: string[]
  requiresAuth: boolean
}

export interface ApiRouteSpec {
  path: string
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[]
  entity: string
  description: string
}

export interface ComponentSpec {
  name: string
  type: 'layout' | 'page' | 'form' | 'table' | 'card' | 'chart' | 'nav'
  description: string
}

export interface ProductBlueprint {
  name: string
  description: string
  pages: PageSpec[]
  apiRoutes: ApiRouteSpec[]
  components: ComponentSpec[]
  folderStructure: string[]
  envVars: string[]
}

const SYSTEM = `You are a SaaS product architect. Generate a complete product blueprint from intent.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "name": "string",
  "description": "string",
  "pages": [{ "name":"string","route":"string","description":"string","components":["string"],"requiresAuth":true }],
  "apiRoutes": [{ "path":"/api/contacts","methods":["GET","POST","PUT","DELETE"],"entity":"Contact","description":"string" }],
  "components": [{ "name":"string","type":"layout|page|form|table|card|chart|nav","description":"string" }],
  "folderStructure": ["app/","app/dashboard/","components/","lib/"],
  "envVars": ["DATABASE_URL","NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]
}`

export async function planProduct(
  intent: ProductIntent,
  modelId: ModelId = 'gemini_flash',
): Promise<ProductBlueprint> {
  logger.info('ai-pipeline', 'Planning product blueprint', intent.name)

  return aiJsonRequest<ProductBlueprint>(
    {
      system: SYSTEM,
      prompt: `Generate a product blueprint for:
Name: ${intent.name}
Type: ${intent.productType}
Domain: ${intent.domain}
Features: ${intent.features.join(', ')}
Entities: ${intent.entities.map(e => e.name).join(', ')}
Has auth: ${intent.authStrategy !== 'none'}
Has payments: ${intent.hasPayments}
Has dashboard: ${intent.hasDashboard}`,
      modelId,
      maxOutputTokens: 2000,
      timeoutMs: 20_000,
    },
    () => buildHeuristicBlueprint(intent),
  )
}

function buildHeuristicBlueprint(intent: ProductIntent): ProductBlueprint {
  const pages: PageSpec[] = [
    { name: 'Landing', route: '/', description: 'Public marketing page', components: ['Navbar', 'Hero', 'Features', 'Pricing', 'Footer'], requiresAuth: false },
    { name: 'Dashboard', route: '/dashboard', description: 'Main app dashboard', components: ['DashboardLayout', 'StatsCards', 'RecentActivity'], requiresAuth: true },
    { name: 'Sign In', route: '/sign-in', description: 'Authentication page', components: ['AuthForm'], requiresAuth: false },
  ]

  for (const entity of intent.entities) {
    const slug = entity.name.toLowerCase() + 's'
    pages.push({
      name: `${entity.name}s`,
      route: `/dashboard/${slug}`,
      description: `Manage ${slug}`,
      components: [`${entity.name}Table`, `${entity.name}Form`, 'SearchBar', 'Pagination'],
      requiresAuth: true,
    })
  }

  const apiRoutes: ApiRouteSpec[] = intent.entities.map(e => ({
    path: `/api/${e.name.toLowerCase()}s`,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    entity: e.name,
    description: `CRUD operations for ${e.name}`,
  }))

  const components: ComponentSpec[] = [
    { name: 'Navbar', type: 'nav', description: 'Top navigation bar' },
    { name: 'DashboardLayout', type: 'layout', description: 'Dashboard sidebar + content layout' },
    { name: 'StatsCards', type: 'card', description: 'KPI metric cards' },
    { name: 'DataTable', type: 'table', description: 'Reusable sortable data table' },
    ...intent.entities.map(e => ({ name: `${e.name}Form`, type: 'form' as const, description: `Create/edit ${e.name}` })),
  ]

  const folderStructure = [
    'app/', 'app/(auth)/', 'app/dashboard/', 'app/api/',
    ...intent.entities.map(e => `app/api/${e.name.toLowerCase()}s/`),
    'components/', 'components/ui/', 'components/dashboard/',
    'lib/', 'lib/db.ts', 'prisma/',
  ]

  const envVars = ['DATABASE_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY']
  if (intent.hasPayments) envVars.push('STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')

  return {
    name: intent.name,
    description: intent.description,
    pages,
    apiRoutes,
    components,
    folderStructure,
    envVars,
  }
}
