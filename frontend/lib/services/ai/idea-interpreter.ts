/**
 * Idea Interpreter — converts vague user prompts into structured intent.
 * Example: "tool for managing customers" → { domain: "CRM", category: "SaaS", entities: ["Contact"] }
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface InterpretedIdea {
  domain: string            // e.g. "CRM", "Booking", "Analytics"
  category: string          // e.g. "SaaS", "Marketplace", "Tool"
  entities: string[]        // e.g. ["Contact", "Deal", "Company"]
  keywords: string[]        // extracted keywords for pattern matching
  coreAction: string        // e.g. "manage customers", "book appointments"
  targetUser: string        // e.g. "sales teams", "freelancers"
  rawPrompt: string
}

const SYSTEM = `You are a SaaS product analyst. Extract structured intent from a vague user idea.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "domain": "CRM|Booking|Analytics|TaskManager|Marketplace|Ecommerce|HRM|LMS|Invoicing|Social|General",
  "category": "SaaS|Marketplace|Tool|Platform|Dashboard",
  "entities": ["Entity1", "Entity2"],
  "keywords": ["keyword1", "keyword2"],
  "coreAction": "what the app primarily does",
  "targetUser": "who uses this app"
}`

export async function interpretIdea(
  prompt: string,
  modelId: ModelId = 'gemini_flash',
): Promise<InterpretedIdea> {
  logger.info('ai-pipeline', 'Interpreting idea', prompt.slice(0, 80))

  const result = await aiJsonRequest<Omit<InterpretedIdea, 'rawPrompt'>>(
    {
      system: SYSTEM,
      prompt: `Interpret this idea: "${prompt}"`,
      modelId,
      maxOutputTokens: 500,
      timeoutMs: 12_000,
    },
    () => heuristicInterpret(prompt),
  )

  return { ...result, rawPrompt: prompt }
}

function heuristicInterpret(prompt: string): Omit<InterpretedIdea, 'rawPrompt'> {
  const p = prompt.toLowerCase()
  const words = p.split(/\s+/)

  const domainMap: [RegExp, string][] = [
    [/crm|customer|contact|lead|sales|deal/, 'CRM'],
    [/book|appointment|schedule|reservation|slot/, 'Booking'],
    [/analytic|metric|chart|dashboard|report|kpi/, 'Analytics'],
    [/task|todo|kanban|project|board|sprint/, 'TaskManager'],
    [/marketplace|buy|sell|listing|vendor/, 'Marketplace'],
    [/shop|store|ecommerce|cart|checkout|product/, 'Ecommerce'],
    [/hr|employee|payroll|leave|recruitment/, 'HRM'],
    [/course|lesson|learning|education|quiz/, 'LMS'],
    [/invoice|billing|expense|accounting/, 'Invoicing'],
    [/social|community|post|feed|follow/, 'Social'],
  ]

  let domain = 'General'
  for (const [re, d] of domainMap) {
    if (re.test(p)) { domain = d; break }
  }

  const entityMap: [RegExp, string][] = [
    [/contact|customer|client/, 'Contact'],
    [/product|item/, 'Product'],
    [/order|purchase/, 'Order'],
    [/task|todo/, 'Task'],
    [/employee|staff/, 'Employee'],
    [/course|lesson/, 'Course'],
    [/invoice|bill/, 'Invoice'],
    [/post|article/, 'Post'],
    [/booking|appointment/, 'Booking'],
    [/listing/, 'Listing'],
  ]

  const entities = entityMap.filter(([re]) => re.test(p)).map(([, e]) => e)
  if (entities.length === 0) entities.push('Record')

  return {
    domain,
    category: /marketplace/.test(p) ? 'Marketplace' : /tool/.test(p) ? 'Tool' : 'SaaS',
    entities,
    keywords: words.filter(w => w.length > 3).slice(0, 8),
    coreAction: prompt.slice(0, 60),
    targetUser: /team|business|company/.test(p) ? 'business teams' : 'individuals',
  }
}
