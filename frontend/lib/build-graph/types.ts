// Build Graph Engine — core types
// Each node represents a generation task; edges represent dependencies.

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface BuildNode {
  id: string
  type: string
  label: string
  dependencies: string[]   // ids of nodes that must complete before this one runs
  status: NodeStatus
  result?: Record<string, string>  // files produced by this node
  error?: string
  durationMs?: number
  run: (ctx: BuildContext) => Promise<BuildNodeResult>
}

export interface BuildNodeResult {
  files: Record<string, string>
  description: string
  skipped?: boolean
}

export interface BuildContext {
  prompt: string
  appType: string
  modelId: string
  files: Record<string, string>   // accumulated files from all completed nodes
  plan?: Record<string, unknown>
  architecture?: import('@/lib/templates/types').SaaSArchitectureSpec
  emitEvent: (event: AgentEvent) => void
}

export interface AgentEvent {
  id: string
  agent: string
  action: string
  file?: string
  detail?: string
  timestamp: string
  status: 'info' | 'success' | 'error' | 'running'
}

// ── Timeline types ────────────────────────────────────────────────────────────

/** Incremental snapshot — stores only files that changed in this step */
export interface FileSnapshot {
  snapshotId: string
  /** Only the files that changed/were added in this step (delta, not full copy) */
  delta: Record<string, string>
  /** Files deleted in this step */
  deleted: string[]
  /** Full accumulated file list at this point (keys only, for display) */
  fileList: string[]
  timestamp: string
}

export interface TimelineStep {
  id: string
  stepNum: number
  agent: string
  nodeId: string
  nodeType: string
  action: string
  description: string
  filesChanged: string[]
  filesAdded: string[]
  filesDeleted: string[]
  durationMs: number
  status: NodeStatus
  snapshotId: string
  timestamp: string
}

export interface BuildRun {
  buildId: string
  projectId: string | null
  prompt: string
  mode: string
  steps: TimelineStep[]
  snapshots: Record<string, FileSnapshot>  // snapshotId → snapshot
  startedAt: string
  completedAt: string
  totalDurationMs: number
}

export interface BuildGraphResult {
  files: Record<string, string>
  nodes: Array<{ id: string; type: string; label: string; status: NodeStatus; durationMs?: number; description?: string; changes: string[] }>
  events: AgentEvent[]
  timeline: BuildRun
  totalDurationMs: number
}
