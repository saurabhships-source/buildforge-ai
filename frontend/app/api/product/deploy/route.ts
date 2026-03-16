import { auth } from '@clerk/nextjs/server'
import { ok, err, parseBody } from '@/lib/core/api-helpers'
import { deployProject, waitForDeployment } from '@/lib/services/deploy/deployment-engine'
import { deployQueue } from '@/lib/services/queue/deploy-queue'
import { projectStorage } from '@/lib/services/storage/project-storage'
import { logger } from '@/lib/core/logger'

interface DeployRequest {
  projectId: string
  provider?: 'vercel' | 'netlify'
  wait?: boolean
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  const body = await parseBody<DeployRequest>(req)
  if (!body?.projectId) return err('Missing required field: projectId')

  const project = projectStorage.get(body.projectId)
  if (!project) return err('Project not found', 404)
  if (project.ownerId !== userId) return err('Forbidden', 403)

  try {
    const deployment = await deployProject({
      projectId: body.projectId,
      ownerId: userId,
      files: project.files,
      projectName: project.name,
      provider: body.provider ?? 'vercel',
    })

    if (body.wait) {
      const result = await waitForDeployment(deployment.jobId, 120_000)
      return ok(result)
    }

    return ok(deployment)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Deployment failed'
    logger.error('api', 'Deploy error', msg)
    return err(msg, 500)
  }
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (jobId) {
    const job = deployQueue.getJob(jobId)
    if (!job) return err('Job not found', 404)
    return ok(job)
  }

  return ok(deployQueue.stats())
}
