/**
 * Backend Generator — generates Next.js API route handlers for each entity.
 * Produces full CRUD: GET (list + single), POST, PUT, DELETE.
 */

import { aiRequest, stripFences } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { ProductIntent, ProductEntity } from './product-intent'

const BACKEND_SYSTEM = `You are an expert Next.js API developer.
Generate complete, production-ready TypeScript API route handlers.
Rules:
- Use Next.js 14 App Router route.ts conventions
- Use Prisma Client for database operations (import from '@/lib/db')
- Use Clerk auth: import { auth } from '@clerk/nextjs/server'
- Return NextResponse.json() with { success, data } or { success: false, error }
- Include input validation with Zod
- Handle errors with try/catch
- Return ONLY the file content — no markdown, no explanation`

async function generateRouteFile(
  entity: ProductEntity,
  intent: ProductIntent,
  modelId: ModelId,
): Promise<string> {
  const slug = entity.name.toLowerCase() + 's'
  const prompt = `Generate a Next.js API route file for ${entity.name} CRUD operations.
Entity: ${entity.name}
Fields: ${entity.fields.join(', ')}
Relations: ${entity.relations.join(', ')}
Product: ${intent.name}

File: app/api/${slug}/route.ts
Include:
- GET: list all ${slug} for authenticated user (with optional search query param)
- POST: create new ${entity.name} (validate with Zod)
Both handlers must check auth with Clerk.`

  try {
    const text = await aiRequest({ system: BACKEND_SYSTEM, prompt, modelId, maxOutputTokens: 4000, timeoutMs: 25_000 })
    return stripFences(text)
  } catch (err) {
    logger.warn('ai-pipeline', `Backend gen fallback for ${slug}`, err instanceof Error ? err.message : String(err))
    return generateFallbackRoute(entity)
  }
}

async function generateIdRouteFile(
  entity: ProductEntity,
  intent: ProductIntent,
  modelId: ModelId,
): Promise<string> {
  const slug = entity.name.toLowerCase() + 's'
  const prompt = `Generate a Next.js API route file for single ${entity.name} operations.
Entity: ${entity.name}
Fields: ${entity.fields.join(', ')}
Product: ${intent.name}

File: app/api/${slug}/[id]/route.ts
Include:
- GET: fetch single ${entity.name} by id (verify ownership)
- PUT: update ${entity.name} by id (validate with Zod)
- DELETE: delete ${entity.name} by id (verify ownership)
All handlers must check auth with Clerk.`

  try {
    const text = await aiRequest({ system: BACKEND_SYSTEM, prompt, modelId, maxOutputTokens: 4000, timeoutMs: 25_000 })
    return stripFences(text)
  } catch (err) {
    logger.warn('ai-pipeline', `Backend gen fallback for ${slug}/[id]`, err instanceof Error ? err.message : String(err))
    return generateFallbackIdRoute(entity)
  }
}

export async function generateAllBackendFiles(
  intent: ProductIntent,
  modelId: ModelId = 'gemini_flash',
  onProgress?: (file: string) => void,
): Promise<Record<string, string>> {
  const files: Record<string, string> = {}

  for (const entity of intent.entities) {
    const slug = entity.name.toLowerCase() + 's'

    onProgress?.(`app/api/${slug}/route.ts`)
    files[`app/api/${slug}/route.ts`] = await generateRouteFile(entity, intent, modelId)
    logger.info('ai-pipeline', `Backend: generated /api/${slug}`)

    onProgress?.(`app/api/${slug}/[id]/route.ts`)
    files[`app/api/${slug}/[id]/route.ts`] = await generateIdRouteFile(entity, intent, modelId)
    logger.info('ai-pipeline', `Backend: generated /api/${slug}/[id]`)
  }

  // Middleware
  files['middleware.ts'] = generateMiddleware()

  return files
}

// ── Fallback templates ────────────────────────────────────────────────────────

function generateFallbackRoute(entity: ProductEntity): string {
  const slug = entity.name.toLowerCase() + 's'
  const model = entity.name.toLowerCase()
  const zodFields = entity.fields
    .filter(f => f !== 'id' && f !== 'createdAt' && f !== 'updatedAt')
    .map(f => `  ${f}: z.string().min(1)`)
    .join(',\n')

  return `import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
${zodFields}
})

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  const items = await (db as any).${model}.findMany({
    where: {
      userId: user.id,
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }] } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: items })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const item = await (db as any).${model}.create({
    data: { ...parsed.data, userId: user.id },
  })

  return NextResponse.json({ success: true, data: item }, { status: 201 })
}
`
}

function generateFallbackIdRoute(entity: ProductEntity): string {
  const model = entity.name.toLowerCase()
  const zodFields = entity.fields
    .filter(f => f !== 'id' && f !== 'createdAt' && f !== 'updatedAt')
    .map(f => `  ${f}: z.string().optional()`)
    .join(',\n')

  return `import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
${zodFields}
})

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  const item = await (db as any).${model}.findFirst({ where: { id: params.id, userId: user.id } })
  if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true, data: item })
}

export async function PUT(req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const item = await (db as any).${model}.updateMany({
    where: { id: params.id, userId: user.id },
    data: parsed.data,
  })

  return NextResponse.json({ success: true, data: item })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  await (db as any).${model}.deleteMany({ where: { id: params.id, userId: user.id } })
  return NextResponse.json({ success: true })
}
`
}

function generateMiddleware(): string {
  return `import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
`
}
