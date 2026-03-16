import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'
import { runAutonomousPipeline } from '@/lib/ai-engine/orchestrator'
import { selectModel } from '@/lib/ai-engine/model-router'
import { enforceCredits } from '@/lib/credits-server'
import { CREDIT_COSTS } from '@/lib/credits'

export const maxDuration = 300

async function fetchGitHubTree(owner: string, repo: string, token: string) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers }
  )
  if (!treeRes.ok) throw new Error(`GitHub API error: ${treeRes.statusText}`)
  const tree = await treeRes.json()
  return tree.tree as { path: string; type: string; url: string }[]
}

async function fetchFileContent(url: string, token: string): Promise<string> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) return ''
  const data = await res.json()
  if (data.encoding === 'base64') return Buffer.from(data.content, 'base64').toString('utf-8')
  return data.content ?? ''
}

const ALLOWED_EXTENSIONS = ['.html', '.css', '.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.toml', '.yaml', '.yml']
const MAX_FILES = 30
const MAX_FILE_SIZE = 50_000

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { db } = await import('@/lib/db')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any

  const body = await req.json() as { repoUrl: string; githubToken?: string }
  const { repoUrl, githubToken } = body

  if (!repoUrl) return NextResponse.json({ error: 'repoUrl is required' }, { status: 400 })

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const creditError = await enforceCredits(userId, 'autonomousPipeline', { route: '/api/github/import', repoUrl })
  if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

  const [, owner, repo] = match
  const token = githubToken ?? (user as { githubToken?: string | null }).githubToken ?? ''
  const selectedModel = selectModel(user.subscription?.plan ?? 'free')

  try {
    const tree = await fetchGitHubTree(owner, repo.replace(/\.git$/, ''), token)
    const blobs = tree
      .filter(f => f.type === 'blob' && ALLOWED_EXTENSIONS.some(ext => f.path.endsWith(ext)))
      .slice(0, MAX_FILES)

    const entries = await Promise.all(
      blobs.map(async f => {
        const content = await fetchFileContent(f.url, token)
        return [f.path, content.slice(0, MAX_FILE_SIZE)] as [string, string]
      })
    )
    const importedFiles = Object.fromEntries(entries.filter(([, v]) => v.length > 0))

    const pipeline = await runAutonomousPipeline({
      prompt: `Improve this imported GitHub repository: ${owner}/${repo}`,
      appType: 'website',
      modelId: selectedModel,
      existingFiles: importedFiles,
    })

    const project = await anyDb.project.create({
      data: {
        userId: user.id,
        name: `${owner}/${repo}`,
        appType: 'website',
        githubRepo: repoUrl,
      },
    })

    await anyDb.version.create({
      data: {
        projectId: project.id,
        versionNum: 1,
        prompt: `Imported from ${repoUrl}`,
        files: pipeline.files,
        model: selectedModel,
        agent: 'builder',
        creditsUsed: CREDIT_COSTS.autonomousPipeline,
      },
    })

    return NextResponse.json({
      projectId: project.id,
      files: pipeline.files,
      entrypoint: pipeline.entrypoint,
      pipelineSteps: pipeline.steps,
      importedFileCount: Object.keys(importedFiles).length,
    })
  } catch (err) {
    // Refund credits on failure
    await db.subscription.update({
      where: { userId: user.id },
      data: { creditsRemaining: { increment: CREDIT_COSTS.autonomousPipeline } },
    }).catch(() => {})
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    )
  }
}
