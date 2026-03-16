import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured, DEV_APP_USER } from '@/lib/safe-auth'
import { z } from 'zod'

const APP_TYPES = ['website', 'tool', 'saas', 'dashboard', 'ai_app', 'crm', 'internal_tool'] as const

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  appType: z.enum(APP_TYPES),
})

export async function GET() {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) return NextResponse.json([])

  const { db } = await import('@/lib/db')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json([])

  try {
    const projects = await anyDb.project.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { versions: true } },
        versions: {
          orderBy: { versionNum: 'desc' },
          take: 1,
          select: { versionNum: true, createdAt: true, prompt: true, agent: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  if (!isDatabaseConfigured()) {
    // Dev mode — return a mock project
    return NextResponse.json({
      id: `dev_${Date.now()}`,
      userId: DEV_APP_USER.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      appType: parsed.data.appType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [],
      _count: { versions: 0 },
    }, { status: 201 })
  }

  const { db } = await import('@/lib/db')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any

  let user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    // Auto-provision user
    try {
      const { currentUser } = await import('@clerk/nextjs/server')
      const clerkUser = await currentUser()
      const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@buildforge.ai`
      const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || email
      user = await db.user.create({
        data: { clerkId: userId, email, name, subscription: { create: { plan: 'free', creditsRemaining: 50, creditsTotal: 50 } } },
        include: { subscription: true },
      })
    } catch {
      return new NextResponse('User not found', { status: 404 })
    }
  }

  const project = await anyDb.project.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      appType: parsed.data.appType,
    },
    include: {
      _count: { select: { versions: true } },
      versions: { take: 1, orderBy: { versionNum: 'desc' as const } },
    },
  })

  return NextResponse.json(project, { status: 201 })
}
