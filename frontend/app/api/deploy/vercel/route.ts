import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'
import { z } from 'zod'
import { enforceCredits } from '@/lib/credits-server'

const schema = z.object({
  projectId: z.string(),
  files: z.record(z.string()),
  projectName: z.string().min(1).max(100),
})

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { db } = await import('@/lib/db')

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const vercelToken = process.env.VERCEL_TOKEN
  if (!vercelToken) {
    return NextResponse.json({ error: 'Vercel token not configured' }, { status: 500 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { projectId, files, projectName } = parsed.data

  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
  })
  if (!project) return new NextResponse('Project not found', { status: 404 })

  // Enforce credits
  const creditError = await enforceCredits(userId, 'deployProject', { projectId, provider: 'vercel' })
  if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

  try {
    // Build Vercel deployment payload
    const deployFiles = Object.entries(files).map(([file, content]) => ({
      file,
      data: content,
      encoding: 'utf8',
    }))

    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        files: deployFiles,
        projectSettings: { framework: null },
        target: 'production',
      }),
    })

    const deployData = await deployRes.json()
    if (!deployRes.ok) {
      throw new Error(deployData.error?.message ?? 'Vercel deployment failed')
    }

    const deployUrl = `https://${deployData.url}`

    // Save deploy URL
    await db.project.update({
      where: { id: projectId },
      data: { deployUrl },
    })

    return NextResponse.json({
      url: deployUrl,
      deploymentId: deployData.id,
      provider: 'vercel',
    })
  } catch (err) {
    console.error('Vercel deploy error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Deployment failed' },
      { status: 500 }
    )
  }
}
