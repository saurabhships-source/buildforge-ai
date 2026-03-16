import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// POST /api/hub/fork — records a fork event server-side (actual fork happens client-side via repoService)
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const body = await req.json()
  const { sourceId, sourceName } = body as { sourceId: string; sourceName: string }

  if (!sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 })

  // In a full DB implementation this would persist the fork relationship.
  // For now we return success so the client can proceed with localStorage fork.
  return NextResponse.json({
    success: true,
    message: `Forked ${sourceName ?? sourceId}`,
    forkedAt: new Date().toISOString(),
  })
}
