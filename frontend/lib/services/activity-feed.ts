/**
 * Activity Feed — tracks recent builds, remixes, and deployments.
 * In-memory ring buffer; swap for DB in production.
 */

import { logger } from '@/lib/core/logger'

export type ActivityType = 'build' | 'remix' | 'deploy' | 'improve' | 'publish'

export interface ActivityEvent {
  id: string
  type: ActivityType
  userId: string
  userName: string
  projectId: string
  projectName: string
  description: string
  timestamp: string
  meta?: Record<string, unknown>
}

const MAX_EVENTS = 200
const feed: ActivityEvent[] = []
let seq = 0

export const activityFeed = {
  push(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
    const entry: ActivityEvent = {
      ...event,
      id: `act-${Date.now()}-${++seq}`,
      timestamp: new Date().toISOString(),
    }
    feed.unshift(entry)
    if (feed.length > MAX_EVENTS) feed.length = MAX_EVENTS
    logger.debug('system', `Activity: ${event.type} by ${event.userName}`)
    return entry
  },

  getRecent(limit = 50): ActivityEvent[] {
    return feed.slice(0, limit)
  },

  getByUser(userId: string, limit = 20): ActivityEvent[] {
    return feed.filter(e => e.userId === userId).slice(0, limit)
  },

  getByType(type: ActivityType, limit = 20): ActivityEvent[] {
    return feed.filter(e => e.type === type).slice(0, limit)
  },

  /** Top creators by activity count */
  topCreators(limit = 10): Array<{ userId: string; userName: string; count: number }> {
    const counts = new Map<string, { userName: string; count: number }>()
    for (const e of feed) {
      const existing = counts.get(e.userId)
      if (existing) existing.count++
      else counts.set(e.userId, { userName: e.userName, count: 1 })
    }
    return [...counts.entries()]
      .map(([userId, v]) => ({ userId, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  },
}
