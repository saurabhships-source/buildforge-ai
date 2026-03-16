// Gallery Service — trending algorithm + seed data for /apps gallery
import type { CommunityProject } from '@/lib/hub/types'

export type GallerySort = 'trending' | 'newest' | 'most_remixed' | 'top_developers'
export type GalleryTag = 'all' | 'SaaS' | 'Website' | 'Dashboard' | 'Tool' | 'AI App' | 'Ecommerce' | 'Booking'

/** Trending score: views × 0.3 + remixes × 0.5 + likes × 0.2 + recency bonus */
export function trendingScore(p: CommunityProject): number {
  const views = p.viewCount ?? 0
  const remixes = p.remixCount ?? 0
  const likes = p.likeCount ?? 0
  const ageMs = Date.now() - new Date(p.lastBuildAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  const recencyBonus = Math.max(0, 10 - ageDays * 0.5)
  return views * 0.3 + remixes * 0.5 + likes * 0.2 + recencyBonus
}

export function sortProjects(projects: CommunityProject[], sort: GallerySort): CommunityProject[] {
  const copy = [...projects]
  switch (sort) {
    case 'trending': return copy.sort((a, b) => trendingScore(b) - trendingScore(a))
    case 'newest': return copy.sort((a, b) => new Date(b.lastBuildAt).getTime() - new Date(a.lastBuildAt).getTime())
    case 'most_remixed': return copy.sort((a, b) => (b.remixCount ?? 0) - (a.remixCount ?? 0))
    case 'top_developers': return copy.sort((a, b) => (b.likeCount ?? 0) + (b.remixCount ?? 0) - ((a.likeCount ?? 0) + (a.remixCount ?? 0)))
    default: return copy
  }
}

export function filterByTag(projects: CommunityProject[], tag: GalleryTag): CommunityProject[] {
  if (tag === 'all') return projects
  return projects.filter(p => p.tags?.includes(tag) || p.appType?.toLowerCase().includes(tag.toLowerCase()))
}

export const GALLERY_TAGS: GalleryTag[] = ['all', 'SaaS', 'Website', 'Dashboard', 'Tool', 'AI App', 'Ecommerce', 'Booking']

export const SEED_GALLERY_PROJECTS: CommunityProject[] = [
  {
    id: 'seed-1', name: 'AI Resume Builder', description: 'Generate professional resumes with AI in seconds. Tailored for any job role.',
    appType: 'tool', agents: ['PlannerAgent', 'BuilderAgent', 'DesignSystemAgent'],
    healthScore: 92, forkCount: 47, starCount: 128, viewCount: 3200, likeCount: 128, remixCount: 47,
    lastBuildAt: '2026-03-10T10:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'ai_tool', icon: '📄', tags: ['Tool', 'AI App'], shareSlug: 'ai-resume-builder',
    framework: 'react', visibility: 'template',
  },
  {
    id: 'seed-2', name: 'Fitness Booking SaaS', description: 'Full-stack SaaS for gym class bookings with Stripe payments and member management.',
    appType: 'saas', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent', 'DatabaseAgent'],
    healthScore: 88, forkCount: 31, starCount: 95, viewCount: 2100, likeCount: 95, remixCount: 31,
    lastBuildAt: '2026-03-12T14:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'saas', icon: '💪', tags: ['SaaS', 'Booking'], shareSlug: 'fitness-booking-saas',
    framework: 'nextjs', visibility: 'template',
  },
  {
    id: 'seed-3', name: 'AI CRM Dashboard', description: 'Customer relationship management with AI-powered insights and pipeline tracking.',
    appType: 'crm', agents: ['PlannerAgent', 'BuilderAgent', 'OptimizerAgent'],
    healthScore: 85, forkCount: 22, starCount: 74, viewCount: 1800, likeCount: 74, remixCount: 22,
    lastBuildAt: '2026-03-11T09:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'dashboard', icon: '👥', tags: ['Dashboard', 'SaaS'], shareSlug: 'ai-crm-dashboard',
    framework: 'react', visibility: 'template',
  },
  {
    id: 'seed-4', name: 'AI Course Platform', description: 'Online learning platform with AI-generated curriculum, quizzes, and progress tracking.',
    appType: 'saas', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent', 'DebuggerAgent'],
    healthScore: 90, forkCount: 38, starCount: 112, viewCount: 2800, likeCount: 112, remixCount: 38,
    lastBuildAt: '2026-03-13T16:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'saas', icon: '🎓', tags: ['SaaS', 'Tool'], shareSlug: 'ai-course-platform',
    framework: 'nextjs', visibility: 'template',
  },
  {
    id: 'seed-5', name: 'SaaS Landing Page', description: 'High-converting landing page with pricing tables, testimonials, and CTA sections.',
    appType: 'website', agents: ['BuilderAgent', 'DesignSystemAgent', 'SEOAgent'],
    healthScore: 95, forkCount: 89, starCount: 203, viewCount: 5400, likeCount: 203, remixCount: 89,
    lastBuildAt: '2026-03-14T11:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'landing', icon: '🚀', tags: ['Website', 'SaaS'], shareSlug: 'saas-landing-page',
    framework: 'html', visibility: 'template',
  },
  {
    id: 'seed-6', name: 'NFT Marketplace', description: 'Web3 NFT marketplace with wallet connect, listings, and auction system.',
    appType: 'tool', agents: ['PlannerAgent', 'BuilderAgent', 'SecurityAgent'],
    healthScore: 82, forkCount: 15, starCount: 61, viewCount: 1200, likeCount: 61, remixCount: 15,
    lastBuildAt: '2026-03-09T08:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'marketplace', icon: '🎨', tags: ['Tool', 'Ecommerce'], shareSlug: 'nft-marketplace',
    framework: 'react', visibility: 'template',
  },
  {
    id: 'seed-7', name: 'Analytics Dashboard', description: 'Real-time analytics with charts, KPI tracking, and team collaboration.',
    appType: 'dashboard', agents: ['PlannerAgent', 'BuilderAgent', 'OptimizerAgent'],
    healthScore: 91, forkCount: 44, starCount: 137, viewCount: 3600, likeCount: 137, remixCount: 44,
    lastBuildAt: '2026-03-13T12:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'dashboard', icon: '📊', tags: ['Dashboard', 'SaaS'], shareSlug: 'analytics-dashboard',
    framework: 'react', visibility: 'template',
  },
  {
    id: 'seed-8', name: 'AI Chat App', description: 'Real-time chat with AI assistant integration, rooms, and message history.',
    appType: 'ai_app', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent'],
    healthScore: 87, forkCount: 56, starCount: 189, viewCount: 4800, likeCount: 189, remixCount: 56,
    lastBuildAt: '2026-03-14T15:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'ai_tool', icon: '💬', tags: ['AI App', 'Tool'], shareSlug: 'ai-chat-app',
    framework: 'nextjs', visibility: 'template',
  },
  {
    id: 'seed-9', name: 'Restaurant Ordering App', description: 'Online food ordering system with menu management, cart, and order tracking.',
    appType: 'ecommerce', agents: ['PlannerAgent', 'BuilderAgent', 'DesignSystemAgent'],
    healthScore: 89, forkCount: 33, starCount: 108, viewCount: 2900, likeCount: 108, remixCount: 33,
    lastBuildAt: '2026-03-12T10:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'ecommerce', icon: '🍕', tags: ['Ecommerce', 'Booking'], shareSlug: 'restaurant-ordering-app',
    framework: 'react', visibility: 'template',
  },
  {
    id: 'seed-10', name: 'Portfolio Website', description: 'Developer portfolio with project showcase, skills, and contact form.',
    appType: 'website', agents: ['BuilderAgent', 'DesignSystemAgent', 'SEOAgent'],
    healthScore: 94, forkCount: 72, starCount: 176, viewCount: 4200, likeCount: 176, remixCount: 72,
    lastBuildAt: '2026-03-15T09:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'landing', icon: '🧑‍💻', tags: ['Website', 'Tool'], shareSlug: 'portfolio-website',
    framework: 'html', visibility: 'template',
  },
  {
    id: 'seed-11', name: 'E-commerce Store', description: 'Full-featured online store with product catalog, cart, and Stripe checkout.',
    appType: 'ecommerce', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent', 'DatabaseAgent'],
    healthScore: 86, forkCount: 29, starCount: 91, viewCount: 2400, likeCount: 91, remixCount: 29,
    lastBuildAt: '2026-03-11T14:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'ecommerce', icon: '🛒', tags: ['Ecommerce', 'SaaS'], shareSlug: 'ecommerce-store',
    framework: 'nextjs', visibility: 'template',
  },
  {
    id: 'seed-12', name: 'Appointment Booking', description: 'Service booking platform with calendar, availability, and email reminders.',
    appType: 'booking', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent'],
    healthScore: 88, forkCount: 41, starCount: 124, viewCount: 3100, likeCount: 124, remixCount: 41,
    lastBuildAt: '2026-03-14T08:00:00Z', ownerName: 'buildforge', isTemplate: true,
    templateCategory: 'saas', icon: '📅', tags: ['Booking', 'SaaS'], shareSlug: 'appointment-booking',
    framework: 'react', visibility: 'template',
  },
]
