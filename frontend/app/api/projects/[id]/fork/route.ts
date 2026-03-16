import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { id } = await params
  const { db } = await import('@/lib/db')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const source = await anyDb.project.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { versionNum: 'desc' }, take: 1 },
    },
  })
  if (!source) return new NextResponse('Project not found', { status: 404 })

  const latestVersion = source.versions[0]

  const forked = await anyDb.project.create({
    data: {
      userId: user.id,
      name: `${source.name} (Fork)`,
      description: source.description,
      appType: source.appType,
      framework: source.framework,
    },
  })

  if (latestVersion) {
    await anyDb.version.create({
      data: {
        projectId: forked.id,
        versionNum: 1,
        prompt: latestVersion.prompt,
        files: latestVersion.files,
        model: latestVersion.model,
        agent: latestVersion.agent,
        creditsUsed: 0,
      },
    })
  }

  return NextResponse.json({ projectId: forked.id, name: forked.name }, { status: 201 })
}
