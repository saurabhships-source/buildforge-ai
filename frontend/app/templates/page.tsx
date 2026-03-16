'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Zap, Star, GitFork, ArrowRight, Sparkles } from 'lucide-react'
import { repoService } from '@/lib/hub/repo-service'
import type { ProjectRepo } from '@/lib/hub/types'

const CATEGORIES = ['All', 'SaaS', 'Website', 'Dashboard', 'E-commerce', 'Booking', 'Restaurant', 'Portfolio', 'Blog', 'AI App', 'Tool']

const FEATURED_TEMPLATES: ProjectRepo[] = [
  {
    id: 'tpl-saas-1', name: 'SaaS Starter', description: 'Full SaaS landing page with pricing, features, and CTA sections.',
    ownerId: 'buildforge', ownerName: 'BuildForge', appType: 'saas', visibility: 'public',
    files: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    buildRuns: [], versions: [], deployments: [], framework: 'html', agents: ['builder'], isTemplate: true,
    forkCount: 0, starCount: 0, healthScore: 0, viewCount: 3200,
    tags: ['SaaS', 'Landing Page'], likeCount: 142, remixCount: 89, shareSlug: 'saas-starter',
    prompts: [{ id: 'p1', prompt: 'build a saas landing page with pricing and features', agent: 'builder', timestamp: new Date().toISOString(), versionId: 'v1', filesChanged: 0 }],
  },
  {
    id: 'tpl-dash-1', name: 'Analytics Dashboard', description: 'Modern analytics dashboard with charts, KPIs, and data tables.',
    ownerId: 'buildforge', ownerName: 'BuildForge', appType: 'dashboard', visibility: 'public',
    files: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    buildRuns: [], versions: [], deployments: [], framework: 'html', agents: ['builder'], isTemplate: true,
    forkCount: 0, starCount: 0, healthScore: 0, viewCount: 2100,
    tags: ['Dashboard', 'Analytics'], likeCount: 98, remixCount: 54, shareSlug: 'analytics-dashboard',
    prompts: [{ id: 'p1', prompt: 'build an analytics dashboard with charts and KPIs', agent: 'builder', timestamp: new Date().toISOString(), versionId: 'v1', filesChanged: 0 }],
  },
  {
    id: 'tpl-ecom-1', name: 'E-commerce Store', description: 'Product catalog, cart, and checkout flow for online stores.',
    ownerId: 'buildforge', ownerName: 'BuildForge', appType: 'ecommerce', visibility: 'public',
    files: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    buildRuns: [], versions: [], deployments: [], framework: 'html', agents: ['builder'], isTemplate: true,
    forkCount: 0, starCount: 0, healthScore: 0, viewCount: 1800,
    tags: ['E-commerce', 'Store'], likeCount: 76, remixCount: 41, shareSlug: 'ecommerce-store',
    prompts: [{ id: 'p1', prompt: 'build an ecommerce store with product catalog and cart', agent: 'builder', timestamp: new Date().toISOString(), versionId: 'v1', filesChanged: 0 }],
  },
  {
    id: 'tpl-rest-1', name: 'Restaurant Website', description: 'Elegant restaurant site with menu, gallery, and reservations.',
    ownerId: 'buildforge', ownerName: 'BuildForge', appType: 'restaurant', visibility: 'public',
    files: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    buildRuns: [], versions: [], deployments: [], framework: 'html', agents: ['builder'], isTemplate: true,
    forkCount: 0, starCount: 0, healthScore: 0, viewCount: 1400,
    tags: ['Restaurant', 'Food'], likeCount: 63, remixCount: 28, shareSlug: 'restaurant-website',
    prompts: [{ id: 'p1', prompt: 'build a restaurant website with menu and reservations', agent: 'builder', timestamp: new Date().toISOString(), versionId: 'v1', filesChanged: 0 }],
  },
  {
    id: 'tpl-port-1', name: 'Developer Portfolio', description: 'Clean portfolio with projects, skills, and contact form.',
    ownerId: 'buildforge', ownerName: 'BuildForge', appType: 'portfolio', visibility: 'public',
    files: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    buildRuns: [], versions: [], deployments: [], framework: 'html', agents: ['builder'], isTemplate: true,
    forkCount: 0, starCount: 0, healthScore: 0, viewCount: 2600,
    tags: ['Portfolio', 'Personal'], likeCount: 115, remixCount: 67, shareSlug: 'developer-portfolio',
    prompts: [{ id: 'p1', prompt: 'build a developer portfolio with projects and contact form', agent: 'builder', timestamp: new Date().toISOString(), versionId: 'v1', filesChanged: 0 }],
  },
  {
    id: 'tpl-ai-1', name: 'AI Chat App', description: 'ChatGPT-style interface with streaming responses and history.',
    ownerId: 'buildforge', ownerName: 'BuildForge', appType: 'ai-app', visibility: 'public',
    files: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    buildRuns: [], versions: [], deployments: [], framework: 'html', agents: ['builder'], isTemplate: true,
    forkCount: 0, starCount: 0, healthScore: 0, viewCount: 4500,
    tags: ['AI App', 'Chat'], likeCount: 201, remixCount: 112, shareSlug: 'ai-chat-app',
    prompts: [{ id: 'p1', prompt: 'build an AI chat app with streaming responses and conversation history', agent: 'builder', timestamp: new Date().toISOString(), versionId: 'v1', filesChanged: 0 }],
  },
  {
    id: 'tpl-book-1', name: 'Booking System', description: 'Appointment booking with calendar, time slots, and confirmation.',
    ownerId: 'buildforge', ownerName: 'BuildForge', appType: 'booking', visibility: 'public',
    files: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    buildRuns: [], versions: [], deployments: [], framework: 'html', agents: ['builder'], isTemplate: true,
    forkCount: 0, starCount: 0, healthScore: 0, viewCount: 1200,
    tags: ['Booking', 'Calendar'], likeCount: 55, remixCount: 22, shareSlug: 'booking-system',
    prompts: [{ id: 'p1', prompt: 'build a booking system with calendar and time slots', agent: 'builder', timestamp: new Date().toISOString(), versionId: 'v1', filesChanged: 0 }],
  },
  {
    id: 'tpl-blog-1', name: 'Blog Platform', description: 'Modern blog with article cards, categories, and newsletter.',
    ownerId: 'buildforge', ownerName: 'BuildForge', appType: 'blog', visibility: 'public',
    files: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    buildRuns: [], versions: [], deployments: [], framework: 'html', agents: ['builder'], isTemplate: true,
    forkCount: 0, starCount: 0, healthScore: 0, viewCount: 980,
    tags: ['Blog', 'Content'], likeCount: 44, remixCount: 19, shareSlug: 'blog-platform',
    prompts: [{ id: 'p1', prompt: 'build a blog platform with article cards and newsletter', agent: 'builder', timestamp: new Date().toISOString(), versionId: 'v1', filesChanged: 0 }],
  },
]

