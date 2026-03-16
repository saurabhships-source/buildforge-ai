import { auth } from '@clerk/nextjs/server'
import { ok, err, parseBody } from '@/lib/core/api-helpers'
import { repoService } from '@/lib/hub/repo-service'
import { activityFeed } from '@/lib/services/activity-feed'
import { logger } from '@/lib/core/logger'

interface RemixRequest {
  projectId: string
  newName?: string
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  const body = await parseBody<RemixRequest>(req)
  if (!body?.projectId) return err('Missing projectId')

  const source = repoService.loadRepo(body.projectId)
  if (!source) return err('Project not found', 404)

  try {
    const remixed = repoService.forkRepo(body.projectId, {
      ownerId: userId,
      ownerName: userId,
      newName: body.newName ?? `${source.name} (Remix)`,
    })

    if (!remixed) return err('Remix failed', 500)

    activityFeed.push({
      type: 'remix',
      userId,
      userName: userId,
      projectId: remixed.id,
      projectName: remixed.name,
      description: `Remixed from ${source.name}`,
      meta: { sourceId: source.id },
    })

    logger.info('system', `Remixed ${source.id} → ${remixed.id}`)
    return ok({ projectId: remixed.id, name: remixed.name, files: remixed.files })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Remix failed', 500)
  }
}
