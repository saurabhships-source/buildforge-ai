import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { analyzeCodebase } from '@/lib/ai-engine/orchestrator'

// POST /api/github/analyze — analyze project files and return codebase intelligence
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { files } = await req.json() as { files: Record<string, string> }
  if (!files || typeof files !== 'object') {
    return NextResponse.json({ error: 'files object required' }, { status: 400 })
  }

  const analysis = analyzeCodebase(files)
  return NextResponse.json({ analysis })
}
