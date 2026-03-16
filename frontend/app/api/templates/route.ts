import { auth } from '@clerk/nextjs/server'
import { ok, err, parseBody } from '@/lib/core/api-helpers'
import { templateMarketplace } from '@/lib/services/template-marketplace'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tag = searchParams.get('tag') ?? undefined
  const sort = (searchParams.get('sort') ?? 'downloads') as 'rating' | 'downloads' | 'newest'
  return ok(templateMarketplace.list({ tag, sort }))
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return err('Unauthorized', 401)

  const body = await parseBody<{
    name: string; description: string; tags: string[]
    files: Record<string, string>; previewUrl?: string
  }>(req)

  if (!body?.name || !body?.files) return err('Missing name or files')

  const template = templateMarketplace.publish({
    id: `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: body.name,
    description: body.description ?? '',
    tags: body.tags ?? [],
    authorId: userId,
    authorName: userId,
    files: body.files,
    previewUrl: body.previewUrl ?? null,
  })

  return ok(template, 201)
}
