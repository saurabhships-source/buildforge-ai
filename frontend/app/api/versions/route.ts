// Version history is stored client-side via versionControl service.
// This route handles server-side version operations when a DB projectId exists.
import { NextRequest, NextResponse } from 'next/server'
import { safeDb, isDatabaseConfigured } from '@/lib/safe-auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ versions: [], source: 'client-only' })
  }

  const versions = await safeDb(async () => {
    const { db } = await import('@/lib/db')
    return db.version.findMany({
      where: { projectId },
      orderBy: { versionNum: 'desc' },
      take: 50,
      select: { id: true, versionNum: true, prompt: true, agent: true, createdAt: true },
    })
  })

  return NextResponse.json({ versions: versions ?? [], source: versions ? 'db' : 'client-only' })
}
