import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { runAutonomousPipeline } from '@/lib/ai-engine/orchestrator'
import { selectModel } from '@/lib/ai-engine/model-router'

export const maxDuration = 300

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

// POST /api/github/improve — run autonomous pipeline on existing project files
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })
  if (!user?.subscription) return new NextResponse('User not found', { status: 404 })

  const sub = user.subscription
  if (sub.creditsRemaining < 9) {
    return NextResponse.json({ error: 'Need at least 9 credits for full improvement pipeline' }, { status: 402 })
  }

  const { files, projectId, appType = 'website', instructions } = await req.json() as {
    files: Record<string, string>
    projectId?: string
    appType?: string
    instructions?: string
  }

  if (!files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: 'files required' }, { status: 400 })
  }

  await db.subscription.update({
    where: { userId: user.id },
    data: { creditsRemaining: { decrement: 9 } },
  })

  try {
    const selectedModel = selectModel(sub.plan)
    const pipeline = await runAutonomousPipeline({
      prompt: instructions ?? 'Improve this project: fix bugs, improve UI/UX, add SEO, and prepare for deployment',
      appType,
      modelId: selectedModel,
      existingFiles: files,
    })

    // Save new version if projectId provided
    if (projectId) {
      const lastVersion = await anyDb.version.findFirst({
        where: { projectId },
        orderBy: { versionNum: 'desc' },
      })
      await anyDb.version.create({
        data: {
          projectId,
          versionNum: (lastVersion?.versionNum ?? 0) + 1,
          prompt: instructions ?? 'Autonomous improvement pipeline',
          files: pipeline.files,
          model: selectedModel,
          agent: 'builder',
          creditsUsed: 9,
        },
      })
    }

    return NextResponse.json({
      files: pipeline.files,
      entrypoint: pipeline.entrypoint,
      steps: pipeline.steps,
    })
  } catch (err) {
    await db.subscription.update({
      where: { userId: user.id },
      data: { creditsRemaining: { increment: 9 } },
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Improvement failed' },
      { status: 500 }
    )
  }
}
