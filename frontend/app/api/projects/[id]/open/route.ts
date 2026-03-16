import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) return NextResponse.json({ ok: true })

  const { db } = await import('@/lib/db')
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  // Verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any
  const project = await anyDb.project.findFirst({
    where: { id: params.id, userId: user.id },
  })
  if (!project) return new NextResponse('Not found', { status: 404 })

  await anyDb.recentProject.upsert({
    where: { userId_projectId: { userId: user.id, projectId: params.id } },
    update: { lastOpenedAt: new Date() },
    create: { userId: user.id, projectId: params.id },
  })

  return NextResponse.json({ ok: true })
}
