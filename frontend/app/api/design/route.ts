import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { designUI } from '@/lib/services/ai/ui-designer'
import { enforceCredits } from '@/lib/credits-server'
import type { ModelId } from '@/lib/ai-engine/model-router'

export async function POST(req: NextRequest) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  try {
    const { files, instruction, modelId } = await req.json() as {
      files: Record<string, string>
      instruction: string
      modelId?: ModelId
    }
    if (!instruction?.trim()) return NextResponse.json({ error: 'instruction required' }, { status: 400 })
    if (!files || Object.keys(files).length === 0) return NextResponse.json({ error: 'files required' }, { status: 400 })

    const creditError = await enforceCredits(userId, 'designUI', { route: '/api/design' })
    if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

    const result = await designUI(files, instruction, modelId ?? 'gemini_flash')
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/design]', err)
    return NextResponse.json({ error: 'UI design failed' }, { status: 500 })
  }
}
