import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { listUserJobs, getJob } from '@/lib/job-queue'

// GET /api/jobs — list current user's jobs
export async function GET(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('id')

  if (jobId) {
    const job = getJob(jobId)
    if (!job || job.userId !== userId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    return NextResponse.json(job)
  }

  const jobs = listUserJobs(userId)
  return NextResponse.json({ jobs })
}
