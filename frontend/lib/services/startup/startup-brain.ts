/**
 * Startup Brain — interprets a user idea and generates a complete startup concept.
 * Produces: name, problem, solution, target users, value proposition, and business model.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface StartupConcept {
  name: string                  // e.g. "FlowCRM"
  tagline: string               // e.g. "Close deals faster"
  problemStatement: string      // what pain does it solve
  solutionDescription: string   // how it solves it
  targetUsers: string[]         // e.g. ["sales teams", "freelancers"]
  valueProposition: string      // one-liner unique value
  businessModel: 'subscription' | 'freemium' | 'usage-based' | 'marketplace' | 'one-time'
  category: string              // e.g. "CRM", "Analytics", "DevTools"
  domain: string                // e.g. "crm", "analytics"
  keyFeatures: string[]         // top 5–6 features
  unfairAdvantage: string       // what makes it defensible
  rawIdea: string
}

const SYSTEM = `You are a startup strategist and product visionary.
Convert a user idea into a complete startup concept.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "name": "2-3 word product name",
  "tagline": "short punchy tagline under 8 words",
  "problemStatement": "clear problem being solved",
  "solutionDescription": "how the product solves it",
  "targetUsers": ["user type 1", "user type 2"],
  "valueProposition": "one sentence unique value",
  "businessModel": "subscription|freemium|usage-based|marketplace|one-time",
  "category": "CRM|Analytics|DevTools|HR|Finance|Education|Health|Productivity|Marketplace|Other",
  "domain": "lowercase category slug",
  "keyFeatures": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "unfairAdvantage": "what makes this defensible long-term"
}`

export async function runStartupBrain(
  idea: string,
  modelId: ModelId = 'gemini_flash',
): Promise<StartupConcept> {
  logger.info('ai-pipeline', '[StartupBrain] Interpreting idea', idea.slice(0, 80))

  const result = await aiJsonRequest<Omit<StartupConcept, 'rawIdea'>>(
    {
      system: SYSTEM,
      prompt: `Generate a startup concept for: "${idea}"`,
      modelId,
      maxOutputTokens: 800,
      timeoutMs: 15_000,
    },
    () => heuristicConcept(idea),
  )

  return { ...result, rawIdea: idea }
}

function heuristicConcept(idea: string): Omit<StartupConcept, 'rawIdea'> {
  const words = idea.split(' ').filter(w => w.length > 2)
  const name = words.slice(0, 2).map(w => w[0].toUpperCase() + w.slice(1)).join('') + 'AI'
  return {
    name,
    tagline: `The smarter way to ${words.slice(0, 3).join(' ')}`,
    problemStatement: `Teams struggle with ${idea.slice(0, 60)}`,
    solutionDescription: `${name} automates and simplifies ${idea.slice(0, 60)} using AI`,
    targetUsers: ['small businesses', 'startups', 'freelancers'],
    valueProposition: `AI-powered ${idea.slice(0, 40)} that saves 10+ hours per week`,
    businessModel: 'freemium',
    category: 'Productivity',
    domain: 'productivity',
    keyFeatures: [
      'AI-powered automation',
      'Real-time dashboard',
      'Team collaboration',
      'Integrations',
      'Analytics & reporting',
    ],
    unfairAdvantage: 'AI-first architecture with proprietary training data',
  }
}
