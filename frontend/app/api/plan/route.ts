import { NextRequest, NextResponse } from 'next/server'
import { generateProjectPlan } from '@/lib/services/ai/planner'
import type { ModelId } from '@/lib/ai-engine/model-router'

export async function POST(req: NextRequest) {
  try {
    const { prompt, modelId } = await req.json() as { prompt: string; modelId?: ModelId }
    if (!prompt?.trim()) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const plan = await generateProjectPlan(prompt, modelId ?? 'gemini_flash')
    return NextResponse.json({ plan })
  } catch (err) {
    console.error('[/api/plan]', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
