import { NextResponse } from 'next/server'
import { requireUserId, isDatabaseConfigured } from '@/lib/safe-auth'
import { generateText } from 'ai'
import { getModel, selectModel } from '@/lib/ai-engine/model-router'
import {
  databaseSystemPrompt, databaseUserMessage,
  authSystemPrompt, apiGeneratorSystemPrompt, apiGeneratorUserMessage,
} from '@/lib/ai-engine/agents/database-agent'
import {
  designSystemPrompt, designSystemUserMessage,
} from '@/lib/ai-engine/agents/design-system-agent'
import { parseFilesJson } from '@/lib/ai-engine/tool-adapters/base-adapter'
import { sanitizeFiles } from '@/lib/ai-engine/fallback-generator'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { DbTarget } from '@/lib/ai-engine/agents/database-agent'
import type { DesignSystemSpec } from '@/lib/ai-engine/agents/design-system-agent'

export const maxDuration = 120

export type ScaffoldType = 'database' | 'auth' | 'api' | 'design-system'

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { db } = await import('@/lib/db')

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })
  if (!user?.subscription || user.subscription.creditsRemaining < 1) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  const body: {
    type: ScaffoldType
    projectName: string
    modelId?: ModelId
    // database
    tables?: Record<string, string[]>
    dbTarget?: DbTarget
    // auth
    authProvider?: 'clerk' | 'supabase'
    // api
    apis?: string[]
    // design system
    designSpec?: DesignSystemSpec
  } = await req.json()

  const { type, projectName, modelId, tables, dbTarget, authProvider, apis, designSpec } = body

  const selectedModel = selectModel(user.subscription.plan, modelId)

  await db.subscription.update({
    where: { userId: user.id },
    data: { creditsRemaining: { decrement: 1 } },
  })

  try {
    let systemPrompt: string
    let userMessage: string

    switch (type) {
      case 'database':
        systemPrompt = databaseSystemPrompt(dbTarget ?? 'prisma')
        userMessage = databaseUserMessage(tables ?? {}, dbTarget ?? 'prisma', projectName)
        break
      case 'auth':
        systemPrompt = authSystemPrompt(authProvider ?? 'clerk')
        userMessage = `Generate ${authProvider ?? 'clerk'} authentication for project "${projectName}".`
        break
      case 'api':
        systemPrompt = apiGeneratorSystemPrompt()
        userMessage = apiGeneratorUserMessage(apis ?? [], tables ?? {})
        break
      case 'design-system':
        systemPrompt = designSystemPrompt(designSpec ?? { primaryColor: 'purple', style: 'modern', fonts: ['Inter'], projectName })
        userMessage = designSystemUserMessage(designSpec ?? { primaryColor: 'purple', style: 'modern', fonts: ['Inter'], projectName })
        break
      default:
        return NextResponse.json({ error: 'Invalid scaffold type' }, { status: 400 })
    }

    const { text } = await generateText({
      model: getModel(selectedModel),
      system: systemPrompt,
      prompt: userMessage,
      maxOutputTokens: 8000,
    })

    const result = parseFilesJson(text)
    return NextResponse.json({ files: sanitizeFiles(result.files), description: result.description })
  } catch (err) {
    try {
      await db.subscription.update({
        where: { userId: user.id },
        data: { creditsRemaining: { increment: 1 } },
      })
    } catch { /* ignore */ }
    const msg = err instanceof Error ? err.message : 'Scaffold failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
