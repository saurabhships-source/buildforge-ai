import { NextResponse } from 'next/server'

// GET /api/hub/projects — returns public/template repos from the community feed
// Since repos are stored client-side in localStorage, this endpoint returns
// a curated set of seed community projects for the public feed.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const sort = searchParams.get('sort') ?? 'trending'
  const q = searchParams.get('q')?.toLowerCase() ?? ''

  let projects = SEED_COMMUNITY_PROJECTS

  if (category && category !== 'all') {
    projects = projects.filter(p => p.templateCategory === category || p.appType === category)
  }
  if (q) {
    projects = projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.agents.some(a => a.toLowerCase().includes(q))
    )
  }
  if (sort === 'forks') projects = [...projects].sort((a, b) => b.forkCount - a.forkCount)
  else if (sort === 'stars') projects = [...projects].sort((a, b) => b.starCount - a.starCount)
  else if (sort === 'recent') projects = [...projects].sort((a, b) => new Date(b.lastBuildAt).getTime() - new Date(a.lastBuildAt).getTime())

  return NextResponse.json({ projects })
}

const SEED_COMMUNITY_PROJECTS = [
  {
    id: 'seed-1', name: 'AI Resume Builder', description: 'Generate professional resumes with AI in seconds',
    appType: 'tool', agents: ['PlannerAgent', 'BuilderAgent', 'DesignSystemAgent'],
    healthScore: 92, forkCount: 47, starCount: 128, lastBuildAt: '2026-03-10T10:00:00Z',
    ownerName: 'buildforge', isTemplate: true, templateCategory: 'ai_tool', icon: '📄',
    framework: 'react', visibility: 'template',
  },
  {
    id: 'seed-2', name: 'Fitness Booking SaaS', description: 'Full-stack SaaS for gym class bookings with Stripe',
    appType: 'saas', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent', 'DatabaseAgent'],
    healthScore: 88, forkCount: 31, starCount: 95, lastBuildAt: '2026-03-12T14:00:00Z',
    ownerName: 'buildforge', isTemplate: true, templateCategory: 'saas', icon: '💪',
    framework: 'nextjs', visibility: 'template',
  },
  {
    id: 'seed-3', name: 'AI CRM Dashboard', description: 'Customer relationship management with AI insights',
    appType: 'crm', agents: ['PlannerAgent', 'BuilderAgent', 'OptimizerAgent'],
    healthScore: 85, forkCount: 22, starCount: 74, lastBuildAt: '2026-03-11T09:00:00Z',
    ownerName: 'buildforge', isTemplate: true, templateCategory: 'dashboard', icon: '👥',
    framework: 'react', visibility: 'template',
  },
  {
    id: 'seed-4', name: 'AI Course Platform', description: 'Online learning platform with AI-generated curriculum',
    appType: 'saas', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent', 'DebuggerAgent'],
    healthScore: 90, forkCount: 38, starCount: 112, lastBuildAt: '2026-03-13T16:00:00Z',
    ownerName: 'buildforge', isTemplate: true, templateCategory: 'saas', icon: '🎓',
    framework: 'nextjs', visibility: 'template',
  },
  {
    id: 'seed-5', name: 'SaaS Landing Page', description: 'High-converting landing page with pricing and testimonials',
    appType: 'website', agents: ['BuilderAgent', 'DesignSystemAgent', 'SEOAgent'],
    healthScore: 95, forkCount: 89, starCount: 203, lastBuildAt: '2026-03-14T11:00:00Z',
    ownerName: 'buildforge', isTemplate: true, templateCategory: 'landing', icon: '🚀',
    framework: 'html', visibility: 'template',
  },
  {
    id: 'seed-6', name: 'NFT Marketplace', description: 'Web3 NFT marketplace with wallet connect',
    appType: 'tool', agents: ['PlannerAgent', 'BuilderAgent', 'SecurityAgent'],
    healthScore: 82, forkCount: 15, starCount: 61, lastBuildAt: '2026-03-09T08:00:00Z',
    ownerName: 'buildforge', isTemplate: true, templateCategory: 'marketplace', icon: '🎨',
    framework: 'react', visibility: 'template',
  },
  {
    id: 'seed-7', name: 'Analytics Dashboard', description: 'Real-time analytics with charts and KPI tracking',
    appType: 'dashboard', agents: ['PlannerAgent', 'BuilderAgent', 'OptimizerAgent'],
    healthScore: 91, forkCount: 44, starCount: 137, lastBuildAt: '2026-03-13T12:00:00Z',
    ownerName: 'buildforge', isTemplate: true, templateCategory: 'dashboard', icon: '📊',
    framework: 'react', visibility: 'template',
  },
  {
    id: 'seed-8', name: 'AI Chat App', description: 'Real-time chat with AI assistant integration',
    appType: 'ai_app', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent'],
    healthScore: 87, forkCount: 56, starCount: 189, lastBuildAt: '2026-03-14T15:00:00Z',
    ownerName: 'buildforge', isTemplate: true, templateCategory: 'ai_tool', icon: '💬',
    framework: 'nextjs', visibility: 'template',
  },
]
