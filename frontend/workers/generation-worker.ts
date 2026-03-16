/**
 * Generation Worker — processes product build jobs from the queue.
 * Designed to run as a standalone Node.js process for horizontal scaling.
 *
 * Usage: ts-node workers/generation-worker.ts
 *
 * In production: run multiple instances behind a process manager (PM2, Railway, etc.)
 * Each worker polls the shared queue and processes one job at a time.
 */

import 'tsconfig-paths/register'
import { buildProduct } from '../lib/services/ai/product-factory'
import { logger } from '../lib/core/logger'

// ── Simple in-process job polling ─────────────────────────────────────────────
// In production, replace with Redis BRPOP or Supabase realtime subscription.

interface GenerationJob {
  id: string
  prompt: string
  ownerId: string
  modelId?: string
  deploy?: boolean
}

const POLL_INTERVAL_MS = 2000
const pendingJobs: GenerationJob[] = []

/** Add a job to the worker queue (called from API routes in the same process) */
export function enqueueGenerationJob(job: GenerationJob): void {
  pendingJobs.push(job)
  logger.info('system', `Generation job enqueued: ${job.id}`, job.prompt.slice(0, 60))
}

async function processJob(job: GenerationJob): Promise<void> {
  logger.info('system', `Generation worker processing job ${job.id}`)
  try {
    const result = await buildProduct(job.prompt, {
      ownerId: job.ownerId,
      modelId: job.modelId as never,
      deploy: job.deploy ?? false,
    })
    logger.info('system', `Generation job ${job.id} complete: ${result.projectId}`)
  } catch (err) {
    logger.error('system', `Generation job ${job.id} failed`, err instanceof Error ? err.message : String(err))
  }
}

async function workerLoop(): Promise<void> {
  logger.info('system', 'Generation worker started')

  while (true) {
    const job = pendingJobs.shift()
    if (job) {
      await processJob(job)
    } else {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    }
  }
}

// Only start the loop when run directly (not when imported)
if (require.main === module) {
  workerLoop().catch(err => {
    console.error('Generation worker crashed:', err)
    process.exit(1)
  })
}
