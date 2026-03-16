/**
 * SEO Generator — produces keyword research, SEO landing pages, and blog topics.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { StartupConcept } from '@/lib/services/startup/startup-brain'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface KeywordCluster {
  seed: string
  keywords: string[]
  searchVolume: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'medium' | 'hard'
  intent: 'informational' | 'commercial' | 'transactional'
}

export interface SEOLandingPage {
  slug: string
  title: string
  metaDescription: string
  h1: string
  targetKeyword: string
  content: string   // HTML content block
}

export interface SEOStrategy {
  primaryKeywords: string[]
  keywordClusters: KeywordCluster[]
  landingPages: SEOLandingPage[]
  blogTopics: { title: string; keyword: string; intent: string }[]
  technicalChecklist: string[]
  backlinkTargets: string[]
  estimatedMonthlyTraffic: string
}

const SYSTEM = `You are an SEO strategist specializing in SaaS growth.
Generate a comprehensive SEO strategy.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "primaryKeywords": ["keyword1"],
  "keywordClusters": [
    { "seed": "crm software", "keywords": ["best crm", "crm for startups"], "searchVolume": "high", "difficulty": "medium", "intent": "commercial" }
  ],
  "landingPages": [
    { "slug": "/crm-for-startups", "title": "Best CRM for Startups", "metaDescription": "...", "h1": "...", "targetKeyword": "crm for startups", "content": "<p>...</p>" }
  ],
  "blogTopics": [
    { "title": "10 ways to...", "keyword": "target keyword", "intent": "informational" }
  ],
  "technicalChecklist": ["item 1"],
  "backlinkTargets": ["site 1"],
  "estimatedMonthlyTraffic": "5,000-15,000 visitors/month"
}`

export async function generateSEOStrategy(
  concept: StartupConcept,
  modelId: ModelId = 'gemini_flash',
): Promise<SEOStrategy> {
  logger.info('ai-pipeline', '[SEOGenerator] Generating strategy', concept.name)

  return aiJsonRequest<SEOStrategy>(
    {
      system: SYSTEM,
      prompt: `Generate SEO strategy for:
Product: ${concept.name}
Category: ${concept.category}
Target users: ${concept.targetUsers.join(', ')}
Value proposition: ${concept.valueProposition}`,
      modelId,
      maxOutputTokens: 1500,
      timeoutMs: 18_000,
    },
    () => defaultSEO(concept),
  )
}

function defaultSEO(concept: StartupConcept): SEOStrategy {
  const cat = concept.category.toLowerCase()
  const user = concept.targetUsers[0] ?? 'teams'

  return {
    primaryKeywords: [
      `${cat} software`,
      `best ${cat} tool`,
      `${cat} for ${user}`,
      `${concept.name.toLowerCase()} alternative`,
    ],
    keywordClusters: [
      {
        seed: `${cat} software`,
        keywords: [`best ${cat}`, `${cat} app`, `${cat} platform`, `${cat} solution`],
        searchVolume: 'high',
        difficulty: 'hard',
        intent: 'commercial',
      },
      {
        seed: `${cat} for ${user}`,
        keywords: [`${cat} ${user}`, `${user} ${cat} tool`, `${cat} small business`],
        searchVolume: 'medium',
        difficulty: 'medium',
        intent: 'commercial',
      },
      {
        seed: `how to ${cat}`,
        keywords: [`${cat} tips`, `${cat} best practices`, `improve ${cat}`],
        searchVolume: 'medium',
        difficulty: 'easy',
        intent: 'informational',
      },
    ],
    landingPages: [
      {
        slug: `/${cat}-for-${user.replace(/\s+/g, '-')}`,
        title: `Best ${concept.category} for ${user} — ${concept.name}`,
        metaDescription: `${concept.valueProposition}. Try ${concept.name} free.`,
        h1: `The ${concept.category} built for ${user}`,
        targetKeyword: `${cat} for ${user}`,
        content: `<p>${concept.solutionDescription}</p>`,
      },
      {
        slug: `/${concept.name.toLowerCase()}-alternative`,
        title: `${concept.name} — The Best Alternative`,
        metaDescription: `Looking for a better ${cat} solution? ${concept.name} offers ${concept.valueProposition}.`,
        h1: `Why teams switch to ${concept.name}`,
        targetKeyword: `${concept.name.toLowerCase()} alternative`,
        content: `<p>${concept.unfairAdvantage}</p>`,
      },
    ],
    blogTopics: [
      { title: `10 ways to improve your ${cat} workflow in 2026`, keyword: `${cat} workflow`, intent: 'informational' },
      { title: `Why ${user} are switching to AI-powered ${cat} tools`, keyword: `ai ${cat}`, intent: 'informational' },
      { title: `${concept.name} vs competitors: honest comparison`, keyword: `${concept.name.toLowerCase()} vs`, intent: 'commercial' },
      { title: `How to choose the right ${cat} software for your business`, keyword: `best ${cat} software`, intent: 'commercial' },
      { title: `${concept.category} ROI: how to measure success`, keyword: `${cat} roi`, intent: 'informational' },
    ],
    technicalChecklist: [
      'Set up Google Search Console',
      'Submit sitemap.xml',
      'Implement structured data (JSON-LD)',
      'Optimize Core Web Vitals',
      'Add canonical URLs',
      'Enable HTTPS',
      'Compress images (WebP)',
      'Implement lazy loading',
    ],
    backlinkTargets: [
      'Product Hunt',
      'G2.com',
      'Capterra',
      'AlternativeTo',
      'SaaSHub',
      'BetaList',
      'Indie Hackers',
    ],
    estimatedMonthlyTraffic: '3,000–12,000 visitors/month (6 months)',
  }
}
