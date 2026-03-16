import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) return new NextResponse('Not found', { status: 404 })

  const { id } = await params
  const { db } = await import('@/lib/db')

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: {
      versions: { orderBy: { versionNum: 'desc' } },
    },
  })

  if (!project) return new NextResponse('Not found', { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) return new NextResponse('Not found', { status: 404 })

  const { id } = await params
  const { db } = await import('@/lib/db')

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const project = await db.project.findFirst({ where: { id, userId: user.id } })
  if (!project) return new NextResponse('Not found', { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await db.project.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) return new NextResponse(null, { status: 204 })

  const { id } = await params
  const { db } = await import('@/lib/db')

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const project = await db.project.findFirst({ where: { id, userId: user.id } })
  if (!project) return new NextResponse('Not found', { status: 404 })

  await db.project.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
