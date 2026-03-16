/**
 * Lead Generator — manages lead capture forms and in-memory lead storage.
 * In production, swap the in-memory store for a Prisma/Supabase adapter.
 */

import { logger } from '@/lib/core/logger'

export interface Lead {
  id: string
  email: string
  name?: string
  company?: string
  source: string          // e.g. "landing-page", "product-hunt", "blog"
  startupId: string       // which startup they signed up for
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'churned'
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface LeadFormConfig {
  startupId: string
  headline: string
  subheadline: string
  ctaText: string
  fields: ('email' | 'name' | 'company')[]
  source: string
}

// ── In-memory store (swap for DB in production) ────────────────────────────────
const leads = new Map<string, Lead>()
let idCounter = 0

export const leadStore = {
  capture(
    email: string,
    startupId: string,
    source: string,
    extras?: { name?: string; company?: string; tags?: string[] },
  ): Lead {
    // Deduplicate by email + startupId
    const existing = [...leads.values()].find(l => l.email === email && l.startupId === startupId)
    if (existing) {
      logger.info('system', `Lead already exists: ${email}`)
      return existing
    }

    const lead: Lead = {
      id: `lead-${++idCounter}-${Date.now()}`,
      email,
      name: extras?.name,
      company: extras?.company,
      source,
      startupId,
      status: 'new',
      tags: extras?.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    leads.set(lead.id, lead)
    logger.info('system', `Lead captured: ${email} from ${source}`)
    return lead
  },

  updateStatus(id: string, status: Lead['status']): boolean {
    const lead = leads.get(id)
    if (!lead) return false
    lead.status = status
    lead.updatedAt = new Date().toISOString()
    return true
  },

  getByStartup(startupId: string): Lead[] {
    return [...leads.values()].filter(l => l.startupId === startupId)
  },

  getAll(): Lead[] {
    return [...leads.values()].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  stats(startupId?: string) {
    const all = startupId ? this.getByStartup(startupId) : this.getAll()
    return {
      total: all.length,
      new: all.filter(l => l.status === 'new').length,
      qualified: all.filter(l => l.status === 'qualified').length,
      converted: all.filter(l => l.status === 'converted').length,
      conversionRate: all.length > 0
        ? Math.round((all.filter(l => l.status === 'converted').length / all.length) * 100)
        : 0,
    }
  },
}

/** Generate lead capture form config for a startup */
export function generateLeadFormConfig(
  startupId: string,
  headline: string,
  tagline: string,
): LeadFormConfig {
  return {
    startupId,
    headline: `Get early access to ${headline}`,
    subheadline: tagline,
    ctaText: 'Get early access',
    fields: ['email', 'name'],
    source: 'landing-page',
  }
}
