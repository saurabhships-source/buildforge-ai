import { NextResponse } from 'next/server'
import { safeGetUserId } from '@/lib/safe-auth'

// POST /api/apps/[projectId]/like — toggle like
export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const userId = await safeGetUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  // In production: toggle like in DB, return new count
  return NextResponse.json({ success: true, projectId, userId, action: 'like_toggled' })
}
