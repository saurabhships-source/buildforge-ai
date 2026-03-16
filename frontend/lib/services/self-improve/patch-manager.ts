// Patch Manager — stores, approves, rejects, and applies patch proposals
// Uses localStorage for persistence (no DB required in dev)

import type { GeneratedPatch } from './patch-generator'
import type { SelfTestReport } from './self-test-runner'
import type { FeaturePlan } from './feature-planner'

export type PatchStatus = 'pending' | 'approved' | 'rejected' | 'applied' | 'failed'

export interface PatchProposal {
  id: string
  title: string
  description: string
  filesChanged: string[]
  status: PatchStatus
  createdAt: string
  updatedAt: string
  patch: GeneratedPatch
  plan: FeaturePlan
  testReport?: SelfTestReport
  appliedAt?: string
  rejectedReason?: string
  snapshotId?: string  // version-control snapshot taken before apply
}

const STORAGE_KEY = 'buildforge_system_patches'
const MAX_PATCHES = 50

function load(): PatchProposal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PatchProposal[]) : []
  } catch { return [] }
}

function save(patches: PatchProposal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patches.slice(0, MAX_PATCHES)))
  } catch { /* quota */ }
}

export const patchManager = {
  createPatchProposal(
    patch: GeneratedPatch,
    plan: FeaturePlan,
    testReport?: SelfTestReport,
  ): PatchProposal {
    const proposal: PatchProposal = {
      id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: patch.featureName,
      description: plan.description,
      filesChanged: patch.files.map(f => f.path),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patch,
      plan,
      testReport,
    }
    const all = load()
    save([proposal, ...all])
    return proposal
  },

  getAll(): PatchProposal[] {
    return load()
  },

  getById(id: string): PatchProposal | null {
    return load().find(p => p.id === id) ?? null
  },

  getPending(): PatchProposal[] {
    return load().filter(p => p.status === 'pending')
  },

  approvePatch(id: string): PatchProposal | null {
    const all = load()
    const idx = all.findIndex(p => p.id === id)
    if (idx < 0) return null
    all[idx].status = 'approved'
    all[idx].updatedAt = new Date().toISOString()
    save(all)
    return all[idx]
  },

  rejectPatch(id: string, reason?: string): PatchProposal | null {
    const all = load()
    const idx = all.findIndex(p => p.id === id)
    if (idx < 0) return null
    all[idx].status = 'rejected'
    all[idx].rejectedReason = reason
    all[idx].updatedAt = new Date().toISOString()
    save(all)
    return all[idx]
  },

  markApplied(id: string, snapshotId?: string): PatchProposal | null {
    const all = load()
    const idx = all.findIndex(p => p.id === id)
    if (idx < 0) return null
    all[idx].status = 'applied'
    all[idx].appliedAt = new Date().toISOString()
    all[idx].updatedAt = new Date().toISOString()
    if (snapshotId) all[idx].snapshotId = snapshotId
    save(all)
    return all[idx]
  },

  markFailed(id: string, reason: string): PatchProposal | null {
    const all = load()
    const idx = all.findIndex(p => p.id === id)
    if (idx < 0) return null
    all[idx].status = 'failed'
    all[idx].rejectedReason = reason
    all[idx].updatedAt = new Date().toISOString()
    save(all)
    return all[idx]
  },

  /** Apply an approved patch — returns the files to merge into the project */
  applyPatch(id: string): { files: Record<string, string>; proposal: PatchProposal } | null {
    const proposal = this.getById(id)
    if (!proposal || proposal.status !== 'approved') return null

    const files: Record<string, string> = {}
    for (const f of proposal.patch.files) {
      files[f.path] = f.changes
    }

    this.markApplied(id)
    return { files, proposal }
  },

  delete(id: string): void {
    save(load().filter(p => p.id !== id))
  },

  clear(): void {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  },

  stats(): { total: number; pending: number; approved: number; rejected: number; applied: number } {
    const all = load()
    return {
      total: all.length,
      pending: all.filter(p => p.status === 'pending').length,
      approved: all.filter(p => p.status === 'approved').length,
      rejected: all.filter(p => p.status === 'rejected').length,
      applied: all.filter(p => p.status === 'applied').length,
    }
  },
}
