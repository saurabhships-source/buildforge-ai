import { NextResponse } from 'next/server'
import { safeGetUserId } from '@/lib/safe-auth'
import { repoService } from '@/lib/hub/repo-service'
import { processCommand } from '@/lib/services/ai/command'

// POST /api/hub/remix — clone a project and optionally transform it with AI
export async function POST(req: Request) {
  const userId = await safeGetUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { sourceId, sourceName, transformPrompt } = body as {
    sourceId: string
    sourceName: string
    transformPrompt?: string
  }
  if (!sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 })

  // Clone the project client-side via repoService — server records the event
  // If a transformPrompt is provided, apply AI transformation to the files
  let transformedFiles: Record<string, string> | undefined

  if (transformPrompt) {
    const source = repoService.loadRepo(sourceId)
    if (source && Object.keys(source.files).length > 0) {
      try {
        const result = await processCommand(transformPrompt, source.files)
        const merged = { ...source.files, ...result.updatedFiles, ...result.newFiles }
        transformedFiles = merged
      } catch (err) {
        console.warn('[remix] AI transform failed:', err)
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `Remixed ${sourceName ?? sourceId}`,
    remixedAt: new Date().toISOString(),
    transformedFiles,
  })
}
