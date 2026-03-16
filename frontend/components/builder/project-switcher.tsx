'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, Plus, FolderOpen, Search, Loader2, Check, X, Pencil, Trash2, LayoutGrid, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  appType: string
  updatedAt: string
  lastOpenedAt?: string
  _count: { versions: number }
}

interface Props {
  currentProjectId: string | null
  currentProjectName: string
  onProjectChange: (projectId: string, projectName: string) => void
  onProjectNameChange?: (name: string) => void
}

export function ProjectSwitcher({ currentProjectId, currentProjectName, onProjectChange, onProjectNameChange }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAppType, setNewAppType] = useState('website')
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowNewForm(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const [projData, recentData] = await Promise.all([
        safeFetch<Project[] | { projects: Project[] }>('/api/projects'),
        safeFetch<Project[]>('/api/projects/recent'),
      ])
      // Handle both array and { projects: [] } response shapes
      const projList = Array.isArray(projData)
        ? projData
        : (projData as { projects?: Project[] })?.projects ?? []
      setProjects(projList)
      if (Array.isArray(recentData)) setRecentProjects(recentData)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  // Load projects on mount so the list is ready before first open
  useEffect(() => { fetchProjects() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = () => {
    setOpen(v => !v)
    if (!open) fetchProjects() // Refresh list each time dropdown opens
  }

  const handleSelect = (project: Project) => {
    setOpen(false)
    setSearch('')
    onProjectChange(project.id, project.name)
    router.push(`/dashboard/builder?project=${project.id}`)
    // Track as recently opened
    fetch(`/api/projects/${project.id}/open`, { method: 'POST' }).catch(() => {})
  }

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Enter a project name'); return }
    setCreating(true)
    try {
      const data = await safeFetch<Project & { error?: string }>('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), appType: newAppType }),
      })
      if (!data) throw new Error('Failed to create project')
      if (data.error) throw new Error(String(data.error))
      toast.success('Project created')
      // Ensure _count exists for the row renderer
      const newProject: Project = { ...data, _count: data._count ?? { versions: 0 } }
      setProjects(prev => [newProject, ...prev])
      setShowNewForm(false)
      setNewName('')
      setOpen(false)
      onProjectChange(data.id, data.name)
      router.push(`/dashboard/builder?project=${data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleRename = async (id: string) => {
    if (!renameName.trim()) return
    const prev = projects.find(p => p.id === id)
    // Optimistic update
    setProjects(ps => ps.map(p => p.id === id ? { ...p, name: renameName.trim() } : p))
    if (id === currentProjectId) onProjectNameChange?.(renameName.trim())
    setRenamingId(null)
    try {
      const result = await safeFetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameName.trim() }),
      })
      if (!result) throw new Error('Rename failed')
      toast.success('Renamed')
    } catch {
      // Rollback
      if (prev) {
        setProjects(ps => ps.map(p => p.id === id ? prev : p))
        if (id === currentProjectId) onProjectNameChange?.(prev.name)
      }
      toast.error('Failed to rename')
    }
  }

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    // Optimistic remove
    setProjects(ps => ps.filter(p => p.id !== id))
    setRecentProjects(ps => ps.filter(p => p.id !== id))
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      toast.success('Project deleted')
      if (id === currentProjectId) router.push('/dashboard')
    } catch {
      fetchProjects() // Rollback by refetching
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // IDs of recent projects to avoid duplication in all-projects list
  const recentIds = new Set(recentProjects.map(r => r.id))
  const filteredAll = filtered.filter(p => !recentIds.has(p.id) || search.trim() !== '')

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors max-w-[180px] group"
      >
        <span className="text-sm font-semibold truncate">{currentProjectName || 'Untitled Project'}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="h-8 pl-8 text-xs"
                autoFocus
              />
            </div>
          </div>

          {/* Project list */}
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Recent Projects section */}
                {!search && recentProjects.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                      <Clock className="h-3 w-3" />
                      Recent
                    </div>
                    {recentProjects.slice(0, 5).map(project => (
                      <ProjectRow
                        key={`recent-${project.id}`}
                        project={project}
                        isCurrent={project.id === currentProjectId}
                        isRenaming={renamingId === project.id}
                        renameName={renameName}
                        deletingId={deletingId}
                        onSelect={handleSelect}
                        onRenameStart={(p) => { setRenamingId(p.id); setRenameName(p.name) }}
                        onRenameChange={setRenameName}
                        onRenameConfirm={handleRename}
                        onRenameCancel={() => setRenamingId(null)}
                        onDelete={handleDelete}
                      />
                    ))}
                    {filteredAll.length > 0 && (
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                        All Projects
                      </div>
                    )}
                  </div>
                )}

                {/* All projects (excluding recents when not searching) */}
                {(search ? filtered : filteredAll).length === 0 && recentProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center px-4">
                    <FolderOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {search ? 'No projects match your search' : 'No projects yet'}
                    </p>
                  </div>
                ) : (
                  (search ? filtered : filteredAll).map(project => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      isCurrent={project.id === currentProjectId}
                      isRenaming={renamingId === project.id}
                      renameName={renameName}
                      deletingId={deletingId}
                      onSelect={handleSelect}
                      onRenameStart={(p) => { setRenamingId(p.id); setRenameName(p.name) }}
                      onRenameChange={setRenameName}
                      onRenameConfirm={handleRename}
                      onRenameCancel={() => setRenamingId(null)}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-border/50 p-2 space-y-1">
            {showNewForm ? (
              <div className="space-y-2 p-1">
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNewForm(false) }}
                  placeholder="Project name"
                  className="h-7 text-xs"
                  autoFocus
                />
                <div className="grid grid-cols-4 gap-1">
                  {APP_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setNewAppType(t.value)}
                      className={`rounded-md border px-1 py-1 text-[10px] transition-all ${
                        newAppType === t.value
                          ? 'border-violet-500 bg-violet-500/10 text-violet-500'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-violet-500/40'
                      }`}
                    >
                      <div className="text-sm">{APP_TYPE_EMOJI[t.value]}</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleCreate} disabled={creating}>
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Project
                </button>
                <button
                  onClick={() => { setOpen(false); router.push('/dashboard/projects') }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  View All Projects
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Extracted row to avoid duplication between recent + all sections
function ProjectRow({
  project, isCurrent, isRenaming, renameName, deletingId,
  onSelect, onRenameStart, onRenameChange, onRenameConfirm, onRenameCancel, onDelete,
}: {
  project: Project
  isCurrent: boolean
  isRenaming: boolean
  renameName: string
  deletingId: string | null
  onSelect: (p: Project) => void
  onRenameStart: (p: Project) => void
  onRenameChange: (v: string) => void
  onRenameConfirm: (id: string) => void
  onRenameCancel: () => void
  onDelete: (id: string, name: string, e: React.MouseEvent) => void
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 hover:bg-muted/40 cursor-pointer group/item transition-colors ${isCurrent ? 'bg-violet-500/5' : ''}`}
      onClick={() => !isRenaming && onSelect(project)}
    >
      <span className="text-base shrink-0">{APP_TYPE_EMOJI[project.appType] ?? '📁'}</span>
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Input
              value={renameName}
              onChange={e => onRenameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onRenameConfirm(project.id)
                if (e.key === 'Escape') onRenameCancel()
              }}
              className="h-6 text-xs py-0"
              autoFocus
            />
            <button onClick={() => onRenameConfirm(project.id)} className="text-green-500 hover:text-green-400">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={onRenameCancel} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium truncate">{project.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {project._count?.versions ?? 0} version{(project._count?.versions ?? 0) !== 1 ? 's' : ''} · {new Date(project.updatedAt).toLocaleDateString()}
            </p>
          </>
        )}
      </div>
      {isCurrent && !isRenaming && <Check className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
      {!isRenaming && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={() => onRenameStart(project)}
            title="Rename"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
            onClick={e => onDelete(project.id, project.name, e)}
            disabled={deletingId === project.id}
            title="Delete"
          >
            {deletingId === project.id
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Trash2 className="h-3 w-3" />
            }
          </button>
        </div>
      )}
    </div>
  )
}
