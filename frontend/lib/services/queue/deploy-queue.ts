/**
 * Deploy Queue — in-process job queue for deployments.
 * Limits concurrent deployments, retries failures, schedules builds.
 * Uses an in-memory queue (Redis-compatible interface for easy swap).
 */

import { logger } from '@/lib/core/logger'

export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'retrying'

export interface DeployJob {
  id: string
  projectId: string
  ownerId: string
  files: Record<string, string>
  projectName: string
  provider: 'vercel' | 'netlify'
  status: JobStatus
  attempts: number
  maxAttempts: number
  result: { url: string } | null
  error: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export type JobHandler = (job: DeployJob) => Promise<{ url: string }>

// ── Queue config ──────────────────────────────────────────────────────────────

const MAX_CONCURRENT = 5
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 2000

// ── In-memory queue ───────────────────────────────────────────────────────────

const queue: DeployJob[] = []
const running = new Set<string>()
let handler: JobHandler | null = null

function nextId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

async function processNext(): Promise<void> {
  if (running.size >= MAX_CONCURRENT) return

  const job = queue.find(j => j.status === 'pending' || j.status === 'retrying')
  if (!job) return

  running.add(job.id)
  job.status = 'running'
  job.startedAt = new Date().toISOString()
  job.attempts++

  logger.info('system', `Deploy job ${job.id} started (attempt ${job.attempts})`, job.projectName)

  try {
    if (!handler) throw new Error('No job handler registered')
    const result = await handler(job)
    job.status = 'done'
    job.result = result
    job.completedAt = new Date().toISOString()
    logger.info('system', `Deploy job ${job.id} completed`, result.url)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    job.error = msg
    logger.error('system', `Deploy job ${job.id} failed (attempt ${job.attempts})`, msg)

    if (job.attempts < job.maxAttempts) {
      job.status = 'retrying'
      setTimeout(() => processNext(), RETRY_DELAY_MS * job.attempts)
    } else {
      job.status = 'failed'
      job.completedAt = new Date().toISOString()
    }
  } finally {
    running.delete(job.id)
    // Process next job in queue
    setTimeout(() => processNext(), 100)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const deployQueue = {
  /** Register the function that actually performs deployments */
  registerHandler(fn: JobHandler): void {
    handler = fn
  },

  /** Enqueue a new deployment job */
  enqueue(params: {
    projectId: string
    ownerId: string
    files: Record<string, string>
    projectName: string
    provider?: 'vercel' | 'netlify'
  }): DeployJob {
    const job: DeployJob = {
      id: nextId(),
      projectId: params.projectId,
      ownerId: params.ownerId,
      files: params.files,
      projectName: params.projectName,
      provider: params.provider ?? 'vercel',
      status: 'pending',
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    }

    queue.push(job)
    logger.info('system', `Deploy job ${job.id} enqueued`, params.projectName)

    // Kick off processing
    setTimeout(() => processNext(), 0)
    return job
  },

  /** Get job by ID */
  getJob(id: string): DeployJob | null {
    return queue.find(j => j.id === id) ?? null
  },

  /** Get all jobs for a project */
  getProjectJobs(projectId: string): DeployJob[] {
    return queue.filter(j => j.projectId === projectId)
  },

  /** Queue stats */
  stats() {
    return {
      total: queue.length,
      pending: queue.filter(j => j.status === 'pending').length,
      running: running.size,
      done: queue.filter(j => j.status === 'done').length,
      failed: queue.filter(j => j.status === 'failed').length,
      maxConcurrent: MAX_CONCURRENT,
    }
  },

  /** Clear completed/failed jobs older than 1 hour */
  cleanup(): void {
    const cutoff = Date.now() - 3_600_000
    const before = queue.length
    queue.splice(0, queue.length, ...queue.filter(j => {
      if (j.status !== 'done' && j.status !== 'failed') return true
      return new Date(j.completedAt ?? j.createdAt).getTime() > cutoff
    }))
    logger.info('system', `Queue cleanup: removed ${before - queue.length} old jobs`)
  },
}
