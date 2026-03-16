/**
 * Product Intent Analyzer — extracts structured SaaS product intent from a prompt.
 * Extends the existing intent system with SaaS-specific fields.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

export type ProductType = 'saas' | 'marketplace' | 'tool' | 'api' | 'dashboard' | 'platform'
export type AuthStrategy = 'clerk' | 'nextauth' | 'supabase' | 'none'
export type DatabaseType = 'postgres' | 'supabase' | 'sqlite' | 'none'

export interface ProductEntity {
  name: string          // e.g. "Contact"
  fields: string[]      // e.g. ["name", "email", "phone"]
  relations: string[]   // e.g. ["belongs to User"]
}

export interface ProductIntent {
  productType: ProductType
  domain: string
  name: string
  description: string
  features: string[]
  entities: ProductEntity[]
  authStrategy: AuthStrategy
  database: DatabaseType
  hasPayments: boolean
  hasDashboard: boolean
  hasPublicLanding: boolean
  apiRoutes: string[]   // e.g. ["/api/contacts", "/api/users"]
  complexity: 'simple' | 'medium' | 'advanced'
}

const SYSTEM = `You are a SaaS product architect. Extract structured product intent from a user prompt.
Return ONLY valid JSON — no markdown, no fences, no explanation.

Schema:
{
  "productType": "saas|marketplace|tool|api|dashboard|platform",
  "domain": "crm|hrm|finance|health|education|ecommerce|general",
  "name": "Product name (2-3 words)",
  "description": "One sentence description",
  "features": ["contacts management", "auth", "dashboard", "analytics"],
  "entities": [
    { "name": "Contact", "fields": ["name","email","phone"], "relations": ["belongs to User"] }
  ],
  "authStrategy": "clerk|nextauth|supabase|none",
  "database": "postgres|supabase|sqlite|none",
  "hasPayments": false,
  "hasDashboard": true,
  "hasPublicLanding": true,
  "apiRoutes": ["/api/contacts", "/api/users"],
  "complexity": "simple|medium|advanced"
}`

export async function analyzeProductIntent(
  prompt: string,
  modelId: ModelId = 'gemini_flash',
): Promise<ProductIntent> {
  logger.info('ai-pipeline', 'Analyzing product intent', prompt.slice(0, 80))

  return aiJsonRequest<ProductIntent>(
    {
      system: SYSTEM,
      prompt: `Extract product intent from: "${prompt}"`,
      modelId,
      maxOutputTokens: 1000,
      timeoutMs: 15_000,
    },
    () => heuristicIntent(prompt),
  )
}

function heuristicIntent(prompt: string): ProductIntent {
  const p = prompt.toLowerCase()

  const entities: ProductEntity[] = []
  if (/contact|customer|client/.test(p)) entities.push({ name: 'Contact', fields: ['name', 'email', 'phone', 'company'], relations: ['belongs to User'] })
  if (/product|item|inventory/.test(p)) entities.push({ name: 'Product', fields: ['name', 'price', 'description', 'stock'], relations: [] })
  if (/order|transaction|purchase/.test(p)) entities.push({ name: 'Order', fields: ['amount', 'status', 'createdAt'], relations: ['belongs to User', 'has many Products'] })
  if (/task|todo|project/.test(p)) entities.push({ name: 'Task', fields: ['title', 'status', 'dueDate'], relations: ['belongs to User'] })
  if (entities.length === 0) entities.push({ name: 'Record', fields: ['title', 'description', 'createdAt'], relations: ['belongs to User'] })

  const apiRoutes = entities.map(e => `/api/${e.name.toLowerCase()}s`)

  return {
    productType: /marketplace/.test(p) ? 'marketplace' : /tool/.test(p) ? 'tool' : /dashboard/.test(p) ? 'dashboard' : 'saas',
    domain: /crm|contact/.test(p) ? 'crm' : /hr|employee/.test(p) ? 'hrm' : /finance|invoice/.test(p) ? 'finance' : 'general',
    name: prompt.split(' ').slice(0, 3).map(w => w[0]?.toUpperCase() + w.slice(1)).join(' '),
    description: prompt.slice(0, 120),
    features: ['authentication', 'dashboard', 'CRUD operations', 'responsive UI'],
    entities,
    authStrategy: 'clerk',
    database: 'postgres',
    hasPayments: /payment|stripe|billing|subscription/.test(p),
    hasDashboard: true,
    hasPublicLanding: true,
    apiRoutes,
    complexity: entities.length >= 3 ? 'advanced' : entities.length >= 2 ? 'medium' : 'simple',
  }
}
