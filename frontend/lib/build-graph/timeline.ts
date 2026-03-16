// Build Timeline — records every step of a build run with incremental snapshots.
// Snapshots are incremental (delta only) to avoid storing full file copies per step.

import type { BuildRun, TimelineStep, FileSnapshot, NodeStatus } from './types'

const STORAGE_KEY = 'buildforge_build_runs'
const MAX_STORED_RUNS = 10

// ── Snapshot helpers ──────────────────────────────────────────────────────────

/**
 * Create an incremental snapshot by diffing previous files against current files.
 * Only stores changed/added files (delta) and deleted file keys.
 */
export function createSnapshot(
  prevFiles: Record<string, string>,
  currentFiles: Record<string, string>
): Omit<FileSnapshot, 'snapshotId' | 'timestamp'> {
  const delta: Record<string, string> = {}
  const deleted: string[] = []

  // Find added or changed files
  for (const [k, v] of Object.entries(currentFiles)) {
    if (prevFiles[k] !== v) delta[k] = v
  }
  // Find deleted files
  for (const k of Object.keys(prevFiles)) {
    if (!(k in currentFiles)) deleted.push(k)
  }

  return {
    delta,
    deleted,
    fileList: Object.keys(currentFiles),
  }
}

/**
 * Reconstruct the full file state at a given snapshot by replaying deltas
 * from the beginning of the build run up to and including the target snapshot.
 */
export function replayToSnapshot(run: BuildRun, targetSnapshotId: string): Record<string, string> {
  const files: Record<string, string> = {}

  for (const step of run.steps) {
    const snap = run.snapshots[step.snapshotId]
    if (!snap) continue

    // Apply delta
    Object.assign(files, snap.delta)
    // Apply deletions
    for (const k of snap.deleted) delete files[k]

    if (step.snapshotId === targetSnapshotId) break
  }

  return files
}

// ── Build run builder ─────────────────────────────────────────────────────────

export class BuildRunRecorder {
  private run: BuildRun
  private prevFiles: Record<string, string> = {}
  private stepCounter = 0

  constructor(buildId: string, projectId: string | null, prompt: string, mode: string) {
    this.run = {
      buildId,
      projectId,
      prompt,
      mode,
      steps: [],
      snapshots: {},
      startedAt: new Date().toISOString(),
      completedAt: '',
      totalDurationMs: 0,
    }
  }

  recordStep(opts: {
    nodeId: string
    nodeType: string
    agent: string
    action: string
    description: string
    status: NodeStatus
    durationMs: number
    currentFiles: Record<string, string>
  }): TimelineStep {
    this.stepCounter++
    const snapshotId = `snap-${this.run.buildId}-${this.stepCounter}`
    const snap = createSnapshot(this.prevFiles, opts.currentFiles)

    const snapshot: FileSnapshot = {
      snapshotId,
      ...snap,
      timestamp: new Date().toISOString(),
    }
    this.run.snapshots[snapshotId] = snapshot

    const step: TimelineStep = {
      id: `step-${this.run.buildId}-${this.stepCounter}`,
      stepNum: this.stepCounter,
      agent: opts.agent,
      nodeId: opts.nodeId,
      nodeType: opts.nodeType,
      action: opts.action,
      description: opts.description,
      filesChanged: Object.keys(snap.delta).filter(k => k in this.prevFiles),
      filesAdded: Object.keys(snap.delta).filter(k => !(k in this.prevFiles)),
      filesDeleted: snap.deleted,
      durationMs: opts.durationMs,
      status: opts.status,
      snapshotId,
      timestamp: new Date().toISOString(),
    }

    this.run.steps.push(step)
    this.prevFiles = { ...opts.currentFiles }
    return step
  }

  complete(totalDurationMs: number): BuildRun {
    this.run.completedAt = new Date().toISOString()
    this.run.totalDurationMs = totalDurationMs
    return this.run
  }

  getPartial(): BuildRun {
    return { ...this.run }
  }
}

// ── Persistence (localStorage) ────────────────────────────────────────────────

export function saveBuildRun(run: BuildRun): void {
  if (typeof window === 'undefined') return
  try {
    const existing = loadBuildRuns()
    const updated = [run, ...existing.filter(r => r.buildId !== run.buildId)]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, MAX_STORED_RUNS)))
  } catch { /* quota */ }
}

export function loadBuildRuns(): BuildRun[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as BuildRun[]) : []
  } catch { return [] }
}

export function loadBuildRun(buildId: string): BuildRun | null {
  return loadBuildRuns().find(r => r.buildId === buildId) ?? null
}

export function deleteBuildRun(buildId: string): void {
  if (typeof window === 'undefined') return
  try {
    const runs = loadBuildRuns().filter(r => r.buildId !== buildId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs))
  } catch { /* quota */ }
}

export function generateBuildId(): string {
  return `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
