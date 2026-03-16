/**
 * Project Storage — stores generated SaaS project files and metadata.
 * Uses localStorage for client-side (same pattern as version-control.ts)
 * with a server-side in-memory store for API routes.
 */

import { logger } from '@/lib/core/logger'

export interface StoredProject {
  id: string
  name: string
  description: string
  ownerId: string
  files: Record<string, string>
  fileCount: number
  totalSizeBytes: number
  deploymentUrl: string | null
  previewUrl: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

// ── Resource limits ───────────────────────────────────────────────────────────

export const LIMITS = {
  maxProjectFiles: 200,
  maxFileSizeBytes: 500_000,       // 500 KB per file
  maxTotalSizeBytes: 10_000_000,   // 10 MB per project
  maxProjectsPerUser: 50,
}

// ── Server-side in-memory store (survives within a single Node.js process) ────

const serverStore = new Map<string, StoredProject>()

// ── Storage service ───────────────────────────────────────────────────────────

export const projectStorage = {
  save(project: Omit<StoredProject, 'fileCount' | 'totalSizeBytes' | 'updatedAt'>): StoredProject {
    const fileCount = Object.keys(project.files).length
    if (fileCount > LIMITS.maxProjectFiles) {
      logger.warn('system', `Project ${project.id} exceeds max file limit (${fileCount}/${LIMITS.maxProjectFiles})`)
    }

    const totalSizeBytes = Object.values(project.files).reduce((sum, c) => sum + c.length, 0)

    const stored: StoredProject = {
      ...project,
      fileCount,
      totalSizeBytes,
      updatedAt: new Date().toISOString(),
    }

    serverStore.set(project.id, stored)
    logger.info('system', `Stored project ${project.id} (${fileCount} files, ${Math.round(totalSizeBytes / 1024)}KB)`)
    return stored
  },

  get(id: string): StoredProject | null {
    return serverStore.get(id) ?? null
  },

  getByOwner(ownerId: string): StoredProject[] {
    return [...serverStore.values()]
      .filter(p => p.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  updateDeploymentUrl(id: string, deploymentUrl: string): void {
    const project = serverStore.get(id)
    if (project) {
      project.deploymentUrl = deploymentUrl
      project.updatedAt = new Date().toISOString()
      serverStore.set(id, project)
    }
  },

  delete(id: string): void {
    serverStore.delete(id)
  },

  stats(): { totalProjects: number; totalFiles: number; totalSizeBytes: number } {
    let totalFiles = 0
    let totalSizeBytes = 0
    for (const p of serverStore.values()) {
      totalFiles += p.fileCount
      totalSizeBytes += p.totalSizeBytes
    }
    return { totalProjects: serverStore.size, totalFiles, totalSizeBytes }
  },
}
