import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const SUPPORTED = ['stripe', 'supabase', 'openai', 'sendgrid', 'slack'] as const
type IntegrationName = typeof SUPPORTED[number]

const toggleSchema = z.object({
  projectId: z.string(),
  name: z.enum(SUPPORTED),
  enabled: z.boolean(),
  config: z.record(z.string()).optional(),
})

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const integrations = await db.integration.findMany({
    where: { projectId, userId: user.id },
  })

  return NextResponse.json(integrations)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const body = await req.json()
  const parsed = toggleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { projectId, name, enabled, config } = parsed.data

  const integration = await db.integration.upsert({
    where: { projectId_name: { projectId, name } },
    update: { enabled, config: config ?? {} },
    create: {
      userId: user.id,
      projectId,
      name,
      enabled,
      config: config ?? {},
    },
  })

  return NextResponse.json(integration)
}
