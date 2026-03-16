'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, GitFork, Star, Clock, Zap, Plus, Globe, Filter, Sparkles, ArrowRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { repoService } from '@/lib/hub/repo-service'
import type { ProjectRepo } from '@/lib/hub/types'
import { useAuth } from '@/lib/auth-context'

const CATEGORIES = [
  { value: 'all', label: 'All', emoji: '🌐' },
  { value: 'saas', label: 'SaaS', emoji: '🚀' },
  { value: 'ai_tool', label: 'AI Tools', emoji: '🤖' },
  { value: 'dashboard', label: 'Dashboards', emoji: '📊' },
  { value: 'marketplace', label: 'Marketplaces', emoji: '🛒' },
  { value: 'landing', label: 'Landing Pages', emoji: '🎯' },
]

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'stars', label: 'Most Starred' },
  { value: 'forks', label: 'Most Forked' },
  { value: 'recent', label: 'Recently Built' },
]

const FRAMEWORK_COLORS: Record<string, string> = {
  nextjs: 'bg-black/10 text-black dark:bg-white/10 dark:text-white',
  react: 'bg-cyan-500/10 text-cyan-600',
  html: 'bg-orange-500/10 text-orange-600',
  vue: 'bg-green-500/10 text-green-600',
  svelte: 'bg-red-500/10 text-red-600',
}

interface CommunityProject {
  id: string; name: string; description: string; appType: string
  agents: string[]; healthScore: number; forkCount: number; starCount: number
  viewCount: number; likeCount: number; remixCount: number
  lastBuildAt: string; ownerName: string; isTemplate: boolean
  templateCategory?: string; icon: string; framework?: string; visibility?: string
  tags?: string[]
}

function ProjectCard({ project, onFork, isOwn }: {
  project: CommunityProject | ProjectRepo
  onFork: (id: string, name: string) => void
  isOwn?: boolean
}) {
  const icon = 'icon' in project ? (project as CommunityProject).icon : '📁'
  const framework = 'framework' in project ? project.framework : 'html'
  const agents = project.agents ?? []

  return (
    <Card className="border-border/50 hover:border-primary/40 transition-all group hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{icon}</span>
            <div className="min-w-0">
              <Link
                href={`/hub/${project.id}`}
                className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1"
              >
                {project.name}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">by {project.ownerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {project.isTemplate && (
              <Badge variant="outline" className="text-[10px] h-5 bg-primary/5 text-primary border-primary/20">
                Template
              </Badge>
            )}
            {isOwn && (
              <Badge variant="outline" className="text-[10px] h-5">Mine</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>

        <div className="flex flex-wrap gap-1">
          {agents.slice(0, 3).map(a => (
            <Badge key={a} variant="secondary" className="text-[10px] h-4 px-1.5">
              {a.replace('Agent', '')}
            </Badge>
          ))}
          {agents.length > 3 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">+{agents.length - 3}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />{project.starCount}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />{project.forkCount}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-primary" />{project.healthScore}
            </span>
          </div>
          {framework && (
            <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${FRAMEWORK_COLORS[framework] ?? ''}`}>
              {framework}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" asChild>
            <Link href={`/hub/${project.id}`}>
              <ArrowRight className="h-3 w-3 mr-1" /> View
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => onFork(project.id, project.name)}
          >
            <GitFork className="h-3 w-3" /> Fork
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href={`/dashboard/builder?hub=${project.id}`}>
              Open
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HubPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('trending')
  const [tab, setTab] = useState<'community' | 'mine' | 'templates'>('community')
  const [communityProjects, setCommunityProjects] = useState<CommunityProject[]>([])
  const [myRepos, setMyRepos] = useState<ProjectRepo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCommunity = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort, category })
      if (query) params.set('q', query)
      const res = await fetch(`/api/hub/projects?${params}`)
      const data = await res.json()
      setCommunityProjects(data.projects ?? [])
    } catch { toast.error('Failed to load hub') }
    finally { setLoading(false) }
  }, [sort, category, query])

  useEffect(() => { fetchCommunity() }, [fetchCommunity])

  useEffect(() => {
    if (tab === 'mine' || tab === 'templates') {
      const repos = repoService.listRepos(user?.id)
      if (tab === 'templates') setMyRepos(repos.filter(r => r.isTemplate))
      else setMyRepos(repos)
      setLoading(false)
    }
  }, [tab, user?.id])

  const handleFork = useCallback(async (id: string, name: string) => {
    if (!user) { toast.error('Sign in to fork projects'); return }
    try {
      await fetch('/api/hub/fork', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: id, sourceName: name }),
      })
      const forked = repoService.forkRepo(id, { ownerId: user.id, ownerName: user.name ?? 'me' })
      if (forked) {
        toast.success(`Forked "${name}" — opening in builder`)
        router.push(`/dashboard/builder?hub=${forked.id}`)
      } else {
        // Seed project fork — open builder with template prompt
        toast.success(`Opening "${name}" as template`)
        router.push(`/dashboard/builder?template=${id}`)
      }
    } catch { toast.error('Fork failed') }
  }, [user, router])

  const displayProjects = tab === 'community' ? communityProjects : myRepos

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold">AI Project Hub</h1>
              </div>
              <p className="text-muted-foreground">Browse, fork, and deploy AI-built applications</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/apps"><Sparkles className="h-4 w-4 mr-2" />App Gallery</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/projects"><Globe className="h-4 w-4 mr-2" />My Projects</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/builder"><Plus className="h-4 w-4 mr-2" />New Build</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{communityProjects.length + myRepos.length} projects</span>
            <span className="flex items-center gap-1.5"><GitFork className="h-4 w-4" />{communityProjects.reduce((s, p) => s + p.forkCount, 0)} forks</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4" />{communityProjects.reduce((s, p) => s + p.starCount, 0)} stars</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Tabs value={tab} onValueChange={v => { setTab(v as typeof tab); setLoading(true) }}>
            <TabsList>
              <TabsTrigger value="community">Community</TabsTrigger>
              <TabsTrigger value="mine">My Repos</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8 h-9"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        {tab === 'community' && (
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    category === c.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/50 hover:border-primary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-1.5">
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    sort === s.value ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {tab === 'mine' ? 'No repos yet' : 'No projects found'}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {tab === 'mine' ? 'Build something and save it to the hub' : 'Try a different search or category'}
            </p>
            <Button asChild>
              <Link href="/dashboard/builder"><Plus className="h-4 w-4 mr-2" />Start Building</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(displayProjects as (CommunityProject | ProjectRepo)[]).map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onFork={handleFork}
                isOwn={tab === 'mine'}
              />
            ))}
          </div>
        )}

        {/* Trending section */}
        {tab === 'community' && !loading && communityProjects.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Recently Built</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...communityProjects]
                .sort((a, b) => new Date(b.lastBuildAt).getTime() - new Date(a.lastBuildAt).getTime())
                .slice(0, 5)
                .map(p => (
                  <Link
                    key={p.id}
                    href={`/hub/${p.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 hover:border-primary/40 text-xs transition-colors"
                  >
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{p.healthScore}</Badge>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
