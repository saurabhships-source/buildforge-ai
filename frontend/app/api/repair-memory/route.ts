import { auth } from '@clerk/nextjs/server'
import { ok, err, parseBody } from '@/lib/core/api-helpers'
import { repairMemory } from '@/lib/services/ai/repair-memory'

/** GET /api/repair-memory — list all stored fixes */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  return ok({
    fixes: repairMemory.listFixes(),
    stats: repairMemory.stats(),
  })
}

/** DELETE /api/repair-memory — clear all or delete one pattern */
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  const body = await parseBody<{ pattern?: string; clearAll?: boolean }>(req)

  if (body?.clearAll) {
    repairMemory.clear()
    return ok({ cleared: true })
  }

  if (body?.pattern) {
    const deleted = repairMemory.deleteFix(body.pattern)
    return ok({ deleted })
  }

  return err('Provide pattern or clearAll=true')
}
