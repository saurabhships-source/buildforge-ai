'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Eye, Heart, GitFork, Sparkles, Plus, TrendingUp, Clock, Repeat2, Trophy, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { repoService } from '@/lib/hub/repo-service'
import {
  SEED_GALLERY_PROJECTS, GALLERY_TAGS, sortProjects, filterByTag,
  type GallerySort, type GalleryTag,
} from '@/lib/gallery-service'
import type { CommunityProject } from '@/lib/hub/types'

const SORT_TABS: { value: GallerySort; label: string; icon: React.ReactNode }[] = [
  { value: 'trending', label: 'Trending', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: 'newest', label: 'Newest', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'most_remixed', label: 'Most Remixed', icon: <Repeat2 className="h-3.5 w-3.5" /> },
  { value: 'top_developers', label: 'Top Developers', icon: <Trophy className="h-3.5 w-3.5" /> },
]

const FRAMEWORK_COLORS: Record<string, string> = {
  nextjs: 'bg-black/10 text-black dark:bg-white/10 dark:text-white',
  react: 'bg-cyan-500/10 text-cyan-600',
  html: 'bg-orange-500/10 text-orange-600',
  vue: 'bg-green-500/10 text-green-600',
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function AppCard({ project, onRemix }: { project: CommunityProject; onRemix: (p: CommunityProject) => void }) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden">
      {/* Preview area */}
      <Link href={`/apps/${project.id}`} className="block">
        <div className="h-40 bg-gradient-to-br from-primary/5 via-primary/10 to-violet-500/10 flex items-center justify-center relative overflow-hidden">
          <span className="text-5xl">{project.icon}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-2 right-2 flex gap-1">
            {project.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5 bg-black/40 text-white border-0">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div>
          <Link href={`/apps/${project.id}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
            {project.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href={`/users/${project.ownerName}`} className="hover:text-foreground transition-colors">
            @{project.ownerName}
          </Link>
          {project.framework && (
            <>
              <span>·</span>
              <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${FRAMEWORK_COLORS[project.framework] ?? ''}`}>
                {project.framework}
              </Badge>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-1 border-t border-border/30">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />{formatCount(project.likeCount ?? 0)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="h-3 w-3" />{formatCount(project.remixCount ?? 0)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />{formatCount(project.viewCount ?? 0)}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-6 text-[11px] px-2 gap-1"
            onClick={() => onRemix(project)}
          >
            <Repeat2 className="h-3 w-3" /> Remix
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AppsGalleryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sort, setSort] = useState<GallerySort>('trending')
  const [tag, setTag] = useState<GalleryTag>('all')
  const [query, setQuery] = useState('')
  const [userProjects, setUserProjects] = useState<CommunityProject[]>([])

  useEffect(() => {
    // Load public user projects from localStorage
    const pub = repoService.getPublicRepos().map(r => ({
      id: r.id, name: r.name, description: r.description, appType: r.appType,
      agents: r.agents, healthScore: r.healthScore, forkCount: r.forkCount,
      starCount: r.starCount, viewCount: r.viewCount ?? 0, likeCount: r.likeCount ?? 0,
      remixCount: r.remixCount ?? 0, lastBuildAt: r.lastBuildAt ?? r.updatedAt,
      ownerName: r.ownerName, isTemplate: r.isTemplate, templateCategory: r.templateCategory,
      icon: '📁', tags: r.tags ?? [], shareSlug: r.shareSlug, framework: r.framework,
      visibility: r.visibility,
    } as CommunityProject))
    setUserProjects(pub)
  }, [])

  const allProjects = useMemo(() => [...userProjects, ...SEED_GALLERY_PROJECTS], [userProjects])

  const filtered = useMemo(() => {
    let list = filterByTag(allProjects, tag)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    return sortProjects(list, sort)
  }, [allProjects, tag, sort, query])

  const handleRemix = (project: CommunityProject) => {
    if (!user) { toast.error('Sign in to remix projects'); return }
    const forked = repoService.forkRepo(project.id, { ownerId: user.id, ownerName: user.name ?? 'me' })
    if (forked) {
      toast.success(`Remixing "${project.name}" — opening builder`)
      router.push(`/dashboard/builder?hub=${forked.id}`)
    } else {
      toast.success(`Opening "${project.name}" as template`)
      router.push(`/dashboard/builder?template=${project.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Community Gallery
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Explore AI-Built Apps
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto mb-6">
            Browse, remix, and deploy apps built with BuildForge AI. Every app is a starting point.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/dashboard/builder"><Plus className="h-4 w-4 mr-2" />Build Your App</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/hub"><ArrowRight className="h-4 w-4 mr-2" />AI Project Hub</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Sort tabs + search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            {SORT_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setSort(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  sort === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              className="pl-8 h-9"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap gap-2">
          {GALLERY_TAGS.map(t => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                tag === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {t === 'all' ? '🌐 All' : t}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>{filtered.length} apps</span>
          <span>{filtered.reduce((s, p) => s + (p.remixCount ?? 0), 0).toLocaleString()} remixes</span>
          <span>{filtered.reduce((s, p) => s + (p.viewCount ?? 0), 0).toLocaleString()} views</span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No apps found</h3>
            <p className="text-muted-foreground text-sm mb-6">Try a different search or tag</p>
            <Button asChild><Link href="/dashboard/builder"><Plus className="h-4 w-4 mr-2" />Build Something</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(p => (
              <AppCard key={p.id} project={p} onRemix={handleRemix} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
