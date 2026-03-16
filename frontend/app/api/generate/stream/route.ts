import { NextResponse } from 'next/server'
import { requireUserId, safeDb, DEV_APP_USER, isDatabaseConfigured } from '@/lib/safe-auth'
import { generateFallbackProject, sanitizeFiles } from '@/lib/ai-engine/fallback-generator'
import { validateAIOutput } from '@/lib/ai-output-validator'
import { generateWithFallback } from '@/lib/ai-engine/free-stack/free-router'
import { builderSystemPrompt, buildUserMessage, detectAppType, isLandingPageOnly } from '@/lib/ai-engine/agents/builder-agent'
import { parseFilesJson } from '@/lib/ai-engine/tool-adapters/base-adapter'
import { selectModel, routeAgent, isFreeStackModel, toFreeModelId, AGENT_MODEL_MAP } from '@/lib/ai-engine/model-router'
import { aiCache } from '@/lib/cache/ai-cache'
import { CREDIT_COSTS, PLAN_CREDITS } from '@/lib/credits'
import { generateAppPipeline } from '@/lib/ai/pipeline'
import type { ModelId, AgentType } from '@/lib/ai-engine/model-router'
import type { ProjectFiles } from '@/lib/ai-engine/tool-adapters/base-adapter'

export const maxDuration = 300

