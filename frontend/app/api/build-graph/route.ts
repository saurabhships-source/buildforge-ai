import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { executeGraph } from '@/lib/build-graph/scheduler'
import { createFullPipeline, createFastPipeline, createMaintenancePipeline, createSaaSPipeline } from '@/lib/build-graph/nodes'
import { selectModel } from '@/lib/ai-engine/model-router'
import { sanitizeFiles } from '@/lib/ai-engine/fallback-generator'
import { planSaaSArchitecture } from '@/lib/ai-engine/agents/planner-agent'
import type { ModelId } from '@/lib/ai-engine/model-router'

export const maxDuration = 300

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  let user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })

  if (!user) {
    const { currentUser } = await import('@clerk/nextjs/server')
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@buildforge.ai`
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || email
    user = await db.user.create({
      data: {
        clerkId: userId, email, name,
        subscription: { create: { plan: 'free', creditsRemaining: 100, creditsTotal: 100 } },
      },
      include: { subscription: true },
    })
  }

  const sub = user.subscription
  if (!sub || sub.creditsRemaining < 1) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  const body: {
    prompt: string
    appType?: string
    modelId?: ModelId
    existingFiles?: Record<string, string>
    projectId?: string
    mode?: 'full' | 'fast' | 'maintenance' | 'saas'
  } = await req.json()

  const {
    prompt,
    appType = 'website',
    modelId,
    existingFiles = {},
    projectId,
    mode = 'fast',
  } = body

  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })

  const creditCost = mode === 'full' || mode === 'saas' ? 9 : mode === 'maintenance' ? 3 : 1
  if (sub.creditsRemaining < creditCost) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  const selectedModel = selectModel(sub.plan, modelId)

  await db.subscription.update({
    where: { userId: user.id },
    data: { creditsRemaining: { decrement: creditCost } },
  })

  try {
    const nodes = mode === 'full'
      ? createFullPipeline()
      : mode === 'maintenance'
        ? createMaintenancePipeline()
        : mode === 'saas'
          ? createSaaSPipeline()
          : createFastPipeline()

    // For saas mode: extract intent, select template, build architecture spec
    let architectureSpec: ReturnType<typeof planSaaSArchitecture>['architecture'] = undefined
    let templateId: string | undefined
    let modules: string[] | undefined

    if (mode === 'saas') {
      const saasResult = planSaaSArchitecture(prompt)
      architectureSpec = saasResult.architecture
      templateId = saasResult.match.templateId
      modules = saasResult.modules
    }

    const result = await executeGraph(nodes, {
      prompt,
      appType: mode === 'saas' ? 'saas' : appType,
      modelId: selectedModel,
      plan: undefined,
      architecture: architectureSpec ?? undefined,
      projectId: projectId ?? null,
      mode,
    })

    // Merge with existing files for maintenance mode
    const finalFiles = mode === 'maintenance'
      ? { ...existingFiles, ...result.files }
      : result.files

    // Persist
    let resolvedProjectId = projectId ?? null
    let versionId = 'local'
    let versionNum = 1

    try {
      if (!resolvedProjectId) {
        const project = await anyDb.project.create({
          data: { userId: user.id, name: prompt.slice(0, 60) || 'Untitled', appType },
        })
        resolvedProjectId = project.id
      }
      const lastVersion = await anyDb.version.findFirst({
        where: { projectId: resolvedProjectId },
        orderBy: { versionNum: 'desc' },
      })
      versionNum = (lastVersion?.versionNum ?? 0) + 1
      const version = await anyDb.version.create({
        data: {
          projectId: resolvedProjectId, versionNum, prompt,
          files: finalFiles, model: selectedModel,
          agent: 'builder', creditsUsed: creditCost,
        },
      })
      versionId = version.id
    } catch (dbErr) {
      console.error('[build-graph] DB save failed:', dbErr)
    }

    return NextResponse.json({
      files: sanitizeFiles(finalFiles),
      nodes: result.nodes,
      events: result.events,
      timeline: result.timeline,
      totalDurationMs: result.totalDurationMs,
      projectId: resolvedProjectId,
      versionId,
      versionNum,
      model: selectedModel,
      templateId,
      modules,
      architecture: architectureSpec,
    })
  } catch (err) {
    try {
      await db.subscription.update({
        where: { userId: user.id },
        data: { creditsRemaining: { increment: creditCost } },
      })
    } catch { /* ignore */ }
    const msg = err instanceof Error ? err.message : 'Build graph failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
