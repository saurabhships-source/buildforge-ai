import { auth } from '@clerk/nextjs/server'
import { ok, err, parseBody } from '@/lib/core/api-helpers'
import { templateMarketplace } from '@/lib/services/template-marketplace'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const t = templateMarketplace.get(params.id)
  if (!t) return err('Not found', 404)
  return ok(t)
}

/** POST /api/templates/:id — clone or rate */
export async function POST(req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  const body = await parseBody<{ action: 'clone' | 'rate'; stars?: number }>(req)

  if (body?.action === 'clone') {
    const cloned = templateMarketplace.clone(params.id, userId, userId)
    if (!cloned) return err('Template not found', 404)
    return ok(cloned)
  }

  if (body?.action === 'rate' && body.stars !== undefined) {
    const updated = templateMarketplace.rate(params.id, body.stars)
    if (!updated) return err('Template not found', 404)
    return ok(updated)
  }

  return err('Invalid action')
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)
  const deleted = templateMarketplace.delete(params.id, userId)
  return deleted ? ok({ deleted: true }) : err('Not found or forbidden', 403)
}
