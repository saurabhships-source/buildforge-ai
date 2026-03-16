'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, FolderOpen, Trash2, ExternalLink, Github, Clock, Layers,
  Activity, GitFork, Pencil, Check, X, Loader2, Search, Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { safeFetch } from '@/lib/safe-fetch'

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
  description: string | null
  appType: string
  deployUrl: string | null
  githubRepo: string | null
  createdAt: string
  updatedAt: string
  _count: { versions: number }
  versions: { versionNum: number; prompt: string; agent: string; createdAt: string }[]
}

function NewProjectModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (project: Project) => void
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [appType, setAppType] = useState('website')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Enter a project name'); return }
    setLoading(true)
    try {
      const data = await safeFetch<Project & { error?: string }>('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, appType }),
      })
      if (!data) throw new Error('Failed to create project')
      if (data.error) throw new Error(String(data.error))
      // Normalize — API may not return _count or versions on create
      const normalized: Project = {
        ...data,
        _count: data._count ?? { versions: 0 },
        versions: data.versions ?? [],
      }
      toast.success('Project created')
      onCreated(normalized)
      onClose()
      router.push(`/dashboard/builder?project=${data.id}`)
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
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description <span className="opacity-50">(optional)</span></label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this project do?"
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
          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Plus className="h-4 w-4 mr-2" />Create & Open Builder</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [forkingId, setForkingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const data = await safeFetch<Project[] | { projects: Project[] }>('/api/projects')
      // Handle both array and { projects: [] } response shapes
      const list = Array.isArray(data)
        ? data
        : (data as { projects?: Project[] })?.projects ?? []
      setProjects(list)
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?\n\nAll generated versions and files will be permanently deleted. This cannot be undone.`)) return
    setDeletingId(id)
    // Optimistic remove
    setProjects(prev => prev.filter(p => p.id !== id))
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      toast.success('Project deleted')
    } catch {
      fetchProjects() // Rollback
      toast.error('Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  const startEdit = (project: Project) => {
    setEditingId(project.id)
    setEditName(project.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    const prev = projects.find(p => p.id === id)
    // Optimistic update
    setProjects(ps => ps.map(p => p.id === id ? { ...p, name: editName.trim() } : p))
    cancelEdit()
    try {
      const result = await safeFetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!result) throw new Error('Update failed')
      toast.success('Project renamed')
    } catch {
      if (prev) setProjects(ps => ps.map(p => p.id === id ? prev : p)) // Rollback
      toast.error('Failed to rename project')
    }
  }

  const handleFork = async (id: string, name: string) => {
    setForkingId(id)
    try {
      const data = await safeFetch<{ name: string; error?: string }>(`/api/projects/${id}/fork`, { method: 'POST' })
      if (!data) throw new Error('Fork failed')
      if (data.error) throw new Error(data.error)
      toast.success(`Forked as "${data.name}"`)
      fetchProjects()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fork project')
    } finally {
      setForkingId(null)
    }
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6 overflow-auto h-full">
      {showNewModal && (
        <NewProjectModal
          onClose={() => setShowNewModal(false)}
          onCreated={p => setProjects(prev => [p as Project, ...prev])}
        />
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">All your AI-generated applications</p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6">You don&apos;t have any projects yet. Create your first project.</p>
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first project
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground">No projects match &quot;{search}&quot;</p>
          <button onClick={() => setSearch('')} className="text-xs text-violet-500 hover:underline mt-2">Clear search</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(project => {
            const lastVersion = project.versions?.[0] ?? null
            const isEditing = editingId === project.id
            return (
              <Card key={project.id} className="border-border/50 hover:border-primary/30 transition-all group flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{APP_TYPE_EMOJI[project.appType] ?? '📁'}</span>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveEdit(project.id); if (e.key === 'Escape') cancelEdit() }}
                              className="h-7 text-sm"
                              autoFocus
                            />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-500" onClick={() => saveEdit(project.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <CardTitle className="text-base leading-tight truncate">{project.name}</CardTitle>
                        )}
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                          {project.appType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => startEdit(project)}
                          title="Rename"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleFork(project.id, project.name)}
                          disabled={forkingId === project.id}
                          title="Fork"
                        >
                          {forkingId === project.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <GitFork className="h-3.5 w-3.5" />
                          }
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(project.id, project.name)}
                          disabled={deletingId === project.id}
                          title="Delete"
                        >
                          {deletingId === project.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />
                          }
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  {/* Description or last prompt */}
                  {(project.description || lastVersion?.prompt) && (
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                      {project.description || lastVersion?.prompt}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Versions">
                      <Layers className="h-3 w-3" />
                      {project._count?.versions ?? 0} version{(project._count?.versions ?? 0) !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1" title="Created">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1" title="Last updated">
                      <Clock className="h-3 w-3" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <Button variant="default" size="sm" className="flex-1 h-8 text-xs" asChild>
                      <Link href={`/dashboard/builder?project=${project.id}`}>
                        Open
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Evolution Dashboard" asChild>
                      <Link href={`/dashboard/projects/${project.id}/evolution`}>
                        <Activity className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    {project.deployUrl && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View live site" asChild>
                        <a href={project.deployUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {project.githubRepo && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View on GitHub" asChild>
                        <a href={project.githubRepo} target="_blank" rel="noopener noreferrer">
                          <Github className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
