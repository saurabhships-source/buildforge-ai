/**
 * Marketing Generator — creates a go-to-market strategy for the startup.
 * Includes Product Hunt launch, SEO strategy, social media, and email outreach.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { StartupConcept } from './startup-brain'
import type { MarketAnalysis } from './market-analyzer'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface ProductHuntLaunch {
  title: string
  tagline: string
  description: string
  topics: string[]
  launchDay: string       // e.g. "Tuesday"
  hunterMessage: string
  firstComment: string
}

export interface SEOStrategy {
  primaryKeywords: string[]
  longTailKeywords: string[]
  blogTopics: string[]
  landingPageTitles: string[]
  metaDescriptions: string[]
}

export interface SocialContent {
  twitterThread: string[]     // array of tweets
  linkedInPost: string
  redditPost: { subreddit: string; title: string; body: string }
  hackerNewsPost: { title: string; url: string }
}

export interface EmailSequence {
  subject: string
  body: string
  sendDay: number   // day after signup
  goal: string
}

export interface MarketingStrategy {
  productHunt: ProductHuntLaunch
  seo: SEOStrategy
  social: SocialContent
  emailSequences: EmailSequence[]
  launchChecklist: string[]
  channels: { channel: string; priority: 'high' | 'medium' | 'low'; tactic: string }[]
}

const SYSTEM = `You are a growth marketer and startup launch expert.
Generate a complete go-to-market strategy for a SaaS startup.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "productHunt": {
    "title": "Product name",
    "tagline": "Short tagline",
    "description": "2-3 sentence description",
    "topics": ["topic1", "topic2"],
    "launchDay": "Tuesday",
    "hunterMessage": "message to hunter community",
    "firstComment": "maker's first comment"
  },
  "seo": {
    "primaryKeywords": ["keyword1"],
    "longTailKeywords": ["long tail 1"],
    "blogTopics": ["topic 1"],
    "landingPageTitles": ["title 1"],
    "metaDescriptions": ["description 1"]
  },
  "social": {
    "twitterThread": ["tweet 1", "tweet 2", "tweet 3"],
    "linkedInPost": "full linkedin post",
    "redditPost": { "subreddit": "r/startups", "title": "title", "body": "body" },
    "hackerNewsPost": { "title": "Show HN: ...", "url": "https://..." }
  },
  "emailSequences": [
    { "subject": "Welcome!", "body": "email body", "sendDay": 0, "goal": "onboarding" }
  ],
  "launchChecklist": ["item 1", "item 2"],
  "channels": [
    { "channel": "Product Hunt", "priority": "high", "tactic": "launch strategy" }
  ]
}`

export async function generateMarketing(
  concept: StartupConcept,
  market: MarketAnalysis,
  modelId: ModelId = 'gemini_flash',
): Promise<MarketingStrategy> {
  logger.info('ai-pipeline', '[MarketingGenerator] Generating strategy', concept.name)

  return aiJsonRequest<MarketingStrategy>(
    {
      system: SYSTEM,
      prompt: `Generate marketing strategy for:
Product: ${concept.name}
Tagline: ${concept.tagline}
Problem: ${concept.problemStatement}
Target users: ${concept.targetUsers.join(', ')}
Unique opportunity: ${market.uniqueOpportunity}
Key trends: ${market.keyTrends.join(', ')}`,
      modelId,
      maxOutputTokens: 2000,
      timeoutMs: 20_000,
    },
    () => defaultMarketing(concept),
  )
}

function defaultMarketing(concept: StartupConcept): MarketingStrategy {
  const slug = concept.name.toLowerCase().replace(/\s+/g, '-')

  return {
    productHunt: {
      title: concept.name,
      tagline: concept.tagline,
      description: `${concept.solutionDescription} Built for ${concept.targetUsers[0] ?? 'modern teams'}.`,
      topics: [concept.category, 'SaaS', 'Productivity', 'AI'],
      launchDay: 'Tuesday',
      hunterMessage: `Hey hunters! We built ${concept.name} to solve ${concept.problemStatement.slice(0, 80)}. Would love your feedback!`,
      firstComment: `Hi Product Hunt! 👋 We're the team behind ${concept.name}. ${concept.valueProposition}. We're offering PH hunters an exclusive 30% discount — use code PRODUCTHUNT at checkout.`,
    },
    seo: {
      primaryKeywords: [
        concept.name.toLowerCase(),
        `${concept.domain} software`,
        `best ${concept.domain} tool`,
        `${concept.domain} for ${concept.targetUsers[0] ?? 'teams'}`,
      ],
      longTailKeywords: [
        `how to ${concept.domain.replace('-', ' ')} faster`,
        `${concept.domain} automation for small business`,
        `${concept.name.toLowerCase()} alternative`,
        `free ${concept.domain} tool`,
      ],
      blogTopics: [
        `10 ways to improve your ${concept.domain} workflow`,
        `Why ${concept.targetUsers[0] ?? 'teams'} are switching to AI-powered ${concept.domain} tools`,
        `${concept.name} vs competitors: honest comparison`,
        `How we built ${concept.name} in 30 days`,
      ],
      landingPageTitles: [
        `${concept.name} — ${concept.tagline}`,
        `The AI-powered ${concept.category} for ${concept.targetUsers[0] ?? 'modern teams'}`,
      ],
      metaDescriptions: [
        `${concept.valueProposition}. Try ${concept.name} free — no credit card required.`,
      ],
    },
    social: {
      twitterThread: [
        `🚀 We just launched ${concept.name}!\n\n${concept.tagline}\n\nHere's what we built and why 🧵`,
        `The problem: ${concept.problemStatement}`,
        `Our solution: ${concept.solutionDescription}`,
        `Key features:\n${concept.keyFeatures.slice(0, 4).map((f, i) => `${i + 1}. ${f}`).join('\n')}`,
        `We're live on Product Hunt today! Would love your support 🙏\n\nLink in bio`,
      ],
      linkedInPost: `Excited to announce the launch of ${concept.name}!\n\n${concept.problemStatement}\n\nWe built ${concept.name} to change that.\n\n${concept.valueProposition}\n\nKey features:\n${concept.keyFeatures.map(f => `✅ ${f}`).join('\n')}\n\nTry it free at https://${slug}.com`,
      redditPost: {
        subreddit: 'r/startups',
        title: `I built ${concept.name} to solve ${concept.problemStatement.slice(0, 60)} — feedback welcome`,
        body: `Hey r/startups!\n\nI've been working on ${concept.name} for the past few months.\n\n**The problem:** ${concept.problemStatement}\n\n**What I built:** ${concept.solutionDescription}\n\n**Who it's for:** ${concept.targetUsers.join(', ')}\n\nWould love honest feedback from this community!`,
      },
      hackerNewsPost: {
        title: `Show HN: ${concept.name} – ${concept.tagline}`,
        url: `https://${slug}.com`,
      },
    },
    emailSequences: [
      {
        subject: `Welcome to ${concept.name} 🎉`,
        body: `Hi there,\n\nWelcome to ${concept.name}! We're thrilled to have you.\n\n${concept.valueProposition}\n\nHere's how to get started:\n1. Complete your profile\n2. Try your first ${concept.domain} workflow\n3. Invite your team\n\nAny questions? Just reply to this email.\n\nTeam ${concept.name}`,
        sendDay: 0,
        goal: 'onboarding',
      },
      {
        subject: `3 tips to get the most out of ${concept.name}`,
        body: `Hi,\n\nHere are 3 power tips for ${concept.name}:\n\n1. ${concept.keyFeatures[0] ?? 'Use the dashboard'}\n2. ${concept.keyFeatures[1] ?? 'Set up integrations'}\n3. ${concept.keyFeatures[2] ?? 'Invite your team'}\n\nLet us know if you need help!\n\nTeam ${concept.name}`,
        sendDay: 3,
        goal: 'activation',
      },
      {
        subject: `Ready to upgrade? Here's what you're missing`,
        body: `Hi,\n\nYou've been using ${concept.name} for a week — great!\n\nUpgrade to Pro to unlock:\n${concept.keyFeatures.slice(2).map(f => `✅ ${f}`).join('\n')}\n\nUse code UPGRADE20 for 20% off your first month.\n\nTeam ${concept.name}`,
        sendDay: 7,
        goal: 'upgrade',
      },
    ],
    launchChecklist: [
      'Set up analytics (Plausible or PostHog)',
      'Create Product Hunt account and schedule launch',
      'Prepare 5 Twitter threads',
      'Write 3 Reddit posts for relevant subreddits',
      'Set up email sequences in your ESP',
      'Create LinkedIn company page',
      'Submit to SaaS directories (G2, Capterra, AlternativeTo)',
      'Reach out to 20 potential beta users',
      'Set up live chat (Crisp or Intercom)',
      'Create a demo video (Loom)',
    ],
    channels: [
      { channel: 'Product Hunt', priority: 'high', tactic: 'Launch on Tuesday, engage all day' },
      { channel: 'Twitter/X', priority: 'high', tactic: 'Thread on launch day, daily tips' },
      { channel: 'LinkedIn', priority: 'medium', tactic: 'Founder story posts, case studies' },
      { channel: 'Reddit', priority: 'medium', tactic: 'Value-first posts in niche subreddits' },
      { channel: 'SEO', priority: 'high', tactic: 'Blog content targeting long-tail keywords' },
      { channel: 'Hacker News', priority: 'medium', tactic: 'Show HN post on launch day' },
      { channel: 'Email', priority: 'high', tactic: 'Automated onboarding + upgrade sequences' },
      { channel: 'Cold outreach', priority: 'low', tactic: 'Personalized emails to ICP companies' },
    ],
  }
}
