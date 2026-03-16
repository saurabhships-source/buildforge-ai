import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'

export async function GET() {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) return NextResponse.json([])

  const { db } = await import('@/lib/db')
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any
  const recents = await anyDb.recentProject.findMany({
    where: { userId: user.id },
    orderBy: { lastOpenedAt: 'desc' },
    take: 10,
    include: {
      project: {
        include: { _count: { select: { versions: true } } },
      },
    },
  })

  return NextResponse.json(
    recents
      .filter((r: { project: unknown }) => r.project !== null)
      .map((r: { lastOpenedAt: string; project: { id: string; name: string; appType: string; updatedAt: string; _count: { versions: number } } }) => ({
        ...r.project,
        lastOpenedAt: r.lastOpenedAt,
      }))
  )
}
