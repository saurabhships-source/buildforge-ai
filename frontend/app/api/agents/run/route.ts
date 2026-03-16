/**
 * POST /api/agents/run
 * Triggers the full multi-agent pipeline: brain → architect → builder → repair → deploy
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runAgentCoordinator } from '@/lib/services/agents/agent-coordinator'
import type { ModelId } from '@/lib/ai-engine/model-router'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const body = await req.json()
    const { prompt, deploy = false, deployProvider = 'vercel', modelId = 'gemini_flash' } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    const result = await runAgentCoordinator(prompt.trim(), {
      ownerId: userId ?? 'anonymous',
      modelId: modelId as ModelId,
      deploy,
      deployProvider,
    })

    if (result.needsClarification) {
      return NextResponse.json({
        needsClarification: true,
        clarificationQuestions: result.clarificationQuestions,
      }, { status: 200 })
    }

    return NextResponse.json({
      projectId: result.projectId,
      previewUrl: result.previewUrl,
      deploymentUrl: result.deploymentUrl,
      deployJobId: result.deployJobId,
      fileCount: result.fileCount,
      qualityScore: result.qualityScore,
      qualityGrade: result.qualityGrade,
      agentLog: result.agentLog,
      needsClarification: false,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Agent pipeline failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
