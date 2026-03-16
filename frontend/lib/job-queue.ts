// Distributed Job Queue — in-process implementation for Vercel/serverless
// Uses Postgres (via Prisma) as the job store. For true horizontal scaling,
// swap the store for Redis + BullMQ by replacing the functions below.

export type JobType =
  | 'generate'
  | 'autonomous_pipeline'
  | 'github_import'
  | 'github_improve'
  | 'deploy'
  | 'seo'
  | 'startup'

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  userId: string
  projectId?: string
  payload: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
  creditCost: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  attempts: number
  maxAttempts: number
}

export interface JobProgress {
  jobId: string
  step: string
  agent?: string
  status: 'running' | 'completed' | 'failed'
  message: string
  percent: number
}

// In-memory job store (replaced by DB in production via /api/jobs routes)
const jobStore = new Map<string, Job>()

export function createJob(opts: {
  type: JobType
  userId: string
  projectId?: string
  payload: Record<string, unknown>
  creditCost?: number
}): Job {
  const job: Job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: opts.type,
    status: 'queued',
    userId: opts.userId,
    projectId: opts.projectId,
    payload: opts.payload,
    creditCost: opts.creditCost ?? 1,
    createdAt: new Date(),
    attempts: 0,
    maxAttempts: 3,
  }
  jobStore.set(job.id, job)
  return job
}

export function getJob(jobId: string): Job | undefined {
  return jobStore.get(jobId)
}

export function updateJob(jobId: string, updates: Partial<Job>): Job | undefined {
  const job = jobStore.get(jobId)
  if (!job) return undefined
  const updated = { ...job, ...updates }
  jobStore.set(jobId, updated)
  return updated
}

export function listUserJobs(userId: string): Job[] {
  return Array.from(jobStore.values())
    .filter(j => j.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50)
}

// SSE encoder for streaming job progress
export function encodeSSE(data: JobProgress): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export function encodeSSEDone(): string {
  return `data: [DONE]\n\n`
}
