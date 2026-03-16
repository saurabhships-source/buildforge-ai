import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

// GET /api/projects/[id]/versions/[versionId] — restore a version's files
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { id, versionId } = await params
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const project = await db.project.findFirst({ where: { id, userId: user.id } })
  if (!project) return new NextResponse('Not found', { status: 404 })

  const version = await anyDb.version.findFirst({
    where: { id: versionId, projectId: id },
  })
  if (!version) return new NextResponse('Version not found', { status: 404 })

  return NextResponse.json(version)
}
