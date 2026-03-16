import { auth } from '@clerk/nextjs/server'
import { ok, err, parseBody } from '@/lib/core/api-helpers'
import { runCommandAgent } from '@/lib/services/ai/command-agent'
import { activityFeed } from '@/lib/services/activity-feed'

interface CommandRequest {
  command: string
  files: Record<string, string>
  projectId: string
  modelId?: string
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  const body = await parseBody<CommandRequest>(req)
  if (!body?.command?.trim()) return err('Missing command')
  if (!body?.projectId) return err('Missing projectId')
  if (!body?.files) return err('Missing files')

  const result = await runCommandAgent(body.command, body.files, body.projectId, body.modelId as never)

  activityFeed.push({
    type: 'improve',
    userId,
    userName: userId,
    projectId: body.projectId,
    projectName: body.projectId,
    description: result.description,
  })

  return ok(result)
}
