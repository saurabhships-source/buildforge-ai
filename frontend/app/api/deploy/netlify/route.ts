import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'
import { z } from 'zod'

const schema = z.object({
  projectId: z.string(),
  files: z.record(z.string()),
  siteName: z.string().min(1).max(100),
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

  const netlifyToken = process.env.NETLIFY_TOKEN
  if (!netlifyToken) {
    return NextResponse.json({ error: 'Netlify token not configured' }, { status: 500 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { projectId, files, siteName } = parsed.data

  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
  })
  if (!project) return new NextResponse('Project not found', { status: 404 })

  try {
    // 1. Create site
    const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      }),
    })
    const site = await siteRes.json()
    if (!siteRes.ok) throw new Error(site.message ?? 'Failed to create Netlify site')

    // 2. Build file digest map for deploy
    const fileDigests: Record<string, string> = {}
    const encoder = new TextEncoder()
    for (const [path, content] of Object.entries(files)) {
      const data = encoder.encode(content)
      const hashBuffer = await crypto.subtle.digest('SHA-1', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      fileDigests[`/${path}`] = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // 3. Create deploy
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: fileDigests }),
    })
    const deploy = await deployRes.json()
    if (!deployRes.ok) throw new Error(deploy.message ?? 'Failed to create deploy')

    // 4. Upload required files
    for (const filePath of deploy.required ?? []) {
      const cleanPath = filePath.replace(/^\//, '')
      const content = files[cleanPath]
      if (!content) continue

      await fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}/files${filePath}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: content,
      })
    }

    const deployUrl = `https://${site.subdomain}.netlify.app`

    await db.project.update({
      where: { id: projectId },
      data: { deployUrl },
    })

    return NextResponse.json({
      url: deployUrl,
      siteId: site.id,
      deployId: deploy.id,
      provider: 'netlify',
    })
  } catch (err) {
    console.error('Netlify deploy error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Deployment failed' },
      { status: 500 }
    )
  }
}
