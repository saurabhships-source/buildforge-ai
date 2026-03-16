import { NextRequest, NextResponse } from 'next/server'
import { generateAuth } from '@/lib/services/ai/auth'
import type { ModelId } from '@/lib/ai-engine/model-router'

export async function POST(req: NextRequest) {
  try {
    const { prompt, projectName, modelId } = await req.json() as {
      prompt: string
      projectName?: string
      modelId?: ModelId
    }
    if (!prompt?.trim()) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const result = await generateAuth(prompt, projectName ?? 'Project', modelId ?? 'gemini_flash')
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/scaffold/auth]', err)
    return NextResponse.json({ error: 'Auth generation failed' }, { status: 500 })
  }
}
