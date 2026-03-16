import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'
import { db } from '@/lib/db'
import { runAutonomousPipeline, runStartupGenerator } from '@/lib/ai-engine/orchestrator'
import { selectModel } from '@/lib/ai-engine/model-router'
import { encodeSSE, encodeSSEDone } from '@/lib/job-queue'
import type { ModelId } from '@/lib/ai-engine/model-router'

export const maxDuration = 300

// GET /api/jobs/stream?prompt=...&appType=...&mode=autonomous|startup
// Returns Server-Sent Events with real-time pipeline progress
export async function GET(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })
  if (!user?.subscription) return new NextResponse('User not found', { status: 404 })

  const { searchParams } = new URL(req.url)
  const prompt = searchParams.get('prompt') ?? ''
  const appType = searchParams.get('appType') ?? 'website'
  const mode = searchParams.get('mode') ?? 'autonomous'
  const modelId = (searchParams.get('modelId') ?? 'gemini_flash') as ModelId
  const localMode = searchParams.get('localMode') === 'true'

  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

  const selectedModel = selectModel(user.subscription.plan, modelId, localMode)

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(new TextEncoder().encode(encodeSSE(data as Parameters<typeof encodeSSE>[0])))
      }

      try {
        if (mode === 'startup') {
          send({ jobId: 'startup', step: 'startup', status: 'running', message: 'Generating startup stack...', percent: 10 })
          const result = await runStartupGenerator({ prompt, modelId: selectedModel })
          send({ jobId: 'startup', step: 'startup', status: 'completed', message: result.description, percent: 100, files: result.files, entrypoint: result.entrypoint })
        } else {
          // Autonomous pipeline with per-step SSE updates
          let percent = 0
          const stepCount = 9
          await runAutonomousPipeline({
            prompt,
            appType,
            modelId: selectedModel,
            onStepUpdate: (step) => {
              if (step.status === 'running') percent = Math.min(90, percent + Math.floor(90 / stepCount))
              if (step.status === 'completed') percent = Math.min(95, percent + 2)
              send({
                jobId: 'pipeline',
                step: step.agent,
                agent: step.agent,
                status: step.status,
                message: step.description || `${step.agent}Agent ${step.status}`,
                percent,
                changes: step.changes,
                durationMs: step.durationMs,
              })
            },
          }).then(result => {
            send({ jobId: 'pipeline', step: 'done', status: 'completed', message: 'Pipeline complete', percent: 100, files: result.files, entrypoint: result.entrypoint, steps: result.steps })
          })
        }
      } catch (err) {
        send({ jobId: 'error', step: 'error', status: 'failed', message: err instanceof Error ? err.message : 'Failed', percent: 0 })
      } finally {
        controller.enqueue(new TextEncoder().encode(encodeSSEDone()))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
