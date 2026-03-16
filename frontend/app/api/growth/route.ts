/**
 * POST /api/growth — run the growth orchestrator for an existing startup
 * GET  /api/growth — get analytics report for a startup
 */

import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { runGrowthOrchestrator } from '@/lib/services/growth/growth-orchestrator'
import { analyticsEngine } from '@/lib/services/growth/analytics-engine'
import { leadStore } from '@/lib/services/growth/lead-generator'
import { enforceCredits } from '@/lib/credits-server'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { StartupConcept } from '@/lib/services/startup/startup-brain'

export async function POST(req: Request) {
  // Auth required
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  try {
    const body = await req.json()
    const { startupId, concept, modelId = 'gemini_flash' } = body

    if (!startupId || !concept) {
      return NextResponse.json({ error: 'startupId and concept are required' }, { status: 400 })
    }

    // Enforce credits — admin bypass handled inside enforceCredits
    const creditError = await enforceCredits(userId, 'growthEngine', { startupId })
    if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

    const growth = await runGrowthOrchestrator(startupId, concept as StartupConcept, {
      modelId: modelId as ModelId,
    })

    return NextResponse.json({
      startupId: growth.startupId,
      launchReadinessScore: growth.launchReadinessScore,
      launchReadinessChecklist: growth.launchReadinessChecklist,
      seo: {
        primaryKeywords: growth.seo.primaryKeywords,
        landingPages: growth.seo.landingPages.length,
        blogTopics: growth.seo.blogTopics.length,
        estimatedTraffic: growth.seo.estimatedMonthlyTraffic,
      },
      content: {
        blogPosts: growth.content.blogPosts.length,
        tutorials: growth.content.tutorials.length,
        featurePages: growth.content.featurePages.length,
      },
      social: {
        twitterThreadLength: growth.social.twitter.launchThread.length,
        redditPosts: growth.social.reddit.posts.length,
        productHunt: growth.social.productHunt.title,
        scheduleItems: growth.social.schedule.length,
      },
      email: {
        sequences: Object.keys(growth.email).length,
        totalEmails: Object.values(growth.email).reduce((sum, s) => sum + s.emails.length, 0),
      },
      analytics: growth.analyticsSetup,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Growth orchestration failed'
    console.error('[growth POST]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  // Auth required for analytics
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse

  try {
    const { searchParams } = new URL(req.url)
    const startupId = searchParams.get('startupId')
    const days = parseInt(searchParams.get('days') ?? '30', 10)

    if (!startupId) {
      return NextResponse.json({ error: 'startupId is required' }, { status: 400 })
    }

    const report = analyticsEngine.getReport(startupId, days)
    const leads = leadStore.stats(startupId)

    return NextResponse.json({ report, leads })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get analytics'
    console.error('[growth GET]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
