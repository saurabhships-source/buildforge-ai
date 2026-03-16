/**
 * Pricing Generator — creates SaaS pricing tiers tailored to the startup concept.
 * Returns free, pro, and team plans with features and recommended price points.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { StartupConcept } from './startup-brain'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface PricingFeature {
  text: string
  included: boolean
}

export interface PricingTier {
  name: string
  price: string           // e.g. "$0", "$19", "$49"
  billingPeriod: 'month' | 'year' | 'one-time'
  description: string
  features: PricingFeature[]
  cta: string
  highlighted: boolean    // true for recommended tier
  limits: {
    users?: number | 'unlimited'
    projects?: number | 'unlimited'
    storage?: string
    apiCalls?: number | 'unlimited'
  }
}

export interface PricingModel {
  tiers: [PricingTier, PricingTier, PricingTier]  // free, pro, team
  annualDiscount: number    // e.g. 20 (percent)
  currency: 'USD'
  trialDays: number
  moneyBackDays: number
}

const SYSTEM = `You are a SaaS pricing strategist.
Generate a 3-tier pricing model (Free, Pro, Team) for a SaaS product.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "tiers": [
    {
      "name": "Free",
      "price": "$0",
      "billingPeriod": "month",
      "description": "Get started for free",
      "features": [{ "text": "feature", "included": true }],
      "cta": "Get started free",
      "highlighted": false,
      "limits": { "users": 1, "projects": 3, "storage": "1GB", "apiCalls": 1000 }
    },
    {
      "name": "Pro",
      "price": "$19",
      "billingPeriod": "month",
      "description": "For growing teams",
      "features": [{ "text": "feature", "included": true }],
      "cta": "Start free trial",
      "highlighted": true,
      "limits": { "users": 5, "projects": "unlimited", "storage": "20GB", "apiCalls": 50000 }
    },
    {
      "name": "Team",
      "price": "$49",
      "billingPeriod": "month",
      "description": "For scaling businesses",
      "features": [{ "text": "feature", "included": true }],
      "cta": "Start free trial",
      "highlighted": false,
      "limits": { "users": "unlimited", "projects": "unlimited", "storage": "100GB", "apiCalls": "unlimited" }
    }
  ],
  "annualDiscount": 20,
  "currency": "USD",
  "trialDays": 14,
  "moneyBackDays": 30
}`

export async function generatePricing(
  concept: StartupConcept,
  modelId: ModelId = 'gemini_flash',
): Promise<PricingModel> {
  logger.info('ai-pipeline', '[PricingGenerator] Generating pricing', concept.name)

  return aiJsonRequest<PricingModel>(
    {
      system: SYSTEM,
      prompt: `Generate pricing for:
Product: ${concept.name}
Category: ${concept.category}
Business model: ${concept.businessModel}
Key features: ${concept.keyFeatures.join(', ')}
Target users: ${concept.targetUsers.join(', ')}`,
      modelId,
      maxOutputTokens: 1200,
      timeoutMs: 15_000,
    },
    () => defaultPricing(concept),
  )
}

function defaultPricing(concept: StartupConcept): PricingModel {
  const features = concept.keyFeatures

  return {
    tiers: [
      {
        name: 'Free',
        price: '$0',
        billingPeriod: 'month',
        description: 'Perfect for getting started',
        features: [
          { text: features[0] ?? 'Core features', included: true },
          { text: features[1] ?? 'Basic dashboard', included: true },
          { text: 'Community support', included: true },
          { text: features[2] ?? 'Advanced features', included: false },
          { text: 'Priority support', included: false },
          { text: 'Team collaboration', included: false },
        ],
        cta: 'Get started free',
        highlighted: false,
        limits: { users: 1, projects: 3, storage: '1GB', apiCalls: 1000 },
      },
      {
        name: 'Pro',
        price: '$19',
        billingPeriod: 'month',
        description: 'For professionals and growing teams',
        features: [
          { text: features[0] ?? 'Core features', included: true },
          { text: features[1] ?? 'Advanced dashboard', included: true },
          { text: features[2] ?? 'Advanced features', included: true },
          { text: features[3] ?? 'Integrations', included: true },
          { text: 'Priority support', included: true },
          { text: 'Team collaboration', included: false },
        ],
        cta: 'Start 14-day free trial',
        highlighted: true,
        limits: { users: 5, projects: 'unlimited', storage: '20GB', apiCalls: 50000 },
      },
      {
        name: 'Team',
        price: '$49',
        billingPeriod: 'month',
        description: 'For scaling businesses',
        features: [
          { text: 'Everything in Pro', included: true },
          { text: features[4] ?? 'Analytics & reporting', included: true },
          { text: 'Team collaboration', included: true },
          { text: 'SSO & advanced security', included: true },
          { text: 'Dedicated support', included: true },
          { text: 'Custom integrations', included: true },
        ],
        cta: 'Start 14-day free trial',
        highlighted: false,
        limits: { users: 'unlimited', projects: 'unlimited', storage: '100GB', apiCalls: 'unlimited' },
      },
    ],
    annualDiscount: 20,
    currency: 'USD',
    trialDays: 14,
    moneyBackDays: 30,
  }
}
