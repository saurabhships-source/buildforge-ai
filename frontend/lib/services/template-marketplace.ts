/**
 * Template Marketplace — in-memory store for published templates.
 * Backed by the existing SEED_GALLERY_PROJECTS as initial data.
 */

import { SEED_GALLERY_PROJECTS } from '@/lib/gallery-service'
import { logger } from '@/lib/core/logger'

export interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  rating: number        // 0–5
  ratingCount: number
  downloads: number
  authorId: string
  authorName: string
  files: Record<string, string>
  previewUrl: string | null
  createdAt: string
  updatedAt: string
}

// ── Seed from gallery ─────────────────────────────────────────────────────────

const store = new Map<string, MarketplaceTemplate>(
  SEED_GALLERY_PROJECTS.map(p => [p.id, {
    id: p.id,
    name: p.name,
    description: p.description,
    tags: p.tags ?? [],
    rating: 4.5,
    ratingCount: p.starCount ?? 0,
    downloads: p.forkCount ?? 0,
    authorId: 'buildforge',
    authorName: p.ownerName,
    files: {},
    previewUrl: p.shareSlug ? `/preview/${p.id}` : null,
    createdAt: p.lastBuildAt,
    updatedAt: p.lastBuildAt,
  }])
)

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const templateMarketplace = {
  list(opts: { tag?: string; sort?: 'rating' | 'downloads' | 'newest' } = {}): MarketplaceTemplate[] {
    let items = [...store.values()]
    if (opts.tag) items = items.filter(t => t.tags.includes(opts.tag!))
    switch (opts.sort ?? 'downloads') {
      case 'rating': items.sort((a, b) => b.rating - a.rating); break
      case 'newest': items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break
      default: items.sort((a, b) => b.downloads - a.downloads)
    }
    return items
  },

  get(id: string): MarketplaceTemplate | null {
    return store.get(id) ?? null
  },

  publish(template: Omit<MarketplaceTemplate, 'rating' | 'ratingCount' | 'downloads' | 'createdAt' | 'updatedAt'>): MarketplaceTemplate {
    const now = new Date().toISOString()
    const entry: MarketplaceTemplate = { ...template, rating: 0, ratingCount: 0, downloads: 0, createdAt: now, updatedAt: now }
    store.set(template.id, entry)
    logger.info('system', `Template published: ${template.name}`)
    return entry
  },

  rate(id: string, stars: number): MarketplaceTemplate | null {
    const t = store.get(id)
    if (!t) return null
    const total = t.rating * t.ratingCount + Math.min(5, Math.max(0, stars))
    t.ratingCount++
    t.rating = Math.round((total / t.ratingCount) * 10) / 10
    t.updatedAt = new Date().toISOString()
    store.set(id, t)
    return t
  },

  clone(id: string, newOwnerId: string, newOwnerName: string): MarketplaceTemplate | null {
    const t = store.get(id)
    if (!t) return null
    t.downloads++
    store.set(id, t)
    const cloned: MarketplaceTemplate = {
      ...t,
      id: `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: newOwnerId,
      authorName: newOwnerName,
      downloads: 0,
      rating: 0,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    store.set(cloned.id, cloned)
    logger.info('system', `Template cloned: ${t.name} → ${cloned.id}`)
    return cloned
  },

  delete(id: string, requesterId: string): boolean {
    const t = store.get(id)
    if (!t || t.authorId !== requesterId) return false
    store.delete(id)
    return true
  },
}
