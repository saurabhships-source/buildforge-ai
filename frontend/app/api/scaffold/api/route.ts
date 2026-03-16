import { NextRequest, NextResponse } from 'next/server'
import { buildApi } from '@/lib/services/ai/api-builder'
import type { ModelId } from '@/lib/ai-engine/model-router'

export async function POST(req: NextRequest) {
  try {
    const { prompt, modelId } = await req.json() as { prompt: string; modelId?: ModelId }
    if (!prompt?.trim()) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const result = await buildApi(prompt, modelId ?? 'gemini_flash')
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/scaffold/api]', err)
    return NextResponse.json({ error: 'API generation failed' }, { status: 500 })
  }
}
