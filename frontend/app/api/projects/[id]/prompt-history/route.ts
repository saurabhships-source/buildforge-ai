import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'
import { z } from 'zod'

const createSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  resultSummary: z.string().optional(),
  versionId: z.string().optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) return NextResponse.json([])

  const { db } = await import('@/lib/db')
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any

  // Verify ownership
  const project = await anyDb.project.findFirst({ where: { id: params.id, userId: user.id } })
  if (!project) return new NextResponse('Not found', { status: 404 })

  const history = await anyDb.promptHistory.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(history)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) return NextResponse.json({ ok: true })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { db } = await import('@/lib/db')
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any

  const project = await anyDb.project.findFirst({ where: { id: params.id, userId: user.id } })
  if (!project) return new NextResponse('Not found', { status: 404 })

  const entry = await anyDb.promptHistory.create({
    data: {
      projectId: params.id,
      userId: user.id,
      prompt: parsed.data.prompt,
      model: parsed.data.model ?? 'gpt4o',
      resultSummary: parsed.data.resultSummary,
      versionId: parsed.data.versionId,
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
