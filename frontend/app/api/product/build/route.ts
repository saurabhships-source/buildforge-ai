import { auth } from '@clerk/nextjs/server'
import { ok, err, parseBody } from '@/lib/core/api-helpers'
import { buildProduct } from '@/lib/services/ai/product-factory'
import { logger } from '@/lib/core/logger'

interface BuildRequest {
  prompt: string
  modelId?: string
  deploy?: boolean
  deployProvider?: 'vercel' | 'netlify'
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  const body = await parseBody<BuildRequest>(req)
  if (!body?.prompt?.trim()) return err('Missing required field: prompt')
  if (body.prompt.length > 2000) return err('Prompt too long (max 2000 chars)')

  try {
    logger.info('api', `Product build started for user ${userId}`, body.prompt.slice(0, 80))

    const result = await buildProduct(body.prompt, {
      ownerId: userId,
      modelId: (body.modelId as never) ?? 'gemini_flash',
      deploy: body.deploy ?? false,
      deployProvider: body.deployProvider ?? 'vercel',
    })

    return ok(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Product build failed'
    logger.error('api', 'Product build error', msg)
    return err(msg, 500)
  }
}
