/**
 * Deploy Worker — processes deployment jobs from the deploy queue.
 * Designed to run as a standalone Node.js process for horizontal scaling.
 *
 * Usage: ts-node workers/deploy-worker.ts
 */

import 'tsconfig-paths/register'
import { deployQueue } from '../lib/services/queue/deploy-queue'
import { logger } from '../lib/core/logger'

const POLL_INTERVAL_MS = 3000
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

async function workerLoop(): Promise<void> {
  logger.info('system', 'Deploy worker started')

  // Periodic cleanup of old completed jobs
  setInterval(() => {
    deployQueue.cleanup()
  }, CLEANUP_INTERVAL_MS)

  while (true) {
    const stats = deployQueue.stats()

    if (stats.pending > 0 || stats.running > 0) {
      logger.info('system', `Deploy queue: ${stats.pending} pending, ${stats.running} running, ${stats.done} done, ${stats.failed} failed`)
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
  }
}

if (require.main === module) {
  workerLoop().catch(err => {
    console.error('Deploy worker crashed:', err)
    process.exit(1)
  })
}