// SSE helper — encodes a JSON event line
function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

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
  } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: Record<string, unknown>) => {
        try { controller.enqueue(encoder.encode(sseEvent(data))) } catch { /* closed */ }
      }

      try {
        // ── Auth / credits ──────────────────────────────────────────────────
        emit({ type: 'progress', step: 'auth', message: 'Authenticating...' })

        let user = DEV_APP_USER
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sub: { plan: string; creditsRemaining: number; creditsTotal: number } = DEV_APP_USER.subscription as any

        if (isDatabaseConfigured()) {
          try {
            const { db } = await import('@/lib/db')
            let dbUser = await db.user.findUnique({
              where: { clerkId: userId },
              include: { subscription: true },
            })
            if (!dbUser) {
              const clerkMod = await import('@clerk/nextjs/server')
              const clerkUser = await clerkMod.currentUser()
              const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@buildforge.ai`
              const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || email
              dbUser = await db.user.create({
                data: {
                  clerkId: userId, email, name,
                  subscription: { create: { plan: 'free', creditsRemaining: PLAN_CREDITS.free, creditsTotal: PLAN_CREDITS.free } },
                },
                include: { subscription: true },
              })
            }
            if (dbUser.subscription) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              user = dbUser as any
              sub = { plan: dbUser.subscription.plan, creditsRemaining: dbUser.subscription.creditsRemaining, creditsTotal: dbUser.subscription.creditsTotal }
            }
            // Determine credit cost based on mode
            const creditCost = autonomousMode || startupMode
              ? CREDIT_COSTS.autonomousPipeline
              : startupMode
                ? CREDIT_COSTS.startupGenerator
                : CREDIT_COSTS.generateProject

            const isAdmin = dbUser.role === 'admin' || (process.env.ADMIN_USER_IDS ?? '').split(',').includes(userId)

            if (!isAdmin && sub.creditsRemaining < creditCost) {
              emit({ type: 'error', message: 'Insufficient credits' })
              controller.close(); return
            }

            if (!isAdmin) {
              await db.$transaction([
                db.subscription.update({ where: { userId: dbUser.id }, data: { creditsRemaining: { decrement: creditCost } } }),
                db.creditUsage.create({ data: { userId: dbUser.id, action: autonomousMode ? 'autonomousPipeline' : 'generateProject', creditsUsed: creditCost, metadata: { prompt: prompt.slice(0, 100), appType } } }),
              ])
            }
          } catch (dbErr) {
            console.error('[stream] DB error:', dbErr)
          }
        }

        // ── Planning ────────────────────────────────────────────────────────
        emit({ type: 'progress', step: 'planning', message: 'Planning architecture...' })
        emit({ type: 'thinking', agent: 'planner', message: 'Designing site architecture' })
        await new Promise(r => setTimeout(r, 120))

        const resolvedAppType = detectAppType(prompt) !== 'website' ? detectAppType(prompt) : appType
        const selectedModel = selectModel(sub.plan, modelId, localAIMode)
        const detectedAgent = forceAgent ?? routeAgent(prompt)

        emit({ type: 'progress', step: 'agent', message: `Selecting agent: ${detectedAgent}Agent` })
        emit({ type: 'thinking', agent: 'planner', message: `Routing to ${detectedAgent}Agent` })
        await new Promise(r => setTimeout(r, 80))

        // ── Cache lookup ────────────────────────────────────────────────────
        const isCacheable = !existingFiles && !autonomousMode && !startupMode
        if (isCacheable) {
          emit({ type: 'progress', step: 'cache', message: 'Checking AI cache...' })
          const cacheResult = await aiCache.lookup(prompt, resolvedAppType)
          if (cacheResult.hit) {
            const { entry, level, similarity } = cacheResult
            emit({ type: 'thinking', agent: 'cache', message: `Cache hit (L${level}, ${(similarity * 100).toFixed(0)}% match) — skipping generation` })
            for (const [filename, content] of Object.entries(entry.files)) {
              emit({ type: 'file_update', file: filename, content })
              await new Promise(r => setTimeout(r, 10))
            }
            emit({
              type: 'complete',
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
            controller.close()
            return
          }
          emit({ type: 'thinking', agent: 'cache', message: 'Cache miss — running AI agents' })
        }

        let files: ProjectFiles = {}
        let entrypoint = 'index.html'
        let description = ''
        let agent: AgentType = detectedAgent ?? 'builder'

        // ── Multi-stage pipeline for full apps ──────────────────────────────
        const usePipeline = !existingFiles && !autonomousMode && !startupMode && !isLandingPageOnly(prompt)

        if (usePipeline) {
          emit({ type: 'progress', step: 'blueprint', message: 'Analyzing your idea...' })
          emit({ type: 'thinking', agent: 'architect', message: 'Planning application architecture' })

          const pipelineResult = await generateAppPipeline(prompt, (stageId, status, message) => {
            if (status === 'active') {
              emit({ type: 'progress', step: stageId, message: message ?? `Running ${stageId}...` })
              emit({ type: 'thinking', agent: stageId, message: message ?? `Processing ${stageId}` })
            } else if (status === 'done') {
              emit({ type: 'progress', step: stageId, message: message ?? `${stageId} complete` })
            } else if (status === 'skipped') {
              emit({ type: 'progress', step: stageId, message: message ?? `${stageId} skipped` })
            }
          })

          files = pipelineResult.files
          entrypoint = pipelineResult.entrypoint
          description = pipelineResult.description
          agent = 'builder'
        } else if (isFreeStackModel(selectedModel) || localAIMode) {
          // ── Free/local model single-step ──────────────────────────────────
          emit({ type: 'progress', step: 'generating', message: 'Generating UI layout...' })
          emit({ type: 'thinking', agent: 'ui', message: 'Creating hero section and layout' })

          const freeModelId = toFreeModelId(selectedModel)
          const agentKey = (detectedAgent ?? 'builder') as keyof typeof AGENT_MODEL_MAP
          const assignedModel = AGENT_MODEL_MAP[agentKey] ?? freeModelId
          const system = builderSystemPrompt(resolvedAppType, existingFiles, prompt)
          const userMsg = buildUserMessage(prompt, resolvedAppType, existingFiles)

          emit({ type: 'progress', step: 'generating', message: `Generating with ${assignedModel}...` })

          const result = await generateWithFallback({
            agentType: detectedAgent ?? 'builder',
            system,
            prompt: userMsg,
            maxTokens: 12000,
            localAIOnly: localAIMode,
          })

          emit({ type: 'progress', step: 'parsing', message: 'Parsing generated files...' })
          const parsed = parseFilesJson(result.text)
          files = parsed.files
          entrypoint = parsed.entrypoint
          description = parsed.description ?? `Generated by ${result.modelUsed}`
          agent = detectedAgent ?? 'builder'
        } else {
          // ── Cloud model single-step ───────────────────────────────────────
          emit({ type: 'progress', step: 'generating', message: 'Generating UI layout...' })
          emit({ type: 'thinking', agent: 'ui', message: 'Creating hero section and layout' })
          emit({ type: 'progress', step: 'generating', message: `Running ${detectedAgent}Agent...` })
          const { runAgent } = await import('@/lib/ai-engine/orchestrator')
          const result = await runAgent({
            prompt, appType: resolvedAppType, modelId: selectedModel,
            existingFiles, forceAgent: detectedAgent,
          })
          files = result.files
          entrypoint = result.entrypoint
          description = result.description
          agent = result.agent
        }

        // ── Stream individual files as they're ready ─────────────────────
        emit({ type: 'progress', step: 'styling', message: 'Writing styles...' })
        emit({ type: 'thinking', agent: 'style', message: 'Applying Tailwind theme and responsive layout' })
        await new Promise(r => setTimeout(r, 60))

        // Send each file individually so UI can update incrementally
        for (const [filename, content] of Object.entries(files)) {
          emit({ type: 'file_update', file: filename, content })
          await new Promise(r => setTimeout(r, 20))
        }

        emit({ type: 'progress', step: 'scripts', message: 'Connecting scripts...' })
        emit({ type: 'thinking', agent: 'script', message: 'Wiring JavaScript interactions' })
        await new Promise(r => setTimeout(r, 60))

        // ── Validate ────────────────────────────────────────────────────────
        const validation = validateAIOutput(files, existingFiles)
        if (!validation.valid) {
          const fallback = generateFallbackProject(prompt, validation.errors.join('; '))
          files = fallback.files
          entrypoint = fallback.entrypoint
          description = fallback.description
          for (const [filename, content] of Object.entries(files)) {
            emit({ type: 'file_update', file: filename, content })
          }
        } else if (validation.sanitized) {
          files = validation.sanitized
        }

        // ── Store in cache ───────────────────────────────────────────────────
        if (isCacheable && Object.keys(files).length > 0) {
          aiCache.store(prompt, resolvedAppType, {
            files, entrypoint, description, agent, model: selectedModel,
          }).catch(err => console.warn('[stream] cache store error:', err))
        }

        // ── Persist ─────────────────────────────────────────────────────────
        emit({ type: 'progress', step: 'saving', message: 'Saving project...' })

        let resolvedProjectId = projectId ?? null
        let versionId = 'local'
        let versionNum = 1

        await safeDb(async () => {
          const { db } = await import('@/lib/db')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyDb = db as any
          if (!resolvedProjectId) {
            const project = await anyDb.project.create({
              data: { userId: user.id, name: prompt.slice(0, 60) || 'Untitled Project', appType: resolvedAppType },
            })
            resolvedProjectId = project.id
          }
          const lastVersion = await anyDb.version.findFirst({
            where: { projectId: resolvedProjectId }, orderBy: { versionNum: 'desc' },
          })
          versionNum = (lastVersion?.versionNum ?? 0) + 1
          const version = await anyDb.version.create({
            data: { projectId: resolvedProjectId, versionNum, prompt, files, model: selectedModel, agent, creditsUsed: autonomousMode ? CREDIT_COSTS.autonomousPipeline : CREDIT_COSTS.generateProject },
          })
          versionId = version.id
        })

        // ── Complete ────────────────────────────────────────────────────────
        emit({ type: 'progress', step: 'preview', message: 'Rendering preview...' })
        await new Promise(r => setTimeout(r, 80))

        emit({
          type: 'complete',
          files: sanitizeFiles(files),
          entrypoint,
          description,
          agent,
          model: selectedModel,
          projectId: resolvedProjectId,
          versionId,
          versionNum,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed'
        console.error('[stream] error:', message)
        const fallback = generateFallbackProject(prompt, message)
        for (const [filename, content] of Object.entries(fallback.files)) {
          emit({ type: 'file_update', file: filename, content })
        }
        emit({
          type: 'complete',
          files: sanitizeFiles(fallback.files),
          entrypoint: fallback.entrypoint,
          description: fallback.description,
          agent: 'builder',
          projectId: null,
          versionId: null,
          versionNum: 0,
          error: message,
        })
      } finally {
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
