import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { processCommand, getCommandSuggestions } from '@/lib/services/ai/command'
import type { ModelId } from '@/lib/ai-engine/model-router'

export const maxDuration = 60

// POST /api/command — process a natural language command against project files
export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse

  const body = await req.json() as {
    command: string
    files: Record<string, string>
    modelId?: ModelId
  }

  const { command, files, modelId = 'gemini_flash' } = body
  if (!command?.trim()) return NextResponse.json({ error: 'command required' }, { status: 400 })
  if (!files || Object.keys(files).length === 0) return NextResponse.json({ error: 'files required' }, { status: 400 })

  const result = await processCommand(command, files, modelId)
  return NextResponse.json(result)
}

// GET /api/command?files=... — get command suggestions
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filesParam = searchParams.get('hasFiles')
  const mockFiles = filesParam ? { 'index.html': '' } : {}
  const suggestions = getCommandSuggestions(mockFiles)
  return NextResponse.json({ suggestions })
}
