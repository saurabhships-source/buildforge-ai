/**
 * Market Analyzer — analyzes potential market size, competitors, and unique opportunity.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { StartupConcept } from './startup-brain'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface Competitor {
  name: string
  description: string
  weakness: string        // their gap that we exploit
}

export interface MarketAnalysis {
  marketSize: string      // e.g. "$4.2B TAM"
  tam: string             // Total Addressable Market
  sam: string             // Serviceable Addressable Market
  som: string             // Serviceable Obtainable Market
  growthRate: string      // e.g. "18% CAGR"
  competitors: Competitor[]
  uniqueOpportunity: string
  entryBarriers: string[]
  keyTrends: string[]
  targetGeographies: string[]
  timeToMarket: string    // e.g. "3-6 months"
}

const SYSTEM = `You are a market research analyst and startup advisor.
Analyze the market for a startup concept and return structured market intelligence.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "marketSize": "$X billion TAM",
  "tam": "Total Addressable Market description",
  "sam": "Serviceable Addressable Market description",
  "som": "Serviceable Obtainable Market in year 1",
  "growthRate": "X% CAGR",
  "competitors": [
    { "name": "CompetitorName", "description": "what they do", "weakness": "their gap" }
  ],
  "uniqueOpportunity": "the specific gap this startup fills",
  "entryBarriers": ["barrier 1", "barrier 2"],
  "keyTrends": ["trend 1", "trend 2", "trend 3"],
  "targetGeographies": ["US", "EU", "APAC"],
  "timeToMarket": "X months"
}`

export async function analyzeMarket(
  concept: StartupConcept,
  modelId: ModelId = 'gemini_flash',
): Promise<MarketAnalysis> {
  logger.info('ai-pipeline', '[MarketAnalyzer] Analyzing market', concept.name)

  return aiJsonRequest<MarketAnalysis>(
    {
      system: SYSTEM,
      prompt: `Analyze the market for:
Name: ${concept.name}
Category: ${concept.category}
Problem: ${concept.problemStatement}
Solution: ${concept.solutionDescription}
Target users: ${concept.targetUsers.join(', ')}`,
      modelId,
      maxOutputTokens: 1000,
      timeoutMs: 15_000,
    },
    () => heuristicMarket(concept),
  )
}

function heuristicMarket(concept: StartupConcept): MarketAnalysis {
  const sizeMap: Record<string, string> = {
    CRM: '$65B', Analytics: '$49B', DevTools: '$28B', HR: '$38B',
    Finance: '$120B', Education: '$350B', Health: '$200B',
    Productivity: '$96B', Marketplace: '$80B', Other: '$10B',
  }
  const size = sizeMap[concept.category] ?? '$10B'

  return {
    marketSize: `${size} TAM`,
    tam: `${size} global ${concept.category} market`,
    sam: `~10% of TAM targeting ${concept.targetUsers[0] ?? 'SMBs'}`,
    som: `~1% of SAM achievable in year 1`,
    growthRate: '15-25% CAGR',
    competitors: [
      { name: 'Incumbent A', description: 'Legacy solution with high pricing', weakness: 'No AI, poor UX' },
      { name: 'Startup B', description: 'VC-backed competitor', weakness: 'Complex onboarding' },
      { name: 'DIY Tools', description: 'Spreadsheets and manual processes', weakness: 'Not scalable' },
    ],
    uniqueOpportunity: `AI-native ${concept.category} tool built for ${concept.targetUsers[0] ?? 'modern teams'} — no legacy baggage`,
    entryBarriers: ['Network effects', 'Data moat', 'Switching costs'],
    keyTrends: ['AI adoption in SMBs', 'Remote work tools demand', 'No-code movement'],
    targetGeographies: ['United States', 'United Kingdom', 'Canada', 'Australia'],
    timeToMarket: '2-4 months',
  }
}
