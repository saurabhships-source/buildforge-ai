/**
 * Content Engine — generates blog posts, tutorials, and feature pages.
 */

import { aiRequest, stripFences } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { StartupConcept } from '@/lib/services/startup/startup-brain'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface BlogPost {
  slug: string
  title: string
  metaDescription: string
  content: string     // Markdown
  readingTime: number // minutes
  tags: string[]
  publishedAt: string
}

export interface Tutorial {
  slug: string
  title: string
  steps: { title: string; content: string }[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface FeaturePage {
  slug: string
  featureName: string
  headline: string
  description: string
  benefits: string[]
  content: string   // HTML
}

export interface ContentPlan {
  blogPosts: BlogPost[]
  tutorials: Tutorial[]
  featurePages: FeaturePage[]
  contentCalendar: { week: number; type: string; title: string }[]
}

const BLOG_SYSTEM = `You are a SaaS content marketer. Write a high-quality blog post in Markdown.
Include: introduction, 5-7 sections with H2 headings, practical tips, and a conclusion.
Return ONLY the Markdown content — no fences, no explanation.`

export async function generateContentPlan(
  concept: StartupConcept,
  blogTopics: string[],
  modelId: ModelId = 'gemini_flash',
): Promise<ContentPlan> {
  logger.info('ai-pipeline', '[ContentEngine] Generating content plan', concept.name)

  // Generate first blog post with AI, rest are stubs
  const firstPost = await generateBlogPost(concept, blogTopics[0] ?? `How ${concept.name} works`, modelId)

  const blogPosts: BlogPost[] = [
    firstPost,
    ...blogTopics.slice(1, 5).map((title, i) => stubBlogPost(concept, title, i + 1)),
  ]

  const tutorials: Tutorial[] = [
    {
      slug: `getting-started-with-${concept.name.toLowerCase().replace(/\s+/g, '-')}`,
      title: `Getting started with ${concept.name}`,
      steps: [
        { title: 'Create your account', content: 'Sign up at the homepage — no credit card required.' },
        { title: 'Set up your workspace', content: 'Configure your workspace settings and invite team members.' },
        { title: `Start your first ${concept.domain}`, content: `Use the dashboard to create your first ${concept.domain} workflow.` },
        { title: 'Explore integrations', content: 'Connect your existing tools via the integrations panel.' },
      ],
      difficulty: 'beginner',
    },
  ]

  const featurePages: FeaturePage[] = concept.keyFeatures.slice(0, 3).map(feature => ({
    slug: `/features/${feature.toLowerCase().replace(/\s+/g, '-')}`,
    featureName: feature,
    headline: `${feature} — built for ${concept.targetUsers[0] ?? 'modern teams'}`,
    description: `${concept.name}'s ${feature} helps ${concept.targetUsers[0] ?? 'teams'} work smarter.`,
    benefits: [
      `Save time with automated ${feature.toLowerCase()}`,
      `Real-time visibility into your ${concept.domain}`,
      `Works seamlessly with your existing tools`,
    ],
    content: `<section><h2>${feature}</h2><p>${concept.solutionDescription}</p></section>`,
  }))

  const contentCalendar = blogTopics.slice(0, 8).map((title, i) => ({
    week: i + 1,
    type: i % 3 === 0 ? 'blog' : i % 3 === 1 ? 'tutorial' : 'feature-page',
    title,
  }))

  return { blogPosts, tutorials, featurePages, contentCalendar }
}

async function generateBlogPost(
  concept: StartupConcept,
  title: string,
  modelId: ModelId,
): Promise<BlogPost> {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  try {
    const content = await aiRequest({
      system: BLOG_SYSTEM,
      prompt: `Write a blog post titled: "${title}"\nProduct context: ${concept.name} — ${concept.valueProposition}\nTarget audience: ${concept.targetUsers.join(', ')}`,
      modelId,
      maxOutputTokens: 2000,
      timeoutMs: 25_000,
    })

    return {
      slug,
      title,
      metaDescription: `${title} — learn how ${concept.name} helps ${concept.targetUsers[0] ?? 'teams'}.`,
      content: stripFences(content),
      readingTime: Math.ceil(content.split(' ').length / 200),
      tags: [concept.category, concept.domain, 'SaaS', 'productivity'],
      publishedAt: new Date().toISOString(),
    }
  } catch {
    return stubBlogPost(concept, title, 0)
  }
}

function stubBlogPost(concept: StartupConcept, title: string, index: number): BlogPost {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    slug,
    title,
    metaDescription: `${title} — ${concept.valueProposition}`,
    content: `# ${title}\n\n${concept.solutionDescription}\n\n## Why this matters\n\n${concept.problemStatement}\n\n## How ${concept.name} helps\n\n${concept.valueProposition}\n\n## Getting started\n\nTry ${concept.name} free at [${concept.name.toLowerCase()}.com](/).`,
    readingTime: 5,
    tags: [concept.category, concept.domain, 'SaaS'],
    publishedAt: new Date(Date.now() + index * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}
