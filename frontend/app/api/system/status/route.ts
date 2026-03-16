import { ok } from '@/lib/core/api-helpers'
import { getFactoryStats } from '@/lib/services/ai/product-factory'
import { deployQueue } from '@/lib/services/queue/deploy-queue'
import { checkSystemHealth } from '@/lib/services/system/health-check'
import { logger } from '@/lib/core/logger'

export async function GET() {
  const [health, factory, queue] = await Promise.all([
    checkSystemHealth(),
    Promise.resolve(getFactoryStats()),
    Promise.resolve(deployQueue.stats()),
  ])

  const recentErrors = logger.getErrors().slice(0, 10)

  return ok({
    health,
    factory: {
      activeGenerations: factory.activeGenerations,
      maxConcurrentPerUser: factory.maxConcurrentPerUser,
      storage: factory.storage,
    },
    queue: {
      pending: queue.pending,
      running: queue.running,
      done: queue.done,
      failed: queue.failed,
      maxConcurrent: queue.maxConcurrent,
    },
    recentErrors: recentErrors.map(e => ({
      message: e.message,
      category: e.category,
      timestamp: e.timestamp,
    })),
    timestamp: new Date().toISOString(),
  })
}
