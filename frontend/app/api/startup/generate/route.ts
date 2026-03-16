/**
 * POST /api/startup/generate
 * Generates a complete startup package from a single idea prompt.
 */

import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { generateStartup } from '@/lib/services/startup/startup-orchestrator'
import { runGrowthOrchestrator } from '@/lib/services/growth/growth-orchestrator'
import { enforceCredits } from '@/lib/credits-server'
import type { ModelId } from '@/lib/ai-engine/model-router'

export async function POST(req: Request) {
  // Auth required — no anonymous generation
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  try {
    const body = await req.json()
    const {
      idea,
      deploy = false,
      deployProvider = 'vercel',
      modelId = 'gemini_flash',
      includeGrowth = true,
    } = body

    if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
      return NextResponse.json({ error: 'idea is required (min 3 characters)' }, { status: 400 })
    }

    // Enforce credits — admin bypass handled inside enforceCredits
    const creditError = await enforceCredits(userId, 'startupGenerator', { idea: idea.slice(0, 80) })
    if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

    // Generate startup package
    const startup = await generateStartup(idea.trim(), {
      ownerId: userId,
      modelId: modelId as ModelId,
      deploy,
      deployProvider,
    })

    // Optionally generate growth package
    let growth = null
    if (includeGrowth) {
      growth = await runGrowthOrchestrator(startup.projectId, startup.concept, {
        modelId: modelId as ModelId,
      })
    }

    return NextResponse.json({
      projectId: startup.projectId,
      concept: startup.concept,
      market: startup.market,
      pricing: startup.pricing,
      marketing: startup.marketing,
      previewUrl: startup.previewUrl,
      deploymentUrl: startup.deploymentUrl,
      deployJobId: startup.deployJobId,
      fileCount: startup.fileCount,
      fromCache: startup.fromCache,
      growth: growth ? {
        launchReadinessScore: growth.launchReadinessScore,
        launchReadinessChecklist: growth.launchReadinessChecklist,
        seoKeywords: growth.seo.primaryKeywords,
        emailSequences: Object.keys(growth.email).length,
        socialChannels: growth.social.schedule.length,
      } : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Startup generation failed'
    console.error('[startup/generate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
