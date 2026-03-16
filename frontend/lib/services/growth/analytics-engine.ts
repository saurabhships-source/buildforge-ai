/**
 * Analytics Engine — tracks visitors, signups, and conversion rates.
 * Provides feedback for improving marketing performance.
 * In-memory store — swap for a real analytics DB in production.
 */

import { logger } from '@/lib/core/logger'

export type EventType =
  | 'page_view' | 'signup' | 'login' | 'upgrade' | 'feature_used'
  | 'email_opened' | 'email_clicked' | 'product_hunt_click' | 'demo_requested'

export interface AnalyticsEvent {
  id: string
  startupId: string
  type: EventType
  userId?: string
  sessionId: string
  page?: string
  source?: string       // utm_source
  medium?: string       // utm_medium
  campaign?: string     // utm_campaign
  properties?: Record<string, string | number | boolean>
  timestamp: string
}

export interface ConversionFunnel {
  visitors: number
  signups: number
  activated: number     // used core feature
  upgraded: number
  signupRate: number    // %
  activationRate: number
  upgradeRate: number
}

export interface ChannelPerformance {
  source: string
  visitors: number
  signups: number
  conversionRate: number
}

export interface AnalyticsReport {
  startupId: string
  period: string
  funnel: ConversionFunnel
  topChannels: ChannelPerformance[]
  topPages: { page: string; views: number }[]
  recommendations: string[]
  generatedAt: string
}

// ── In-memory event store ──────────────────────────────────────────────────────
const events: AnalyticsEvent[] = []
let idCounter = 0
const MAX_EVENTS = 10_000

export const analyticsEngine = {
  track(
    startupId: string,
    type: EventType,
    sessionId: string,
    extras?: Partial<Omit<AnalyticsEvent, 'id' | 'startupId' | 'type' | 'sessionId' | 'timestamp'>>,
  ): AnalyticsEvent {
    const event: AnalyticsEvent = {
      id: `evt-${++idCounter}`,
      startupId,
      type,
      sessionId,
      timestamp: new Date().toISOString(),
      ...extras,
    }

    events.unshift(event)
    if (events.length > MAX_EVENTS) events.length = MAX_EVENTS

    return event
  },

  getReport(startupId: string, days = 30): AnalyticsReport {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const relevant = events.filter(e => e.startupId === startupId && e.timestamp >= since)

    const visitors = new Set(relevant.filter(e => e.type === 'page_view').map(e => e.sessionId)).size
    const signups = relevant.filter(e => e.type === 'signup').length
    const activated = relevant.filter(e => e.type === 'feature_used').length
    const upgraded = relevant.filter(e => e.type === 'upgrade').length

    const funnel: ConversionFunnel = {
      visitors,
      signups,
      activated,
      upgraded,
      signupRate: visitors > 0 ? Math.round((signups / visitors) * 100) : 0,
      activationRate: signups > 0 ? Math.round((activated / signups) * 100) : 0,
      upgradeRate: activated > 0 ? Math.round((upgraded / activated) * 100) : 0,
    }

    // Channel performance
    const channelMap = new Map<string, { visitors: number; signups: number }>()
    for (const e of relevant) {
      const src = e.source ?? 'direct'
      if (!channelMap.has(src)) channelMap.set(src, { visitors: 0, signups: 0 })
      const ch = channelMap.get(src)!
      if (e.type === 'page_view') ch.visitors++
      if (e.type === 'signup') ch.signups++
    }
    const topChannels: ChannelPerformance[] = [...channelMap.entries()]
      .map(([source, data]) => ({
        source,
        ...data,
        conversionRate: data.visitors > 0 ? Math.round((data.signups / data.visitors) * 100) : 0,
      }))
      .sort((a, b) => b.signups - a.signups)
      .slice(0, 5)

    // Top pages
    const pageMap = new Map<string, number>()
    for (const e of relevant.filter(e => e.type === 'page_view' && e.page)) {
      pageMap.set(e.page!, (pageMap.get(e.page!) ?? 0) + 1)
    }
    const topPages = [...pageMap.entries()]
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Recommendations
    const recommendations: string[] = []
    if (funnel.signupRate < 3) recommendations.push('Signup rate is low — A/B test your hero headline and CTA')
    if (funnel.activationRate < 40) recommendations.push('Activation rate is low — improve onboarding email sequence')
    if (funnel.upgradeRate < 5) recommendations.push('Upgrade rate is low — add in-app upgrade prompts at feature limits')
    if (topChannels[0]?.source === 'direct') recommendations.push('Most traffic is direct — invest in SEO and social content')
    if (recommendations.length === 0) recommendations.push('Performance looks good — focus on scaling top channels')

    logger.info('system', `Analytics report generated for ${startupId}`, `${visitors} visitors, ${signups} signups`)

    return {
      startupId,
      period: `Last ${days} days`,
      funnel,
      topChannels,
      topPages,
      recommendations,
      generatedAt: new Date().toISOString(),
    }
  },

  getStats(startupId?: string) {
    const relevant = startupId ? events.filter(e => e.startupId === startupId) : events
    return {
      totalEvents: relevant.length,
      pageViews: relevant.filter(e => e.type === 'page_view').length,
      signups: relevant.filter(e => e.type === 'signup').length,
      upgrades: relevant.filter(e => e.type === 'upgrade').length,
    }
  },
}
