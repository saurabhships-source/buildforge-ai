// Feature 9 — Version Control Service
// Git-style version history for project files

const STORAGE_KEY = 'buildforge_versions'
const MAX_VERSIONS_PER_PROJECT = 50

export interface FileSnapshot {
  path: string
  content: string
  hash: string
}

export interface VersionCommit {
  id: string
  projectId: string
  versionNum: number
  message: string
  author: string
  timestamp: string
  files: FileSnapshot[]
  parentId: string | null
  tags: string[]
  stats: {
    filesChanged: number
    additions: number
    deletions: number
  }
}

export interface VersionDiff {
  path: string
  type: 'added' | 'modified' | 'deleted'
  oldContent?: string
  newContent?: string
}

function hashContent(content: string): string {
  // Simple djb2 hash — good enough for change detection
  let hash = 5381
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) ^ content.charCodeAt(i)
  }
  return (hash >>> 0).toString(16)
}

function loadAll(): VersionCommit[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as VersionCommit[]) : []
  } catch { return [] }
}

function saveAll(commits: VersionCommit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(commits))
  } catch { /* quota */ }
}

export const versionControl = {
  /** Create a new version snapshot */
  commit(
    projectId: string,
    files: Record<string, string>,
    message: string,
    author = 'user',
    tags: string[] = [],
  ): VersionCommit {
    const all = loadAll()
    const projectVersions = all.filter(c => c.projectId === projectId)
    const latest = projectVersions[0] ?? null
    const versionNum = (latest?.versionNum ?? 0) + 1

    const snapshots: FileSnapshot[] = Object.entries(files).map(([path, content]) => ({
      path,
      content,
      hash: hashContent(content),
    }))

    // Compute diff stats vs parent
    const parentFiles = latest
      ? Object.fromEntries(latest.files.map(f => [f.path, f.hash]))
      : {}
    const currentPaths = new Set(Object.keys(files))
    const parentPaths = new Set(Object.keys(parentFiles))

    let additions = 0
    let deletions = 0
    let filesChanged = 0

    for (const path of currentPaths) {
      if (!parentPaths.has(path)) { additions++; filesChanged++ }
      else if (parentFiles[path] !== hashContent(files[path])) { additions++; deletions++; filesChanged++ }
    }
    for (const path of parentPaths) {
      if (!currentPaths.has(path)) { deletions++; filesChanged++ }
    }

    const commit: VersionCommit = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId,
      versionNum,
      message,
      author,
      timestamp: new Date().toISOString(),
      files: snapshots,
      parentId: latest?.id ?? null,
      tags,
      stats: { filesChanged, additions, deletions },
    }

    // Prepend and trim to max
    const updated = [commit, ...all].slice(0, MAX_VERSIONS_PER_PROJECT * 10)
    saveAll(updated)
    return commit
  },

  /** Get all versions for a project, newest first */
  getHistory(projectId: string): VersionCommit[] {
    return loadAll()
      .filter(c => c.projectId === projectId)
      .sort((a, b) => b.versionNum - a.versionNum)
  },

  /** Get a specific version */
  getVersion(commitId: string): VersionCommit | null {
    return loadAll().find(c => c.id === commitId) ?? null
  },

  /** Restore files from a version */
  restore(commitId: string): Record<string, string> | null {
    const commit = this.getVersion(commitId)
    if (!commit) return null
    return Object.fromEntries(commit.files.map(f => [f.path, f.content]))
  },

  /** Compute diff between two versions */
  diff(fromId: string, toId: string): VersionDiff[] {
    const from = this.getVersion(fromId)
    const to = this.getVersion(toId)
    if (!from || !to) return []

    const fromMap = Object.fromEntries(from.files.map(f => [f.path, f]))
    const toMap = Object.fromEntries(to.files.map(f => [f.path, f]))
    const diffs: VersionDiff[] = []

    for (const path of new Set([...Object.keys(fromMap), ...Object.keys(toMap)])) {
      if (!fromMap[path]) {
        diffs.push({ path, type: 'added', newContent: toMap[path].content })
      } else if (!toMap[path]) {
        diffs.push({ path, type: 'deleted', oldContent: fromMap[path].content })
      } else if (fromMap[path].hash !== toMap[path].hash) {
        diffs.push({ path, type: 'modified', oldContent: fromMap[path].content, newContent: toMap[path].content })
      }
    }

    return diffs
  },

  /** Tag a version */
  tag(commitId: string, tag: string): void {
    const all = loadAll()
    const idx = all.findIndex(c => c.id === commitId)
    if (idx < 0) return
    if (!all[idx].tags.includes(tag)) all[idx].tags.push(tag)
    saveAll(all)
  },

  /** Delete all versions for a project */
  clearProject(projectId: string): void {
    saveAll(loadAll().filter(c => c.projectId !== projectId))
  },

  /** Get latest version for a project */
  getLatest(projectId: string): VersionCommit | null {
    return this.getHistory(projectId)[0] ?? null
  },
}
