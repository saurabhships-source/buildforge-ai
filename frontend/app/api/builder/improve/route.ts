import { auth } from '@clerk/nextjs/server'
import { ok, err, parseBody } from '@/lib/core/api-helpers'
import { runImproveAgent } from '@/lib/services/ai/improve-agent'
import { activityFeed } from '@/lib/services/activity-feed'

interface ImproveRequest {
  files: Record<string, string>
  projectId: string
  modelId?: string
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  const body = await parseBody<ImproveRequest>(req)
  if (!body?.projectId) return err('Missing projectId')
  if (!body?.files) return err('Missing files')

  const result = await runImproveAgent(body.files, body.projectId, body.modelId as never)

  activityFeed.push({
    type: 'improve',
    userId,
    userName: userId,
    projectId: body.projectId,
    projectName: body.projectId,
    description: `Improved ${result.filesImproved} file(s)`,
  })

  return ok(result)
}
