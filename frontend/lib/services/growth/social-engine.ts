/**
 * Social Engine — generates social media campaigns for Twitter, LinkedIn, Reddit, and Product Hunt.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { StartupConcept } from '@/lib/services/startup/startup-brain'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface TwitterCampaign {
  launchThread: string[]
  weeklyTips: string[]
  engagementTweets: string[]
  hashtags: string[]
}

export interface LinkedInCampaign {
  launchPost: string
  founderStory: string
  weeklyPosts: string[]
}

export interface RedditCampaign {
  posts: { subreddit: string; title: string; body: string; type: 'launch' | 'value' | 'feedback' }[]
}

export interface ProductHuntCampaign {
  title: string
  tagline: string
  description: string
  topics: string[]
  launchDay: string
  makerComment: string
  hunterMessage: string
}

export interface SocialCampaign {
  twitter: TwitterCampaign
  linkedin: LinkedInCampaign
  reddit: RedditCampaign
  productHunt: ProductHuntCampaign
  schedule: { day: number; platform: string; content: string }[]
}

const SYSTEM = `You are a social media growth expert for SaaS startups.
Generate a complete social media campaign.
Return ONLY valid JSON — no markdown, no fences.

Schema:
{
  "twitter": {
    "launchThread": ["tweet 1", "tweet 2"],
    "weeklyTips": ["tip tweet 1"],
    "engagementTweets": ["engagement tweet 1"],
    "hashtags": ["#SaaS", "#ProductHunt"]
  },
  "linkedin": {
    "launchPost": "full post",
    "founderStory": "founder story post",
    "weeklyPosts": ["post 1"]
  },
  "reddit": {
    "posts": [{ "subreddit": "r/startups", "title": "...", "body": "...", "type": "launch" }]
  },
  "productHunt": {
    "title": "Product Name",
    "tagline": "Short tagline",
    "description": "2-3 sentences",
    "topics": ["topic1"],
    "launchDay": "Tuesday",
    "makerComment": "first comment",
    "hunterMessage": "message"
  },
  "schedule": [
    { "day": 1, "platform": "Twitter", "content": "launch thread" }
  ]
}`

export async function generateSocialCampaign(
  concept: StartupConcept,
  modelId: ModelId = 'gemini_flash',
): Promise<SocialCampaign> {
  logger.info('ai-pipeline', '[SocialEngine] Generating campaign', concept.name)

  return aiJsonRequest<SocialCampaign>(
    {
      system: SYSTEM,
      prompt: `Generate social media campaign for:
Product: ${concept.name}
Tagline: ${concept.tagline}
Problem: ${concept.problemStatement}
Target users: ${concept.targetUsers.join(', ')}
Key features: ${concept.keyFeatures.join(', ')}`,
      modelId,
      maxOutputTokens: 2000,
      timeoutMs: 20_000,
    },
    () => defaultCampaign(concept),
  )
}

function defaultCampaign(concept: StartupConcept): SocialCampaign {
  const slug = concept.name.toLowerCase().replace(/\s+/g, '')
  const cat = concept.category.toLowerCase()

  return {
    twitter: {
      launchThread: [
        `🚀 We just launched ${concept.name}!\n\n${concept.tagline}\n\nA thread on what we built and why 🧵👇`,
        `The problem:\n\n${concept.problemStatement}\n\nWe've all been there. It's painful.`,
        `Our solution:\n\n${concept.solutionDescription}`,
        `Key features:\n${concept.keyFeatures.slice(0, 4).map((f, i) => `${i + 1}. ${f}`).join('\n')}`,
        `We're live on Product Hunt today!\n\nWould love your support 🙏\n\nhttps://${slug}.com`,
      ],
      weeklyTips: concept.keyFeatures.map(f =>
        `💡 ${concept.name} tip: Use ${f} to save hours every week. Here's how 👇\n\nhttps://${slug}.com`
      ),
      engagementTweets: [
        `What's your biggest challenge with ${cat}? Drop it below 👇`,
        `Hot take: most ${cat} tools are overpriced and underdelivered. Agree? 🔥`,
        `We're building ${concept.name} in public. Ask us anything about ${cat} 👇`,
      ],
      hashtags: [`#${concept.category}`, '#SaaS', '#ProductHunt', '#IndieHackers', '#BuildInPublic'],
    },
    linkedin: {
      launchPost: `🚀 Excited to announce the launch of ${concept.name}!\n\n${concept.problemStatement}\n\nWe built ${concept.name} to change that.\n\n${concept.valueProposition}\n\nKey features:\n${concept.keyFeatures.map(f => `✅ ${f}`).join('\n')}\n\nTry it free → https://${slug}.com\n\n#${concept.category} #SaaS #Launch`,
      founderStory: `6 months ago, I was frustrated with ${concept.problemStatement.slice(0, 60)}...\n\nSo I built ${concept.name}.\n\n${concept.solutionDescription}\n\nToday we're launching publicly. Would love your feedback!\n\nhttps://${slug}.com`,
      weeklyPosts: [
        `How ${concept.name} helped a ${concept.targetUsers[0] ?? 'team'} save 10 hours/week:\n\n${concept.valueProposition}\n\nhttps://${slug}.com`,
        `3 signs you need a better ${cat} tool:\n\n1. You're using spreadsheets\n2. Your team is confused\n3. You're losing deals\n\n${concept.name} fixes all three → https://${slug}.com`,
      ],
    },
    reddit: {
      posts: [
        {
          subreddit: 'r/startups',
          title: `I built ${concept.name} to solve ${concept.problemStatement.slice(0, 60)} — feedback welcome`,
          body: `Hey r/startups!\n\nI've been working on ${concept.name} for the past few months.\n\n**The problem:** ${concept.problemStatement}\n\n**What I built:** ${concept.solutionDescription}\n\n**Who it's for:** ${concept.targetUsers.join(', ')}\n\nWould love honest feedback from this community!\n\nhttps://${slug}.com`,
          type: 'launch',
        },
        {
          subreddit: `r/${cat.replace(/\s+/g, '')}`,
          title: `Free ${cat} tool for ${concept.targetUsers[0] ?? 'teams'} — no credit card required`,
          body: `Built ${concept.name} as a free alternative for ${concept.targetUsers[0] ?? 'teams'}.\n\n${concept.valueProposition}\n\nhttps://${slug}.com`,
          type: 'value',
        },
        {
          subreddit: 'r/SaaS',
          title: `Show r/SaaS: ${concept.name} — ${concept.tagline}`,
          body: `Hi r/SaaS! Launching ${concept.name} today.\n\n${concept.solutionDescription}\n\nLooking for early feedback and beta users.\n\nhttps://${slug}.com`,
          type: 'feedback',
        },
      ],
    },
    productHunt: {
      title: concept.name,
      tagline: concept.tagline,
      description: `${concept.solutionDescription} Built for ${concept.targetUsers[0] ?? 'modern teams'} who want to ${concept.domain} smarter.`,
      topics: [concept.category, 'SaaS', 'Productivity', 'AI'],
      launchDay: 'Tuesday',
      makerComment: `Hi Product Hunt! 👋 We're the team behind ${concept.name}.\n\n${concept.valueProposition}\n\nWe're offering PH hunters an exclusive 30% discount — use code PRODUCTHUNT at checkout.\n\nWould love your feedback!`,
      hunterMessage: `Hey hunters! Check out ${concept.name} — ${concept.tagline}. ${concept.unfairAdvantage}`,
    },
    schedule: [
      { day: 1, platform: 'Twitter', content: 'Launch thread' },
      { day: 1, platform: 'LinkedIn', content: 'Launch post' },
      { day: 1, platform: 'Reddit', content: 'r/startups launch post' },
      { day: 1, platform: 'Product Hunt', content: 'Launch day' },
      { day: 2, platform: 'Twitter', content: 'Thank you tweet + metrics' },
      { day: 3, platform: 'Reddit', content: 'r/SaaS feedback post' },
      { day: 7, platform: 'LinkedIn', content: 'Week 1 learnings post' },
      { day: 14, platform: 'Twitter', content: 'First customer story thread' },
    ],
  }
}
