import { NextResponse } from 'next/server'
import { requireUserId, safeDb, DEV_APP_USER, isDatabaseConfigured } from '@/lib/safe-auth'
import { runAgent, runAutonomousPipeline, runStartupGenerator, analyzeCodebase } from '@/lib/ai-engine/orchestrator'
import { selectModel, routeAgent, isFreeStackModel, toFreeModelId, AGENT_MODEL_MAP } from '@/lib/ai-engine/model-router'
import { generateFallbackProject, sanitizeFiles } from '@/lib/ai-engine/fallback-generator'
import { validateAIOutput } from '@/lib/ai-output-validator'
import { generateWithFallback } from '@/lib/ai-engine/free-stack/free-router'
import { builderSystemPrompt, buildUserMessage, isLandingPageOnly } from '@/lib/ai-engine/agents/builder-agent'
import { parseFilesJson } from '@/lib/ai-engine/tool-adapters/base-adapter'
import { aiCache } from '@/lib/cache/ai-cache'
import { CREDIT_COSTS } from '@/lib/credits'
import { generateAppPipeline } from '@/lib/ai/pipeline'
import type { ModelId, AgentType } from '@/lib/ai-engine/model-router'

export const maxDuration = 300

export async function POST(req: Request) {
  // Auth — returns dev mock when Clerk isn't configured
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  // Parse body first so we can use prompt in fallback
  let body: {
    prompt: string
    appType?: string
    projectId?: string
    modelId?: ModelId
    forceAgent?: AgentType
    existingFiles?: Record<string, string>
    autonomousMode?: boolean
    localAIMode?: boolean
    startupMode?: boolean
    analyzeOnly?: boolean
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    prompt,
    appType = 'website',
    projectId,
    modelId,
    forceAgent,
    existingFiles,
    autonomousMode = false,
    localAIMode = false,
    startupMode = false,
    analyzeOnly = false,
  } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  // analyzeOnly — no AI generation, just codebase intelligence
  if (analyzeOnly && existingFiles) {
    const analysis = analyzeCodebase(existingFiles)
    return NextResponse.json({ analysis })
  }

  // ── Cache lookup (before credit deduction) ─────────────────────────────
  // Skip cache for edits (existingFiles present) and autonomous/startup modes
  const isCacheable = !existingFiles && !autonomousMode && !startupMode && !analyzeOnly
  if (isCacheable) {
    const cacheResult = await aiCache.lookup(prompt, appType)
    if (cacheResult.hit) {
      const { entry, level, similarity } = cacheResult
      console.log(`[generate] cache hit L${level} similarity=${similarity.toFixed(3)}`)
      return NextResponse.json({
        files: sanitizeFiles(entry.files),
        entrypoint: entry.entrypoint,
        description: entry.description,
        agent: entry.agent,
        model: entry.model,
        projectId: null,
        versionId: 'cached',
        versionNum: 0,
        cacheHit: true,
        cacheLevel: level,
        cacheSimilarity: similarity,
      })
    }
  }

  // Resolve user + subscription — use dev mock when DB isn't configured
  let user: { id: string; clerkId: string; name: string; email: string; role: string; githubToken: string | null } = DEV_APP_USER
  let sub: { plan: string; creditsRemaining: number; creditsTotal: number } = DEV_APP_USER.subscription

  if (isDatabaseConfigured()) {
    try {
      const { db } = await import('@/lib/db')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyDb = db as any

      let dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { subscription: true },
      })

      if (!dbUser) {
        // Auto-provision
        const clerkMod = await import('@clerk/nextjs/server')
        const clerkUser = await clerkMod.currentUser()
        const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@buildforge.ai`
        const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || email

        dbUser = await db.user.create({
          data: {
            clerkId: userId,
            email,
            name,
            subscription: { create: { plan: 'free', creditsRemaining: 50, creditsTotal: 50 } },
          },
          include: { subscription: true },
        })
      }

      if (dbUser.subscription) {
        user = dbUser as typeof DEV_APP_USER & { id: string }
        sub = {
          plan: dbUser.subscription.plan as 'free' | 'pro' | 'enterprise',
          creditsRemaining: dbUser.subscription.creditsRemaining,
          creditsTotal: dbUser.subscription.creditsTotal,
        }
      }

      const isAdminUser = dbUser.role === 'admin' ||
        (process.env.ADMIN_USER_IDS ?? '').split(',').filter(Boolean).includes(userId)

      if (!isAdminUser) {
        if (!sub || sub.creditsRemaining < 1) {
          return NextResponse.json({ error: 'You have run out of credits. Upgrade your plan to continue.' }, { status: 402 })
        }

        const creditCost = startupMode
          ? CREDIT_COSTS.startupGenerator
          : autonomousMode
          ? CREDIT_COSTS.autonomousPipeline
          : CREDIT_COSTS.generateProject

        if (sub.creditsRemaining < creditCost) {
          return NextResponse.json({ error: `You have run out of credits. Upgrade your plan to continue.` }, { status: 402 })
        }

        // Deduct credits upfront
        await db.subscription.update({
          where: { userId: dbUser.id },
          data: { creditsRemaining: { decrement: creditCost } },
        })

        // Log usage
        await db.creditUsage.create({
          data: {
            userId: dbUser.id,
            action: startupMode ? 'startupGenerator' : autonomousMode ? 'autonomousPipeline' : 'generateProject',
            creditsUsed: creditCost,
          },
        }).catch(() => {/* non-fatal */})
      }
    } catch (dbErr) {
      console.error('[generate] DB setup failed, continuing without DB:', dbErr)
    }
  }

  const creditCost = startupMode
    ? CREDIT_COSTS.startupGenerator
    : autonomousMode
    ? CREDIT_COSTS.autonomousPipeline
    : CREDIT_COSTS.generateProject
  const selectedModel = selectModel(sub.plan, modelId, localAIMode)
  const detectedAgent = forceAgent ?? routeAgent(prompt)

  try {
    let files: Record<string, string>
    let entrypoint: string
    let description: string
    let agent: AgentType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pipelineSteps: any[] | undefined

    // Use multi-stage pipeline for full apps (not landing pages, not autonomous/startup)
    const usePipeline = !existingFiles && !autonomousMode && !startupMode && !isLandingPageOnly(prompt)

    if (startupMode) {
      const result = await runStartupGenerator({ prompt, modelId: selectedModel })
      files = result.files
      entrypoint = result.entrypoint
      description = result.description
      agent = result.agent
    } else if (usePipeline) {
      const pipelineResult = await generateAppPipeline(prompt)
      files = pipelineResult.files
      entrypoint = pipelineResult.entrypoint
      description = pipelineResult.description
      agent = 'builder'
      pipelineSteps = pipelineResult.stages
    } else if (autonomousMode) {
      const pipeline = await runAutonomousPipeline({
        prompt, appType, modelId: selectedModel, existingFiles,
      })
      files = pipeline.files
      entrypoint = pipeline.entrypoint
      description = `Autonomous pipeline completed — ${pipeline.steps.filter(s => s.status === 'completed').length} agents ran`
      agent = 'builder'
      pipelineSteps = pipeline.steps
    } else if (isFreeStackModel(selectedModel) || localAIMode) {
      const freeModelId = toFreeModelId(selectedModel)
      const agentType = forceAgent ?? detectedAgent
      const agentKey = agentType as keyof typeof AGENT_MODEL_MAP
      const assignedModel = AGENT_MODEL_MAP[agentKey] ?? freeModelId
      const system = builderSystemPrompt(appType, existingFiles, prompt)
      const userMsg = buildUserMessage(prompt, appType, existingFiles)
      const result = await generateWithFallback({
        agentType: agentType ?? 'builder',
        system,
        prompt: userMsg,
        maxTokens: 12000,
        localAIOnly: localAIMode,
      })
      const parsed = parseFilesJson(result.text)
      files = parsed.files
      entrypoint = parsed.entrypoint
      description = parsed.description ?? `Generated by ${result.modelUsed} via ${result.provider}`
      agent = agentType ?? 'builder'
    } else {
      const result = await runAgent({
        prompt, appType, modelId: selectedModel, existingFiles, forceAgent: detectedAgent,
      })
      files = result.files
      entrypoint = result.entrypoint
      description = result.description
      agent = result.agent
    }

    console.log('[generate] files produced:', Object.keys(files))

    // Validate AI output
    const validation = validateAIOutput(files, existingFiles)
    if (!validation.valid) {
      console.warn('[generate] validation failed:', validation.errors)
      const fallback = generateFallbackProject(prompt, validation.errors.join('; '))
      files = fallback.files
      entrypoint = fallback.entrypoint
      description = fallback.description
    } else if (validation.sanitized) {
      files = validation.sanitized
    }

    // ── Store in cache (after validation, before DB persist) ───────────────
    if (isCacheable && Object.keys(files).length > 0) {
      aiCache.store(prompt, appType, {
        files, entrypoint, description, agent, model: selectedModel,
      }).catch(err => console.warn('[generate] cache store error:', err))
    }

    // Persist to DB — failure here must NOT lose the generated files
    let resolvedProjectId = projectId ?? null
    let versionId = 'local'
    let versionNum = 1

    await safeDb(async () => {
      const { db } = await import('@/lib/db')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyDb = db as any

      if (!resolvedProjectId) {
        const project = await anyDb.project.create({
          data: { userId: user.id, name: prompt.slice(0, 60) || 'Untitled Project', appType: appType ?? 'website' },
        })
        resolvedProjectId = project.id
      } else {
        await db.project.update({ where: { id: resolvedProjectId }, data: { updatedAt: new Date() } })
      }

      const lastVersion = await anyDb.version.findFirst({
        where: { projectId: resolvedProjectId }, orderBy: { versionNum: 'desc' },
      })
      versionNum = (lastVersion?.versionNum ?? 0) + 1

      const version = await anyDb.version.create({
        data: { projectId: resolvedProjectId, versionNum, prompt, files, model: selectedModel, agent, creditsUsed: creditCost },
      })
      versionId = version.id
    })

    return NextResponse.json({
      files: sanitizeFiles(files),
      entrypoint,
      description,
      agent,
      model: selectedModel,
      projectId: resolvedProjectId,
      versionId,
      versionNum,
      pipelineSteps,
    })
  } catch (err) {
    // Refund credits if DB is up
    await safeDb(async () => {
      const { db } = await import('@/lib/db')
      await db.subscription.update({
        where: { userId: user.id },
        data: { creditsRemaining: { increment: creditCost } },
      })
    })

    const errorMessage = err instanceof Error ? err.message : 'Generation failed'
    console.error('[generate] error:', errorMessage)

    // Always return files — use static fallback so UI never stays empty
    const fallback = generateFallbackProject(prompt, errorMessage)
    return NextResponse.json(
      {
        error: errorMessage,
        files: sanitizeFiles(fallback.files),
        entrypoint: fallback.entrypoint,
        description: fallback.description,
        agent: 'builder',
        projectId: null,
        versionId: null,
        versionNum: 0,
        pipelineSteps: undefined,
      },
      { status: 500 }
    )
  }
}
