// Autonomous Maintenance Scheduler
// Manages periodic improvement cycles for projects

export type MaintenanceAgentType = 'debug' | 'ui' | 'ux' | 'refactor' | 'security' | 'performance' | 'seo'

export interface MaintenanceCycle {
  projectId: string
  scheduledAt: Date
  agents: MaintenanceAgentType[]
  priority: 'low' | 'normal' | 'high'
  reason: string
}

export interface ImprovementLog {
  id: string
  projectId: string
  agent: MaintenanceAgentType
  runAt: Date
  durationMs: number
  changes: string[]
  description: string
  healthBefore: number
  healthAfter: number
  status: 'completed' | 'failed' | 'skipped'
}

// In-memory schedule store (swap for DB/Redis in production)
const scheduleStore = new Map<string, MaintenanceCycle>()
const improvementLogs: ImprovementLog[] = []

export function scheduleMaintenanceCycle(opts: {
  projectId: string
  agents?: MaintenanceAgentType[]
  priority?: MaintenanceCycle['priority']
  reason?: string
  delayMs?: number
}): MaintenanceCycle {
  const cycle: MaintenanceCycle = {
    projectId: opts.projectId,
    scheduledAt: new Date(Date.now() + (opts.delayMs ?? 0)),
    agents: opts.agents ?? ['debug', 'security', 'performance', 'seo'],
    priority: opts.priority ?? 'normal',
    reason: opts.reason ?? 'Scheduled maintenance',
  }
  scheduleStore.set(opts.projectId, cycle)
  return cycle
}

export function getScheduledCycle(projectId: string): MaintenanceCycle | undefined {
  return scheduleStore.get(projectId)
}

export function cancelMaintenanceCycle(projectId: string): void {
  scheduleStore.delete(projectId)
}

export function logImprovement(log: Omit<ImprovementLog, 'id'>): ImprovementLog {
  const entry: ImprovementLog = { ...log, id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
  improvementLogs.unshift(entry)
  if (improvementLogs.length > 500) improvementLogs.splice(500)
  return entry
}

export function getProjectLogs(projectId: string, limit = 20): ImprovementLog[] {
  return improvementLogs.filter(l => l.projectId === projectId).slice(0, limit)
}

export function getAllLogs(userId?: string, limit = 50): ImprovementLog[] {
  return improvementLogs.slice(0, limit)
}

// Determine which agents to run based on health score
export function selectMaintenanceAgents(health: {
  overall: number
  security: number
  performance: number
  seo: number
}): MaintenanceAgentType[] {
  const agents: MaintenanceAgentType[] = []
  if (health.security < 70) agents.push('security', 'debug')
  if (health.performance < 70) agents.push('performance')
  if (health.seo < 60) agents.push('seo')
  if (health.overall < 75) agents.push('ui', 'ux', 'refactor')
  if (agents.length === 0) agents.push('debug', 'performance')
  return [...new Set(agents)]
}
