'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Heart, Repeat2, Eye, Share2, Twitter, Linkedin, Copy, Check,
  ExternalLink, Play, Code2, ChevronRight, Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { repoService } from '@/lib/hub/repo-service'
import { SEED_GALLERY_PROJECTS } from '@/lib/gallery-service'
import type { CommunityProject } from '@/lib/hub/types'

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const RELATED_COUNT = 4

export default function AppShowcaseClient({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [project, setProject] = useState<CommunityProject | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    // Try user repos first
    const userRepo = repoService.loadRepo(projectId)
    if (userRepo) {
      const p: CommunityProject = {
        id: userRepo.id, name: userRepo.name, description: userRepo.description,
        appType: userRepo.appType, agents: userRepo.agents, healthScore: userRepo.healthScore,
        forkCount: userRepo.forkCount, starCount: userRepo.starCount,
        viewCount: userRepo.viewCount ?? 0, likeCount: userRepo.likeCount ?? 0,
        remixCount: userRepo.remixCount ?? 0, lastBuildAt: userRepo.lastBuildAt ?? userRepo.updatedAt,
        ownerName: userRepo.ownerName, isTemplate: userRepo.isTemplate,
        templateCategory: userRepo.templateCategory, icon: '📁',
        tags: userRepo.tags ?? [], shareSlug: userRepo.shareSlug, framework: userRepo.framework,
      }
      setProject(p)
      setLiked(repoService.isLiked(projectId))
      setLikeCount(userRepo.likeCount ?? 0)
      setViewCount(userRepo.viewCount ?? 0)
      repoService.incrementViews(projectId)
      return
    }
    // Fall back to seed data
    const seed = SEED_GALLERY_PROJECTS.find(p => p.id === projectId || p.shareSlug === projectId)
    if (seed) {
      setProject(seed)
      setLikeCount(seed.likeCount ?? 0)
      setViewCount((seed.viewCount ?? 0) + 1)
    }
  }, [projectId])

  const handleRemix = useCallback(() => {
    if (!user) { toast.error('Sign in to remix'); return }
    if (!project) return
    const forked = repoService.forkRepo(project.id, { ownerId: user.id, ownerName: user.name ?? 'me' })
    if (forked) {
      toast.success(`Remixing "${project.name}"`)
      router.push(`/dashboard/builder?hub=${forked.id}`)
    } else {
      router.push(`/dashboard/builder?template=${project.id}`)
    }
  }, [user, project, router])

  const handleLike = useCallback(() => {
    if (!project) return
    const userRepo = repoService.loadRepo(project.id)
    if (userRepo) {
      const nowLiked = repoService.toggleLike(project.id)
      setLiked(nowLiked)
      setLikeCount(prev => nowLiked ? prev + 1 : Math.max(0, prev - 1))
    } else {
      // Seed project — toggle locally
      setLiked(prev => {
        setLikeCount(c => prev ? Math.max(0, c - 1) : c + 1)
        return !prev
      })
    }
  }, [project])

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/apps/${project?.shareSlug ?? projectId}`
    : `https://buildforge.ai/apps/${project?.shareSlug ?? projectId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copied')
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Check out "${project?.name}" built with @BuildForgeAI — ${shareUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  const handleShareReddit = () => {
    const title = encodeURIComponent(`${project?.name} — built with BuildForge AI`)
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${title}`, '_blank')
  }

  const related = SEED_GALLERY_PROJECTS
    .filter(p => p.id !== projectId && p.tags?.some(t => project?.tags?.includes(t)))
    .slice(0, RELATED_COUNT)

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">App not found</p>
        <Button variant="outline" asChild><Link href="/apps"><ArrowLeft className="h-4 w-4 mr-2" />Back to Gallery</Link></Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
            <Link href="/apps" className="hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Gallery
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{project.name}</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{project.icon}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
                  {project.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-lg">{project.description}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Link href={`/users/${project.ownerName}`} className="hover:text-foreground">
                    @{project.ownerName}
                  </Link>
                  {project.framework && (
                    <>
                      <span>·</span>
                      <span className="capitalize">{project.framework}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{new Date(project.lastBuildAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleLike} className={liked ? 'text-red-500 border-red-500/30' : ''}>
                <Heart className={`h-4 w-4 mr-1.5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                {formatCount(likeCount)}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRemix}>
                <Repeat2 className="h-4 w-4 mr-1.5" /> Remix
              </Button>
              <Button size="sm" onClick={() => setShowPreview(true)}>
                <Play className="h-4 w-4 mr-1.5" /> Live Preview
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />{formatCount(likeCount)} likes</span>
            <span className="flex items-center gap-1.5"><Repeat2 className="h-4 w-4" />{formatCount(project.remixCount ?? 0)} remixes</span>
            <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{formatCount(viewCount)} views</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview */}
          <div className="rounded-xl border border-border/50 overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-violet-500/10 aspect-video flex items-center justify-center relative">
            {showPreview ? (
              <iframe
                src={`/preview/${project.id}`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title={project.name}
              />
            ) : (
              <div className="text-center">
                <span className="text-7xl block mb-4">{project.icon}</span>
                <Button onClick={() => setShowPreview(true)}>
                  <Play className="h-4 w-4 mr-2" /> Load Preview
                </Button>
              </div>
            )}
          </div>

          {/* Tech stack */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">Technology Stack</h2>
            <div className="flex flex-wrap gap-2">
              {project.agents.map(a => (
                <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
              ))}
              {project.framework && (
                <Badge variant="secondary" className="text-xs capitalize">{project.framework}</Badge>
              )}
            </div>
          </div>

          {/* Related apps */}
          {related.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">Apps You Can Remix</h2>
              <div className="grid grid-cols-2 gap-3">
                {related.map(r => (
                  <Link key={r.id} href={`/apps/${r.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/40 transition-colors">
                    <span className="text-2xl">{r.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Repeat2 className="h-2.5 w-2.5" />{r.remixCount} remixes
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Share */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Share
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleCopyLink}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy Link
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleShareTwitter}>
                  <Twitter className="h-3.5 w-3.5" /> Twitter
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleShareLinkedIn}>
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleShareReddit}>
                  <Globe className="h-3.5 w-3.5" /> Reddit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold mb-3">Actions</h3>
              <Button className="w-full gap-2" onClick={handleRemix}>
                <Repeat2 className="h-4 w-4" /> Remix Project
              </Button>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={`/dashboard/builder?template=${project.id}`}>
                  <Code2 className="h-4 w-4" /> Open in Builder
                </Link>
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowPreview(true)}>
                <ExternalLink className="h-4 w-4" /> View Live
              </Button>
            </CardContent>
          </Card>

          {/* Creator */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Creator</h3>
              <Link href={`/users/${project.ownerName}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {project.ownerName[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">@{project.ownerName}</p>
                  <p className="text-xs text-muted-foreground">View profile</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map(tag => (
                    <Link key={tag} href={`/apps?tag=${tag}`}>
                      <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-primary/10">{tag}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
