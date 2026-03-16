import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// POST /api/hub/replay — validates a replay request and returns the build run id
// Actual replay (restoring snapshots) happens client-side via the timeline system.
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const body = await req.json()
  const { buildRunId, stepId } = body as { buildRunId: string; stepId?: string }

  if (!buildRunId) return NextResponse.json({ error: 'buildRunId required' }, { status: 400 })

  return NextResponse.json({
    success: true,
    buildRunId,
    stepId: stepId ?? null,
    message: 'Replay authorized — restore snapshot client-side',
  })
}