const APP_TYPE_COLORS: Record<string, string> = {
  saas: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  dashboard: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ecommerce: 'bg-green-500/20 text-green-300 border-green-500/30',
  restaurant: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  portfolio: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'ai-app': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  booking: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  blog: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  website: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  tool: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
}

function TemplateCard({ template, onUse }: { template: ProjectRepo; onUse: (t: ProjectRepo) => void }) {
  const typeColor = APP_TYPE_COLORS[template.appType] ?? 'bg-muted/30 text-muted-foreground border-border'

  return (
    <div className="group relative flex flex-col rounded-xl border border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card transition-all duration-200 overflow-hidden">
      {/* Preview placeholder */}
      <div className="h-36 bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center border-b border-border/30">
        <Sparkles className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
      </div>

      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight">{template.name}</h3>
          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${typeColor}`}>
            {template.appType}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{template.description}</p>

        <div className="flex items-center gap-3 mt-auto pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-3 w-3" />{template.likeCount ?? 0}</span>
          <span className="flex items-center gap-1"><GitFork className="h-3 w-3" />{template.remixCount ?? 0}</span>
          <span className="ml-auto text-[10px] opacity-60">by {template.ownerName}</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => onUse(template)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Zap className="h-3.5 w-3.5" />
          Use Template
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  // Merge featured templates with any published community templates
  const communityTemplates = useMemo(() => {
    try {
      return repoService.getTemplates()
    } catch { return [] }
  }, [])

  const allTemplates = useMemo(() => {
    const ids = new Set(FEATURED_TEMPLATES.map(t => t.id))
    return [...FEATURED_TEMPLATES, ...communityTemplates.filter(t => !ids.has(t.id))]
  }, [communityTemplates])

  const filtered = useMemo(() => {
    return allTemplates.filter(t => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === 'All' || (t.tags ?? []).some(tag => tag.toLowerCase() === activeCategory.toLowerCase()) || t.appType.toLowerCase() === activeCategory.toLowerCase().replace('-', '')
      return matchesSearch && matchesCategory
    })
  }, [allTemplates, search, activeCategory])

  const handleUseTemplate = (template: ProjectRepo) => {
    // Navigate to builder with the template prompt
    const prompt = encodeURIComponent(template.prompts[0]?.prompt || template.description || template.name)
    router.push(`/dashboard/builder?prompt=${prompt}&template=${template.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Template Marketplace
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Start from a template</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Pick a template, customize it with AI, and launch in minutes.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filtered.length} template{filtered.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
          </p>
          <Link href="/apps" className="text-xs text-primary hover:underline flex items-center gap-1">
            Browse community apps <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(template => (
              <TemplateCard key={template.id} template={template} onUse={handleUseTemplate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No templates found for &quot;{search}&quot;</p>
            <button onClick={() => { setSearch(''); setActiveCategory('All') }} className="mt-2 text-xs text-primary hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
