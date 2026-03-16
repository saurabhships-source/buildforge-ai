/**
 * Product Brain — converts interpreted idea + pattern library into a product plan.
 * Uses pattern matching first, then AI to fill gaps.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import { matchPattern } from './product-patterns'
import { assessConfidence } from './product-confidence'
import type { InterpretedIdea } from './idea-interpreter'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface ProductBrainOutput {
  productName: string
  productType: string
  description: string
  features: string[]
  entities: string[]
  pages: string[]
  apiRoutes: string[]
  dbModel: string
  authRequired: boolean
  hasPayments: boolean
  confidence: number
  clarificationQuestions: string[]
  patternId: string | null
}

const SYSTEM = `You are a SaaS product architect. Given a user idea and a matched pattern, produce a complete product plan.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "productName": "2-3 word name",
  "productType": "saas|marketplace|tool|platform",
  "description": "one sentence",
  "features": ["feature1", "feature2"],
  "entities": ["Entity1", "Entity2"],
  "pages": ["/", "/dashboard", "/entity"],
  "apiRoutes": ["/api/entities"],
  "dbModel": "brief description of data model",
  "authRequired": true,
  "hasPayments": false
}`

export async function runProductBrain(
  idea: InterpretedIdea,
  modelId: ModelId = 'gemini_flash',
): Promise<ProductBrainOutput> {
  logger.info('ai-pipeline', 'Running product brain', idea.domain)

  // Match against pattern library
  const match = matchPattern([idea.domain.toLowerCase(), ...idea.keywords])
  const patternScore = match?.score ?? 0

  // Assess confidence
  const confidence = assessConfidence(idea, patternScore)

  if (!confidence.confident) {
    logger.warn('ai-pipeline', `Low confidence (${confidence.score}) — returning clarification questions`)
    return {
      productName: 'Untitled App',
      productType: 'saas',
      description: idea.rawPrompt,
      features: [],
      entities: idea.entities,
      pages: [],
      apiRoutes: [],
      dbModel: '',
      authRequired: true,
      hasPayments: false,
      confidence: confidence.score,
      clarificationQuestions: confidence.clarificationQuestions,
      patternId: null,
    }
  }

  const pattern = match ? match.pattern : undefined

  // Use pattern as base, then AI to customize
  const prompt = `User idea: "${idea.rawPrompt}"
Domain: ${idea.domain}
Category: ${idea.category}
Detected entities: ${idea.entities.join(', ')}
Core action: ${idea.coreAction}
Target user: ${idea.targetUser}
${pattern ? `Matched pattern: ${pattern.name} (${pattern.description})
Pattern entities: ${pattern.entities.join(', ')}
Pattern features: ${pattern.features.join(', ')}` : 'No pattern matched — infer from idea'}

Generate a complete product plan.`

  const result = await aiJsonRequest<Omit<ProductBrainOutput, 'confidence' | 'clarificationQuestions' | 'patternId'>>(
    { system: SYSTEM, prompt, modelId, maxOutputTokens: 1000, timeoutMs: 15_000 },
    () => buildFallback(idea, pattern),
  )

  return {
    ...result,
    confidence: confidence.score,
    clarificationQuestions: [],
    patternId: pattern?.id ?? null,
  }
}

function buildFallback(
  idea: InterpretedIdea,
  pattern: { id: string; name: string; entities: string[]; features: string[]; pages: string[]; apiRoutes: string[]; hasPayments: boolean } | undefined,
): Omit<ProductBrainOutput, 'confidence' | 'clarificationQuestions' | 'patternId'> {
  const base = pattern ?? {
    name: idea.domain,
    entities: idea.entities,
    features: ['authentication', 'dashboard', 'CRUD operations'],
    pages: ['/', '/dashboard', '/settings'],
    apiRoutes: idea.entities.map(e => `/api/${e.toLowerCase()}s`),
    hasPayments: false,
  }

  const words = idea.rawPrompt.split(' ').slice(0, 3)
  const productName = words.map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')

  return {
    productName,
    productType: idea.category.toLowerCase(),
    description: idea.rawPrompt.slice(0, 120),
    features: base.features,
    entities: base.entities,
    pages: base.pages,
    apiRoutes: base.apiRoutes,
    dbModel: `${base.entities.join(', ')} with standard CRUD`,
    authRequired: true,
    hasPayments: 'hasPayments' in base ? base.hasPayments : false,
  }
}
