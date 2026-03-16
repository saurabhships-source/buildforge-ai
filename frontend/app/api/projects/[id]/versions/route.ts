import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

// GET /api/projects/[id]/versions
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const project = await db.project.findFirst({ where: { id, userId: user.id } })
  if (!project) return new NextResponse('Not found', { status: 404 })

  const versions = await anyDb.version.findMany({
    where: { projectId: id },
    orderBy: { versionNum: 'desc' },
    select: {
      id: true,
      versionNum: true,
      prompt: true,
      agent: true,
      model: true,
      creditsUsed: true,
      createdAt: true,
    },
  })

  return NextResponse.json(versions)
}
