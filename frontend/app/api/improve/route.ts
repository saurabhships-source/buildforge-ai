import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { improveCode, explainCode, debugCode } from '@/lib/services/ai/improve'
import { enforceCredits } from '@/lib/credits-server'
import type { ModelId } from '@/lib/ai-engine/model-router'

export const maxDuration = 60

// POST /api/improve — improve, explain, or debug a file
export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  const body = await req.json() as {
    action: 'improve' | 'explain' | 'debug'
    fileContent: string
    filePath?: string
    instruction?: string
    errorMessage?: string
    modelId?: ModelId
  }

  const { action, fileContent, filePath = 'file', instruction, errorMessage, modelId = 'gemini_flash' } = body

  if (!fileContent) return NextResponse.json({ error: 'fileContent required' }, { status: 400 })

  // Enforce credits server-side
  const creditError = await enforceCredits(userId, 'improveCode', { action, filePath }).catch(() => null)
  if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

  switch (action) {
    case 'improve': {
      if (!instruction) return NextResponse.json({ error: 'instruction required' }, { status: 400 })
      const result = await improveCode(fileContent, instruction, filePath, modelId)
      return NextResponse.json(result)
    }
    case 'explain': {
      const explanation = await explainCode(fileContent, filePath, modelId)
      return NextResponse.json({ explanation })
    }
    case 'debug': {
      if (!errorMessage) return NextResponse.json({ error: 'errorMessage required' }, { status: 400 })
      const result = await debugCode(errorMessage, fileContent, modelId)
      return NextResponse.json(result)
    }
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}
