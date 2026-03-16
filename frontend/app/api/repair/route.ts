import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { ok, err, parseBody } from '@/lib/core/api-helpers'
import { runRepairAgent } from '@/lib/services/ai/repair-agent'
import { logger } from '@/lib/core/logger'
import { enforceCredits } from '@/lib/credits-server'

interface RepairRequest {
  projectId: string
  buildOutput: string
  files: Record<string, string>
  modelId?: string
}

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  const body = await parseBody<RepairRequest>(req)
  if (!body?.projectId || !body?.buildOutput || !body?.files) {
    return err('Missing required fields: projectId, buildOutput, files')
  }

  const creditError = await enforceCredits(userId, 'repairCode', { projectId: body.projectId, route: '/api/repair' })
  if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

  try {
    logger.info('system', `Repair agent triggered for project ${body.projectId}`)

    const result = await runRepairAgent(body.buildOutput, body.files, {
      projectId: body.projectId,
      modelId: (body.modelId as never) ?? 'gemini_flash',
    })

    return ok({
      success: result.success,
      files: result.files,
      iterations: result.iterations,
      log: result.log,
      snapshotId: result.firstSnapshotId,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Repair agent failed'
    logger.error('system', 'Repair agent error', msg)
    return err(msg, 500)
  }
}
