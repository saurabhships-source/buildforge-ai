'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Repeat2, Heart, Eye, Calendar, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { repoService } from '@/lib/hub/repo-service'
import { SEED_GALLERY_PROJECTS } from '@/lib/gallery-service'
import type { CommunityProject } from '@/lib/hub/types'

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [projects, setProjects] = useState<CommunityProject[]>([])
  const [joinedDate] = useState('March 2026')

  useEffect(() => {
    // Seed projects by this user
    const seedProjects = SEED_GALLERY_PROJECTS.filter(p => p.ownerName === username)
    // User's public repos
    const userRepos = repoService.getPublicRepos()
      .filter(r => r.ownerName === username)
      .map(r => ({
        id: r.id, name: r.name, description: r.description, appType: r.appType,
        agents: r.agents, healthScore: r.healthScore, forkCount: r.forkCount,
        starCount: r.starCount, viewCount: r.viewCount ?? 0, likeCount: r.likeCount ?? 0,
        remixCount: r.remixCount ?? 0, lastBuildAt: r.lastBuildAt ?? r.updatedAt,
        ownerName: r.ownerName, isTemplate: r.isTemplate, templateCategory: r.templateCategory,
        icon: '📁', tags: r.tags ?? [], shareSlug: r.shareSlug, framework: r.framework,
      } as CommunityProject))
    setProjects([...userRepos, ...seedProjects])
  }, [username])

  const totalRemixes = projects.reduce((s, p) => s + (p.remixCount ?? 0), 0)
  const totalLikes = projects.reduce((s, p) => s + (p.likeCount ?? 0), 0)
  const totalViews = projects.reduce((s, p) => s + (p.viewCount ?? 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/apps" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Gallery
        </Link>

        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">@{username}</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <Calendar className="h-3.5 w-3.5" /> Joined {joinedDate}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Apps', value: projects.length, icon: <Sparkles className="h-4 w-4" /> },
            { label: 'Remixes', value: totalRemixes, icon: <Repeat2 className="h-4 w-4" /> },
            { label: 'Likes', value: totalLikes, icon: <Heart className="h-4 w-4" /> },
            { label: 'Views', value: totalViews, icon: <Eye className="h-4 w-4" /> },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="text-muted-foreground">{stat.icon}</div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCount(stat.value)}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects */}
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Published Apps</h2>
        {projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No published apps yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <Link key={p.id} href={`/apps/${p.id}`} className="group block rounded-xl border border-border/50 hover:border-primary/40 transition-all overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-primary/5 via-primary/10 to-violet-500/10 flex items-center justify-center">
                  <span className="text-4xl">{p.icon}</span>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(p.likeCount ?? 0)}</span>
                    <span className="flex items-center gap-1"><Repeat2 className="h-3 w-3" />{formatCount(p.remixCount ?? 0)}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatCount(p.viewCount ?? 0)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
