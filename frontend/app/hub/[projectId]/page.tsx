'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GitFork, Star, Zap, Clock, ArrowLeft, Play, RotateCcw, ExternalLink,
  FileCode, Activity, GitBranch, Rocket, ChevronRight, Users, Copy, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { repoService } from '@/lib/hub/repo-service'
import { replayToSnapshot } from '@/lib/build-graph/timeline'
import type { ProjectRepo, RepoVersion, Deployment } from '@/lib/hub/types'
import type { TimelineStep } from '@/lib/build-graph/types'
import { useAuth } from '@/lib/auth-context'

const SEED_PROJECTS: Record<string, { name: string; description: string; icon: string; agents: string[]; healthScore: number; forkCount: number; starCount: number; framework: string; appType: string; ownerName: string; isTemplate: boolean; templateCategory: string }> = {
  'seed-1': { name: 'AI Resume Builder', description: 'Generate professional resumes with AI in seconds', icon: '📄', agents: ['PlannerAgent', 'BuilderAgent', 'DesignSystemAgent'], healthScore: 92, forkCount: 47, starCount: 128, framework: 'react', appType: 'tool', ownerName: 'buildforge', isTemplate: true, templateCategory: 'ai_tool' },
  'seed-2': { name: 'Fitness Booking SaaS', description: 'Full-stack SaaS for gym class bookings with Stripe', icon: '💪', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent', 'DatabaseAgent'], healthScore: 88, forkCount: 31, starCount: 95, framework: 'nextjs', appType: 'saas', ownerName: 'buildforge', isTemplate: true, templateCategory: 'saas' },
  'seed-3': { name: 'AI CRM Dashboard', description: 'Customer relationship management with AI insights', icon: '👥', agents: ['PlannerAgent', 'BuilderAgent', 'OptimizerAgent'], healthScore: 85, forkCount: 22, starCount: 74, framework: 'react', appType: 'crm', ownerName: 'buildforge', isTemplate: true, templateCategory: 'dashboard' },
  'seed-4': { name: 'AI Course Platform', description: 'Online learning platform with AI-generated curriculum', icon: '🎓', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent', 'DebuggerAgent'], healthScore: 90, forkCount: 38, starCount: 112, framework: 'nextjs', appType: 'saas', ownerName: 'buildforge', isTemplate: true, templateCategory: 'saas' },
  'seed-5': { name: 'SaaS Landing Page', description: 'High-converting landing page with pricing and testimonials', icon: '🚀', agents: ['BuilderAgent', 'DesignSystemAgent', 'SEOAgent'], healthScore: 95, forkCount: 89, starCount: 203, framework: 'html', appType: 'website', ownerName: 'buildforge', isTemplate: true, templateCategory: 'landing' },
  'seed-6': { name: 'NFT Marketplace', description: 'Web3 NFT marketplace with wallet connect', icon: '🎨', agents: ['PlannerAgent', 'BuilderAgent', 'SecurityAgent'], healthScore: 82, forkCount: 15, starCount: 61, framework: 'react', appType: 'tool', ownerName: 'buildforge', isTemplate: true, templateCategory: 'marketplace' },
  'seed-7': { name: 'Analytics Dashboard', description: 'Real-time analytics with charts and KPI tracking', icon: '📊', agents: ['PlannerAgent', 'BuilderAgent', 'OptimizerAgent'], healthScore: 91, forkCount: 44, starCount: 137, framework: 'react', appType: 'dashboard', ownerName: 'buildforge', isTemplate: true, templateCategory: 'dashboard' },
  'seed-8': { name: 'AI Chat App', description: 'Real-time chat with AI assistant integration', icon: '💬', agents: ['PlannerAgent', 'BuilderAgent', 'ApiAgent'], healthScore: 87, forkCount: 56, starCount: 189, framework: 'nextjs', appType: 'ai_app', ownerName: 'buildforge', isTemplate: true, templateCategory: 'ai_tool' },
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums">{score}</span>
    </div>
  )
}

function TimelineStepRow({ step, onRestore }: { step: TimelineStep; onRestore: (step: TimelineStep) => void }) {
  const statusColor = step.status === 'completed' ? 'text-green-500' : step.status === 'failed' ? 'text-red-500' : 'text-muted-foreground'
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0 group">
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <div className={`h-2 w-2 rounded-full ${step.status === 'completed' ? 'bg-green-500' : step.status === 'failed' ? 'bg-red-500' : 'bg-muted-foreground'}`} />
        <div className="w-px flex-1 bg-border/50 min-h-[12px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">{step.agent}</span>
          <span className="text-xs text-muted-foreground">→ {step.action}</span>
          <span className={`text-[10px] ${statusColor}`}>{step.status}</span>
          {step.durationMs > 0 && (
            <span className="text-[10px] text-muted-foreground ml-auto">{(step.durationMs / 1000).toFixed(1)}s</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{step.description}</p>
        {step.filesAdded.length + step.filesChanged.length > 0 && (
          <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
            {step.filesAdded.length > 0 && <span className="text-green-600">+{step.filesAdded.length} added</span>}
            {step.filesChanged.length > 0 && <span className="text-blue-600">~{step.filesChanged.length} modified</span>}
            {step.filesDeleted.length > 0 && <span className="text-red-600">-{step.filesDeleted.length} deleted</span>}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
        onClick={() => onRestore(step)}
        title="Restore to this step"
      >
        <RotateCcw className="h-3 w-3" />
      </Button>
    </div>
  )
}

export default function ProjectRepoPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [repo, setRepo] = useState<ProjectRepo | null>(null)
  const [seedData, setSeedData] = useState<typeof SEED_PROJECTS[string] | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('files')

  useEffect(() => {
    // Try user repo first
    const userRepo = repoService.loadRepo(projectId)
    if (userRepo) { setRepo(userRepo); return }
    // Fall back to seed data
    const seed = SEED_PROJECTS[projectId]
    if (seed) setSeedData(seed)
  }, [projectId])

  const handleFork = useCallback(async () => {
    if (!user) { toast.error('Sign in to fork'); return }
    if (repo) {
      const forked = repoService.forkRepo(repo.id, { ownerId: user.id, ownerName: user.name ?? 'me' })
      if (forked) { toast.success('Forked — opening in builder'); router.push(`/dashboard/builder?hub=${forked.id}`) }
    } else if (seedData) {
      toast.success(`Opening "${seedData.name}" as template`)
      router.push(`/dashboard/builder?template=${projectId}`)
    }
  }, [user, repo, seedData, projectId, router])

  const handleOpenInBuilder = useCallback(() => {
    if (repo) router.push(`/dashboard/builder?hub=${repo.id}`)
    else if (seedData) router.push(`/dashboard/builder?template=${projectId}`)
  }, [repo, seedData, projectId, router])

  const handleRestoreStep = useCallback((step: TimelineStep) => {
    if (!repo) return
    const run = repo.buildRuns.find(r => r.steps.some(s => s.id === step.id))
    if (!run) { toast.error('Build run not found'); return }
    const files = replayToSnapshot(run, step.snapshotId)
    // Store in localStorage for builder to pick up
    try {
      localStorage.setItem('buildforge_hub_restore', JSON.stringify({ files, stepId: step.id, repoId: repo.id }))
      toast.success(`Restoring to Step ${step.stepNum} — opening builder`)
      router.push(`/dashboard/builder?hub=${repo.id}&restore=${step.snapshotId}`)
    } catch { toast.error('Restore failed') }
  }, [repo, router])

  const handleCopyId = () => {
    navigator.clipboard.writeText(projectId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const name = repo?.name ?? seedData?.name ?? 'Project'
  const description = repo?.description ?? seedData?.description ?? ''
  const icon = seedData?.icon ?? '📁'
  const agents = repo?.agents ?? seedData?.agents ?? []
  const healthScore = repo?.healthScore ?? seedData?.healthScore ?? 0
  const forkCount = repo?.forkCount ?? seedData?.forkCount ?? 0
  const starCount = repo?.starCount ?? seedData?.starCount ?? 0
  const framework = repo?.framework ?? seedData?.framework ?? 'html'
  const isTemplate = repo?.isTemplate ?? seedData?.isTemplate ?? false
  const files = repo?.files ?? {}
  const versions: RepoVersion[] = repo?.versions ?? []
  const deployments: Deployment[] = repo?.deployments ?? []
  const allSteps = repo?.buildRuns.flatMap(r => r.steps) ?? []

  if (!repo && !seedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" asChild><Link href="/hub"><ArrowLeft className="h-4 w-4 mr-2" />Back to Hub</Link></Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/hub" className="hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Hub
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{name}</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{icon}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{name}</h1>
                  {isTemplate && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Template</Badge>}
                  <Badge variant="outline" className="text-xs">{framework}</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">{description}</p>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{repo?.ownerName ?? seedData?.ownerName}</span>
                  <span className="mx-1">·</span>
                  <button onClick={handleCopyId} className="flex items-center gap-1 hover:text-foreground">
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    <span className="font-mono">{projectId.slice(0, 12)}…</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleFork}>
                <GitFork className="h-4 w-4 mr-2" /> Fork
              </Button>
              <Button size="sm" onClick={handleOpenInBuilder}>
                <Play className="h-4 w-4 mr-2" /> Open in Builder
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-5 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="h-4 w-4" /><span>{starCount} stars</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <GitFork className="h-4 w-4" /><span>{forkCount} forks</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" /><span>Health {healthScore}</span>
            </div>
            {repo?.lastBuildAt && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" /><span>Built {new Date(repo.lastBuildAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Health bar */}
          <div className="mt-4 max-w-xs">
            <HealthBar score={healthScore} />
          </div>

          {/* Agents */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {agents.map(a => (
              <Badge key={a} variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />{a}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="files"><FileCode className="h-3.5 w-3.5 mr-1.5" />Files ({Object.keys(files).length})</TabsTrigger>
            <TabsTrigger value="timeline"><Activity className="h-3.5 w-3.5 mr-1.5" />Timeline ({allSteps.length})</TabsTrigger>
            <TabsTrigger value="versions"><GitBranch className="h-3.5 w-3.5 mr-1.5" />Versions ({versions.length})</TabsTrigger>
            <TabsTrigger value="deployments"><Rocket className="h-3.5 w-3.5 mr-1.5" />Deployments ({deployments.length})</TabsTrigger>
          </TabsList>

          {/* Files Tab */}
          <TabsContent value="files">
            {Object.keys(files).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileCode className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No files — open in builder to generate</p>
                <Button className="mt-4" size="sm" onClick={handleOpenInBuilder}>Open in Builder</Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {Object.entries(files).map(([path, content]) => (
                  <Card key={path} className="border-border/40">
                    <CardContent className="py-2 px-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-mono truncate">{path}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {content.split('\n').length} lines
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            {allSteps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No build timeline — run a build graph to record steps</p>
              </div>
            ) : (
              <Card className="border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Build Timeline
                    <Badge variant="secondary" className="text-xs ml-auto">{allSteps.length} steps</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {allSteps.map(step => (
                    <TimelineStepRow key={step.id} step={step} onRestore={handleRestoreStep} />
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions">
            {versions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No versions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((v, i) => (
                  <Card key={v.id} className="border-border/40">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">v{v.versionNum}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{v.prompt}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span>{v.agent}Agent</span>
                          <span>·</span>
                          <span>{new Date(v.createdAt).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>{Object.keys(v.files).length} files</span>
                        </div>
                      </div>
                      {i === 0 && <Badge variant="outline" className="text-[10px] shrink-0">Latest</Badge>}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() => {
                          if (repo) {
                            localStorage.setItem('buildforge_hub_restore', JSON.stringify({ files: v.files, repoId: repo.id }))
                            router.push(`/dashboard/builder?hub=${repo.id}`)
                          }
                        }}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Restore
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Deployments Tab */}
          <TabsContent value="deployments">
            {deployments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Rocket className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No deployments yet</p>
                <Button className="mt-4" size="sm" onClick={handleOpenInBuilder}>Deploy from Builder</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {deployments.map(d => (
                  <Card key={d.id} className="border-border/40">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${d.status === 'live' ? 'bg-green-500' : d.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium capitalize">{d.provider}</span>
                          <Badge variant="outline" className={`text-[10px] h-4 ${d.status === 'live' ? 'text-green-600' : ''}`}>{d.status}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(d.deployedAt).toLocaleString()}</p>
                      </div>
                      {d.url && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" asChild>
                          <a href={d.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> Visit
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
