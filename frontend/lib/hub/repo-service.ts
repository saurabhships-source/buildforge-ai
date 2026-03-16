// AI Project Hub — Repository Service
// Manages ProjectRepo records in localStorage (client) and syncs with DB via API.
// All build graph runs and timeline steps update the repo automatically.

import type { ProjectRepo, RepoVersion, PromptHistory, Deployment, FrameworkType } from './types'
import type { BuildRun } from '@/lib/build-graph/types'
import type { SaaSArchitectureSpec } from '@/lib/templates/types'

const STORAGE_KEY = 'buildforge_hub_repos'
const MAX_REPOS = 50

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadAll(): ProjectRepo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProjectRepo[]) : []
  } catch { return [] }
}

function saveAll(repos: ProjectRepo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repos.slice(0, MAX_REPOS)))
  } catch { /* quota */ }
}

function generateId(): string {
  return `repo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function detectFramework(files: Record<string, string>): FrameworkType {
  const keys = Object.keys(files).join(' ')
  if (keys.includes('next.config') || keys.includes('app/page.tsx')) return 'nextjs'
  if (keys.includes('.tsx') || keys.includes('.jsx')) return 'react'
  if (keys.includes('.vue')) return 'vue'
  if (keys.includes('.svelte')) return 'svelte'
  if (keys.includes('index.html')) return 'html'
  return 'other'
}

function extractAgents(buildRuns: BuildRun[]): string[] {
  const agents = new Set<string>()
  for (const run of buildRuns) {
    for (const step of run.steps) {
      if (step.agent && step.status === 'completed') agents.add(step.agent)
    }
  }
  return Array.from(agents)
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const repoService = {
  /** Create a new repo from generated files */
  createRepo(opts: {
    name: string
    description?: string
    ownerId: string
    ownerName: string
    appType: string
    files: Record<string, string>
    prompt: string
    agent: string
    buildRun?: BuildRun
    projectId?: string
    templateId?: string
    modules?: string[]
    architectureSpec?: SaaSArchitectureSpec
  }): ProjectRepo {
    const repos = loadAll()
    const id = opts.projectId ?? generateId()
    const now = new Date().toISOString()

    const version: RepoVersion = {
      id: `v-${Date.now()}`,
      versionNum: 1,
      prompt: opts.prompt,
      agent: opts.agent,
      snapshotId: opts.buildRun?.steps[opts.buildRun.steps.length - 1]?.snapshotId ?? '',
      files: opts.files,
      createdAt: now,
      buildRunId: opts.buildRun?.buildId,
    }

    const promptEntry: PromptHistory = {
      id: `ph-${Date.now()}`,
      prompt: opts.prompt,
      agent: opts.agent,
      timestamp: now,
      versionId: version.id,
      filesChanged: Object.keys(opts.files).length,
    }

    const repo: ProjectRepo = {
      id,
      name: opts.name,
      description: opts.description ?? opts.prompt.slice(0, 120),
      ownerId: opts.ownerId,
      ownerName: opts.ownerName,
      appType: opts.appType,
      framework: detectFramework(opts.files),
      visibility: 'private',
      isTemplate: false,
      files: opts.files,
      agents: opts.agent ? [opts.agent] : [],
      buildRuns: opts.buildRun ? [opts.buildRun] : [],
      versions: [version],
      prompts: [promptEntry],
      deployments: [],
      forkCount: 0,
      starCount: 0,
      healthScore: 0,
      viewCount: 0,
      likeCount: 0,
      remixCount: 0,
      tags: [],
      templateId: opts.templateId,
      templateModules: opts.modules,
      architectureSpec: opts.architectureSpec,
      createdAt: now,
      updatedAt: now,
      lastBuildAt: now,
    }

    // Replace if same id exists, otherwise prepend
    const existing = repos.findIndex(r => r.id === id)
    if (existing >= 0) repos[existing] = repo
    else repos.unshift(repo)
    saveAll(repos)
    return repo
  },

  /** Load a single repo by id */
  loadRepo(id: string): ProjectRepo | null {
    return loadAll().find(r => r.id === id) ?? null
  },

  /** List all repos for a user */
  listRepos(ownerId?: string): ProjectRepo[] {
    const all = loadAll()
    return ownerId ? all.filter(r => r.ownerId === ownerId) : all
  },

  /** Update files + add a new version + update prompt history */
  updateRepo(id: string, opts: {
    files: Record<string, string>
    prompt: string
    agent: string
    buildRun?: BuildRun
    templateId?: string
    architectureSpec?: SaaSArchitectureSpec
    modules?: string[]
  }): ProjectRepo | null {
    const repos = loadAll()
    const idx = repos.findIndex(r => r.id === id)
    if (idx < 0) return null

    const repo = repos[idx]
    const now = new Date().toISOString()
    const versionNum = (repo.versions[repo.versions.length - 1]?.versionNum ?? 0) + 1

    const version: RepoVersion = {
      id: `v-${Date.now()}`,
      versionNum,
      prompt: opts.prompt,
      agent: opts.agent,
      snapshotId: opts.buildRun?.steps[opts.buildRun.steps.length - 1]?.snapshotId ?? '',
      files: opts.files,
      createdAt: now,
      buildRunId: opts.buildRun?.buildId,
    }

    const promptEntry: PromptHistory = {
      id: `ph-${Date.now()}`,
      prompt: opts.prompt,
      agent: opts.agent,
      timestamp: now,
      versionId: version.id,
      filesChanged: Object.keys(opts.files).length,
    }

    repo.files = opts.files
    repo.versions = [...repo.versions.slice(-19), version]  // keep last 20
    repo.prompts = [...repo.prompts.slice(-49), promptEntry] // keep last 50
    if (opts.buildRun) {
      repo.buildRuns = [...repo.buildRuns.slice(-9), opts.buildRun] // keep last 10
      repo.agents = extractAgents(repo.buildRuns)
    }
    if (opts.agent && !repo.agents.includes(opts.agent)) repo.agents.push(opts.agent)
    if (opts.templateId) repo.templateId = opts.templateId
    if (opts.architectureSpec) repo.architectureSpec = opts.architectureSpec
    if (opts.modules) repo.templateModules = opts.modules
    repo.framework = detectFramework(opts.files)
    repo.updatedAt = now
    repo.lastBuildAt = now

    repos[idx] = repo
    saveAll(repos)
    return repo
  },

  /** Fork a repo — creates a new repo copying all metadata */
  forkRepo(sourceId: string, opts: {
    ownerId: string
    ownerName: string
    newName?: string
    fromVersionId?: string
  }): ProjectRepo | null {
    const source = this.loadRepo(sourceId)
    if (!source) return null

    const now = new Date().toISOString()
    const id = generateId()

    // If forking from a specific version, use that version's files
    const targetVersion = opts.fromVersionId
      ? source.versions.find(v => v.id === opts.fromVersionId)
      : source.versions[source.versions.length - 1]

    const files = targetVersion?.files ?? source.files

    const repo: ProjectRepo = {
      ...source,
      id,
      name: opts.newName ?? `${source.name} (remix)`,
      ownerId: opts.ownerId,
      ownerName: opts.ownerName,
      visibility: 'private',
      isTemplate: false,
      files,
      versions: targetVersion ? [{ ...targetVersion, id: `v-${Date.now()}`, versionNum: 1, createdAt: now }] : [],
      prompts: [],
      deployments: [],
      buildRuns: [],
      forkCount: 0,
      starCount: 0,
      viewCount: 0,
      likeCount: 0,
      remixCount: 0,
      tags: source.tags ?? [],
      forkedFromId: source.id,
      forkedFromName: source.name,
      createdAt: now,
      updatedAt: now,
      lastBuildAt: now,
    }

    // Increment source fork + remix count
    const repos = loadAll()
    const srcIdx = repos.findIndex(r => r.id === sourceId)
    if (srcIdx >= 0) {
      repos[srcIdx].forkCount++
      repos[srcIdx].remixCount = (repos[srcIdx].remixCount ?? 0) + 1
    }
    repos.unshift(repo)
    saveAll(repos)
    return repo
  },

  /** Delete a repo */
  deleteRepo(id: string): void {
    saveAll(loadAll().filter(r => r.id !== id))
  },

  /** Add a deployment record */
  addDeployment(repoId: string, deployment: Omit<Deployment, 'id'>): void {
    const repos = loadAll()
    const idx = repos.findIndex(r => r.id === repoId)
    if (idx < 0) return
    repos[idx].deployments = [
      { ...deployment, id: `dep-${Date.now()}` },
      ...repos[idx].deployments.slice(0, 9),
    ]
    repos[idx].updatedAt = new Date().toISOString()
    saveAll(repos)
  },

  /** Update health score */
  updateHealthScore(repoId: string, score: number): void {
    const repos = loadAll()
    const idx = repos.findIndex(r => r.id === repoId)
    if (idx < 0) return
    repos[idx].healthScore = score
    saveAll(repos)
  },

  /** Mark as template */
  setTemplate(repoId: string, isTemplate: boolean, category?: string): void {
    const repos = loadAll()
    const idx = repos.findIndex(r => r.id === repoId)
    if (idx < 0) return
    repos[idx].isTemplate = isTemplate
    if (category) repos[idx].templateCategory = category as ProjectRepo['templateCategory']
    repos[idx].visibility = isTemplate ? 'template' : 'private'
    saveAll(repos)
  },

  /** Get all public/template repos (community feed) */
  getPublicRepos(): ProjectRepo[] {
    return loadAll().filter(r => r.visibility === 'public' || r.visibility === 'template')
  },

  /** Get all templates */
  getTemplates(): ProjectRepo[] {
    return loadAll().filter(r => r.isTemplate)
  },

  /** Publish a repo to the gallery */
  publishRepo(repoId: string, opts: { tags?: string[]; previewHtml?: string } = {}): ProjectRepo | null {
    const repos = loadAll()
    const idx = repos.findIndex(r => r.id === repoId)
    if (idx < 0) return null
    repos[idx].visibility = 'public'
    if (opts.tags) repos[idx].tags = opts.tags
    if (opts.previewHtml) repos[idx].previewHtml = opts.previewHtml
    // Generate share slug from name
    repos[idx].shareSlug = repos[idx].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    repos[idx].updatedAt = new Date().toISOString()
    saveAll(repos)
    return repos[idx]
  },

  /** Increment view count */
  incrementViews(repoId: string): void {
    const repos = loadAll()
    const idx = repos.findIndex(r => r.id === repoId)
    if (idx < 0) return
    repos[idx].viewCount = (repos[idx].viewCount ?? 0) + 1
    saveAll(repos)
  },

  /** Toggle like */
  toggleLike(repoId: string): boolean {
    const repos = loadAll()
    const idx = repos.findIndex(r => r.id === repoId)
    if (idx < 0) return false
    const likedKey = `liked_${repoId}`
    const alreadyLiked = localStorage.getItem(likedKey) === '1'
    if (alreadyLiked) {
      repos[idx].likeCount = Math.max(0, (repos[idx].likeCount ?? 0) - 1)
      localStorage.removeItem(likedKey)
    } else {
      repos[idx].likeCount = (repos[idx].likeCount ?? 0) + 1
      localStorage.setItem(likedKey, '1')
    }
    saveAll(repos)
    return !alreadyLiked
  },

  /** Check if user liked a repo */
  isLiked(repoId: string): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(`liked_${repoId}`) === '1'
  },
}
