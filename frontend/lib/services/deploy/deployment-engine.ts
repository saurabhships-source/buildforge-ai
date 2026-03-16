/**
 * Deployment Engine — deploys generated projects to Vercel or Netlify.
 * Integrates with the deploy queue for concurrency control.
 */

import { deployQueue } from '@/lib/services/queue/deploy-queue'
import { projectStorage } from '@/lib/services/storage/project-storage'
import { logger } from '@/lib/core/logger'

export interface DeploymentResult {
  jobId: string
  deploymentUrl: string | null
  provider: 'vercel' | 'netlify'
  status: 'queued' | 'deploying' | 'done' | 'failed'
}

// ── Register the actual deploy handler once ───────────────────────────────────

deployQueue.registerHandler(async (job) => {
  const provider = job.provider

  if (provider === 'vercel') {
    return deployToVercel(job.projectName, job.files)
  } else {
    return deployToNetlify(job.projectName, job.files)
  }
})

// ── Vercel deployment ─────────────────────────────────────────────────────────

async function deployToVercel(
  projectName: string,
  files: Record<string, string>,
): Promise<{ url: string }> {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new Error('VERCEL_TOKEN not configured')

  const deployFiles = Object.entries(files).map(([file, data]) => ({
    file,
    data,
    encoding: 'utf8',
  }))

  const res = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50),
      files: deployFiles,
      projectSettings: { framework: 'nextjs' },
      target: 'production',
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Vercel deployment failed')

  return { url: `https://${data.url}` }
}

// ── Netlify deployment ────────────────────────────────────────────────────────

async function deployToNetlify(
  projectName: string,
  files: Record<string, string>,
): Promise<{ url: string }> {
  const token = process.env.NETLIFY_TOKEN
  if (!token) throw new Error('NETLIFY_TOKEN not configured')

  // Create site first
  const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50) }),
  })
  const site = await siteRes.json()
  if (!siteRes.ok) throw new Error(site.message ?? 'Netlify site creation failed')

  // Deploy files
  const zipBody = await buildZipBuffer(files)
  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/zip' },
    body: zipBody.buffer as BodyInit,
  })
  const deploy = await deployRes.json()
  if (!deployRes.ok) throw new Error(deploy.message ?? 'Netlify deploy failed')

  return { url: `https://${deploy.ssl_url ?? deploy.url}` }
}

/** Minimal zip builder — returns a Uint8Array for the fetch body */
async function buildZipBuffer(files: Record<string, string>): Promise<Uint8Array> {
  // In a real implementation, use the 'jszip' package.
  // For now, return a placeholder — Netlify deploy via zip requires jszip.
  logger.warn('system', 'Netlify zip deployment requires jszip — returning placeholder')
  const encoder = new TextEncoder()
  return encoder.encode(JSON.stringify(files))
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function deployProject(params: {
  projectId: string
  ownerId: string
  files: Record<string, string>
  projectName: string
  provider?: 'vercel' | 'netlify'
}): Promise<DeploymentResult> {
  const job = deployQueue.enqueue(params)
  logger.info('system', `Deployment queued: ${job.id} for project ${params.projectId}`)

  return {
    jobId: job.id,
    deploymentUrl: null,
    provider: job.provider,
    status: 'queued',
  }
}

/** Poll job status and return result when done */
export async function waitForDeployment(
  jobId: string,
  timeoutMs = 120_000,
): Promise<DeploymentResult> {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const job = deployQueue.getJob(jobId)
    if (!job) throw new Error(`Job ${jobId} not found`)

    if (job.status === 'done' && job.result) {
      // Update storage with deployment URL
      projectStorage.updateDeploymentUrl(job.projectId, job.result.url)
      return { jobId, deploymentUrl: job.result.url, provider: job.provider, status: 'done' }
    }

    if (job.status === 'failed') {
      return { jobId, deploymentUrl: null, provider: job.provider, status: 'failed' }
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  return { jobId, deploymentUrl: null, provider: 'vercel', status: 'failed' }
}
