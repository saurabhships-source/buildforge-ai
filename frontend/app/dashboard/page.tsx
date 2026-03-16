'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard, Zap, TrendingUp, ArrowRight, FolderOpen, Clock,
  Activity, Users, BarChart3, Plus, Trash2, ExternalLink, X, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

const APP_TYPE_EMOJI: Record<string, string> = {
  website: '🌐', tool: '🔧', saas: '🚀', dashboard: '📊',
  ai_app: '🤖', crm: '👥', internal_tool: '⚙️',
}

const APP_TYPES = [
  { value: 'website', label: 'Website' },
  { value: 'tool', label: 'Tool' },
  { value: 'saas', label: 'SaaS App' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'ai_app', label: 'AI App' },
  { value: 'crm', label: 'CRM' },
  { value: 'internal_tool', label: 'Internal Tool' },
]

interface Project {
  id: string
  name: string
  appType: string
  updatedAt: string
  _count: { versions: number }
}

interface NewProjectModalProps {
  onClose: () => void
  onCreated: (project: Project) => void
}

function NewProjectModal({ onClose, onCreated }: NewProjectModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [appType, setAppType] = useState('website')
  const [mode, setMode] = useState<'blank' | 'ai'>('ai')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Enter a project name'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), appType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create project')
      toast.success('Project created')
      onCreated(data)
      if (mode === 'ai') {
        router.push(`/dashboard/builder?project=${data.id}`)
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">New Project</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My awesome app"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {APP_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setAppType(t.value)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                    appType === t.value
                      ? 'border-violet-500 bg-violet-500/10 text-violet-500'
                      : 'border-border bg-muted/30 text-muted-foreground hover:border-violet-500/40'
                  }`}
                >
                  <div className="text-base mb-0.5">{APP_TYPE_EMOJI[t.value]}</div>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start with</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('ai')}
                className={`rounded-lg border p-3 text-left transition-all ${
                  mode === 'ai' ? 'border-violet-500 bg-violet-500/10' : 'border-border hover:border-violet-500/40'
                }`}
              >
                <Zap className={`h-4 w-4 mb-1 ${mode === 'ai' ? 'text-violet-500' : 'text-muted-foreground'}`} />
                <div className="text-xs font-medium">AI Builder</div>
                <div className="text-[10px] text-muted-foreground">Generate with AI</div>
              </button>
              <button
                onClick={() => setMode('blank')}
                className={`rounded-lg border p-3 text-left transition-all ${
                  mode === 'blank' ? 'border-violet-500 bg-violet-500/10' : 'border-border hover:border-violet-500/40'
                }`}
              >
                <FolderOpen className={`h-4 w-4 mb-1 ${mode === 'blank' ? 'text-violet-500' : 'text-muted-foreground'}`} />
                <div className="text-xs font-medium">Blank Project</div>
                <div className="text-[10px] text-muted-foreground">Start from scratch</div>
              </button>
            </div>
          </div>

          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Plus className="h-4 w-4 mr-2" />Create Project</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProjects = () => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProjects(data.slice(0, 6)) })
      .catch(() => {})
      .finally(() => setLoadingProjects(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  const creditsTotal = user?.creditsTotal ?? 50
  const creditsRemaining = user?.creditsRemaining ?? 0
  const creditsUsed = creditsTotal - creditsRemaining
  const usagePercentage = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0

  return (
    <div className="space-y-8 p-6 overflow-auto h-full">
      {showNewModal && (
        <NewProjectModal
          onClose={() => setShowNewModal(false)}
          onCreated={p => setProjects(prev => [p, ...prev].slice(0, 6))}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name ?? 'there'}!</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user?.plan ?? 'free'}</div>
            <p className="text-xs text-muted-foreground">
              {user?.plan === 'enterprise' ? 'Unlimited features' : 'Upgrade for more'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsRemaining}</div>
            <p className="text-xs text-muted-foreground">
              of {creditsTotal === 9999 ? 'unlimited' : creditsTotal} credits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsUsed}</div>
            <p className="text-xs text-muted-foreground">this billing period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">AI projects created</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Credit usage */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage</CardTitle>
            <CardDescription>Your credit usage this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Credits used</span>
                <span className="font-medium">{usagePercentage.toFixed(0)}%</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{creditsUsed} used</span>
              <span>{creditsRemaining} remaining</span>
            </div>
            {user?.plan !== 'enterprise' && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/dashboard/billing">
                  Upgrade Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent projects with create + delete */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Your latest AI builds</CardDescription>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setShowNewModal(true)}>
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setShowNewModal(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Create your first project
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map(project => (
                  <Link
                    key={project.id}
                    href={`/dashboard/builder?project=${project.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:border-violet-500/30 hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{APP_TYPE_EMOJI[project.appType] ?? '📁'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project._count.versions} version{project._count.versions !== 1 ? 's' : ''} · {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="capitalize text-[10px] hidden sm:flex">
                        {project.appType.replace('_', ' ')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        onClick={e => handleDelete(project.id, project.name, e)}
                        disabled={deletingId === project.id}
                        title="Delete project"
                      >
                        {deletingId === project.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </Button>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
                {projects.length >= 6 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground mt-1" asChild>
                    <Link href="/dashboard/projects">View all projects →</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with AI tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/5"
              onClick={() => setShowNewModal(true)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                <Plus className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-left">
                <div className="font-medium">New Project</div>
                <div className="text-xs text-muted-foreground">Create a blank or AI project</div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/dashboard/builder">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="font-medium">AI Builder</div>
                  <div className="text-xs text-muted-foreground">Generate websites, tools & apps</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/dashboard/usage">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="font-medium">View Usage</div>
                  <div className="text-xs text-muted-foreground">Track your AI consumption</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/dashboard/billing">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="font-medium">Manage Billing</div>
                  <div className="text-xs text-muted-foreground">Upgrade or manage plan</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/dashboard/projects">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="font-medium">All Projects</div>
                  <div className="text-xs text-muted-foreground">Manage & evolve your builds</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/dashboard/analytics">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="font-medium">Analytics</div>
                  <div className="text-xs text-muted-foreground">Views, likes & engagement</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/dashboard/teams">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="font-medium">Teams</div>
                  <div className="text-xs text-muted-foreground">Collaborate with your team</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
