// Feature 12 — AI API Builder
// Generates REST API routes with CRUD operations from a prompt

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  requestBody?: Record<string, string>
  responseSchema?: Record<string, string>
}

export interface ApiSpec {
  name: string
  baseRoute: string
  endpoints: ApiEndpoint[]
  description: string
}

export interface ApiBuilderResult {
  spec: ApiSpec
  files: Record<string, string>
  summary: string
}

const API_BUILDER_SYSTEM = `You are an expert Next.js API engineer. Generate complete REST API routes.

Return JSON:
{
  "spec": {
    "name": "API name",
    "baseRoute": "/api/resource",
    "description": "what this API does",
    "endpoints": [
      { "method": "GET", "path": "/api/resource", "description": "list all" },
      { "method": "POST", "path": "/api/resource", "description": "create one" },
      { "method": "PUT", "path": "/api/resource/[id]", "description": "update one" },
      { "method": "DELETE", "path": "/api/resource/[id]", "description": "delete one" }
    ]
  },
  "files": {
    "app/api/resource/route.ts": "complete GET + POST handler",
    "app/api/resource/[id]/route.ts": "complete GET + PUT + DELETE handler"
  },
  "summary": "what was generated"
}

Rules:
- Use Next.js App Router (NextRequest/NextResponse)
- Include proper error handling and status codes
- Add input validation with zod
- Use in-memory Map as data store (no DB dependency)
- Include JSDoc comments
- No markdown fences in response`

export async function buildApi(
  prompt: string,
  modelId: ModelId = 'gemini_flash',
): Promise<ApiBuilderResult> {
  try {
    const { text } = await generateText({
      model: getModel(modelId),
      system: API_BUILDER_SYSTEM,
      prompt: `Generate a REST API for: "${prompt}"`,
      maxOutputTokens: 8000,
    })

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as ApiBuilderResult
  } catch (err) {
    console.warn('[api-builder] AI failed:', err)
    return buildHeuristicApi(prompt)
  }
}

function buildHeuristicApi(prompt: string): ApiBuilderResult {
  const resource = prompt.toLowerCase()
    .replace(/create|build|generate|rest|api|for|a|an|the/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    || 'items'

  const singular = resource.replace(/-?s$/, '')
  const TypeName = singular.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

  const collectionRoute = `import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/** In-memory store — replace with your DB */
const store = new Map<string, ${TypeName}>()

interface ${TypeName} {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
})

/** GET /api/${resource} — list all */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const items = Array.from(store.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice((page - 1) * limit, page * limit)
  return NextResponse.json({ data: items, total: store.size, page, limit })
}

/** POST /api/${resource} — create */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const item: ${TypeName} = { id, ...parsed.data, createdAt: now, updatedAt: now }
  store.set(id, item)
  return NextResponse.json(item, { status: 201 })
}`

  const itemRoute = `import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/** Shared store — import from collection route in production */
declare const store: Map<string, { id: string; name: string; description?: string; createdAt: string; updatedAt: string }>

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
})

/** GET /api/${resource}/[id] */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = store.get(params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

/** PUT /api/${resource}/[id] */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const item = store.get(params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const updated = { ...item, ...parsed.data, updatedAt: new Date().toISOString() }
  store.set(params.id, updated)
  return NextResponse.json(updated)
}

/** DELETE /api/${resource}/[id] */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!store.has(params.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  store.delete(params.id)
  return new NextResponse(null, { status: 204 })
}`

  return {
    spec: {
      name: `${TypeName} API`,
      baseRoute: `/api/${resource}`,
      description: `REST API for managing ${resource}`,
      endpoints: [
        { method: 'GET', path: `/api/${resource}`, description: `List all ${resource}` },
        { method: 'POST', path: `/api/${resource}`, description: `Create a ${singular}` },
        { method: 'GET', path: `/api/${resource}/[id]`, description: `Get a ${singular}` },
        { method: 'PUT', path: `/api/${resource}/[id]`, description: `Update a ${singular}` },
        { method: 'DELETE', path: `/api/${resource}/[id]`, description: `Delete a ${singular}` },
      ],
    },
    files: {
      [`app/api/${resource}/route.ts`]: collectionRoute,
      [`app/api/${resource}/[id]/route.ts`]: itemRoute,
    },
    summary: `Generated ${TypeName} REST API with 5 endpoints`,
  }
}
