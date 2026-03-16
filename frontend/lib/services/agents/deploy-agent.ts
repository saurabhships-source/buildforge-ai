/**
 * Deploy Agent — deploys the project using the deployment engine and returns the live URL.
 * Fifth agent in the multi-agent pipeline.
 */

import { deployProject } from '@/lib/services/deploy/deployment-engine'
import { logger } from '@/lib/core/logger'

export interface DeployAgentResult {
  jobId: string
  deploymentUrl: string | null
  provider: string
  status: 'queued' | 'failed' | 'skipped'
}

export async function runDeployAgent(
  projectId: string,
  ownerId: string,
  projectName: string,
  files: Record<string, string>,
  provider: 'vercel' | 'netlify' = 'vercel',
  onProgress?: (msg: string) => void,
): Promise<DeployAgentResult> {
  const emit = (msg: string) => {
    onProgress?.(msg)
    logger.info('ai-pipeline', `[DeployAgent] ${msg}`)
  }

  emit(`Deploying to ${provider}...`)

  try {
    const result = await deployProject({
      projectId,
      ownerId,
      files,
      projectName,
      provider,
    })

    emit(`Deployment queued: job ${result.jobId}`)

    return {
      jobId: result.jobId,
      deploymentUrl: result.deploymentUrl ?? null,
      provider,
      status: 'queued',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('ai-pipeline', '[DeployAgent] Deployment failed', msg)
    emit(`Deployment failed: ${msg}`)
    return {
      jobId: '',
      deploymentUrl: null,
      provider,
      status: 'failed',
    }
  }
}
