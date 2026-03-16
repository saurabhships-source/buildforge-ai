import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { runMaintenancePipeline } from '@/lib/ai-engine/orchestrator'
import { selectModel } from '@/lib/ai-engine/model-router'
import { selectMaintenanceAgents, logImprovement } from '@/lib/maintenance-scheduler'
import { analyzeProject } from '@/lib/ai-engine/codebase-graph/codebase-analyzer'
import type { AgentType } from '@/lib/ai-engine/model-router'

export const maxDuration = 300

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

// POST /api/projects/[id]/maintain — run autonomous maintenance cycle on a project
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { id: projectId } = await params

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })
  if (!user?.subscription) return new NextResponse('User not found', { status: 404 })

  const sub = user.subscription
  if (sub.creditsRemaining < 4) {
    return NextResponse.json({ error: 'Need at least 4 credits for maintenance cycle' }, { status: 402 })
  }

  // Get latest version files
  const latestVersion = await anyDb.version.findFirst({
    where: { projectId },
    orderBy: { versionNum: 'desc' },
  })
  if (!latestVersion) {
    return NextResponse.json({ error: 'No versions found for this project' }, { status: 404 })
  }

  const files = latestVersion.files as Record<string, string>
  const { analyses } = analyzeProject(files)
  const { analyses: analysesForHealth } = analyzeProject(files)

  // Import computeHealthScore inline to avoid circular
  const { computeHealthScore } = await import('@/lib/ai-engine/codebase-graph/codebase-analyzer')
  const health = computeHealthScore(analysesForHealth)

  // Select agents based on health
  const body = await req.json().catch(() => ({})) as { agents?: AgentType[] }
  const agents = (body.agents ?? selectMaintenanceAgents(health)) as AgentType[]
  const creditCost = Math.min(agents.length, sub.creditsRemaining)

  await db.subscription.update({
    where: { userId: user.id },
    data: { creditsRemaining: { decrement: creditCost } },
  })

  try {
    const selectedModel = selectModel(sub.plan)
    const result = await runMaintenancePipeline({ files, agents, modelId: selectedModel })

    // Save new version
    const versionNum = (latestVersion.versionNum ?? 0) + 1
    const version = await anyDb.version.create({
      data: {
        projectId,
        versionNum,
        prompt: `Autonomous maintenance: ${agents.join(', ')}`,
        files: result.files,
        model: selectedModel,
        agent: 'builder',
        creditsUsed: creditCost,
      },
    })

    // Persist health snapshot
    await anyDb.healthSnapshot.create({
      data: {
        projectId,
        versionNum,
        overall: result.healthAfter.overall,
        security: result.healthAfter.security,
        performance: result.healthAfter.performance,
        maintainability: result.healthAfter.maintainability,
        seo: result.healthAfter.seo,
        accessibility: result.healthAfter.accessibility,
        issueCount: result.steps.reduce((n: number, s: { changes: string[] }) => n + s.changes.length, 0),
      },
    })

    // Log improvements
    for (const step of result.steps.filter(s => s.status === 'completed')) {
      logImprovement({
        projectId,
        agent: step.agent as Parameters<typeof logImprovement>[0]['agent'],
        runAt: new Date(),
        durationMs: step.durationMs ?? 0,
        changes: step.changes,
        description: step.description,
        healthBefore: result.healthBefore.overall,
        healthAfter: result.healthAfter.overall,
        status: 'completed',
      })
    }

    return NextResponse.json({
      versionId: version.id,
      versionNum,
      steps: result.steps,
      healthBefore: result.healthBefore,
      healthAfter: result.healthAfter,
      files: result.files,
    })
  } catch (err) {
    await db.subscription.update({
      where: { userId: user.id },
      data: { creditsRemaining: { increment: creditCost } },
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Maintenance failed' },
      { status: 500 }
    )
  }
}
