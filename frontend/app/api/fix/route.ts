import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { db } from '@/lib/db'
import { generateText } from 'ai'
import { getModel, selectModel } from '@/lib/ai-engine/model-router'
import { sanitizeFiles } from '@/lib/ai-engine/fallback-generator'
import { enforceCredits } from '@/lib/credits-server'
import { CREDIT_COSTS } from '@/lib/credits'
import type { ModelId } from '@/lib/ai-engine/model-router'

export const maxDuration = 60

const FIX_SYSTEM_PROMPT = `You are BuildForge DebugAgent — an expert at fixing runtime errors in web projects.

You will receive:
1. An error message from the browser/runtime
2. The project files that caused the error

Your job is to identify the root cause and return ONLY the files that need to change.

OUTPUT FORMAT — return ONLY this exact JSON (no markdown, no fences):
{
  "updates": {
    "filename": "complete fixed file content"
  },
  "newFiles": {},
  "deletedFiles": [],
  "description": "what was fixed and why",
  "rootCause": "one sentence explaining the bug"
}

RULES:
- Fix the actual root cause, not just suppress the error
- Preserve all existing functionality
- Only include files that actually need changes
- Add defensive null checks where appropriate
- Fix missing imports, undefined variables, syntax errors
- For React errors: fix hook violations, missing keys, invalid JSX`

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const creditError = await enforceCredits(userId, 'repairCode', { route: '/api/fix' })
  if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

  const body: {
    error: string
    files: Record<string, string>
    modelId?: ModelId
  } = await req.json()

  const { error: errorMsg, files, modelId } = body
  if (!errorMsg || !files) return NextResponse.json({ error: 'error and files are required' }, { status: 400 })

  const selectedModel = selectModel(user.subscription?.plan ?? 'free', modelId)

  try {
    const filesContext = Object.entries(files)
      .slice(0, 10)
      .map(([k, v]) => `=== ${k} ===\n${v.slice(0, 2000)}`)
      .join('\n\n')

    const { text } = await generateText({
      model: getModel(selectedModel),
      system: FIX_SYSTEM_PROMPT,
      prompt: `ERROR:\n${errorMsg}\n\nPROJECT FILES:\n${filesContext}\n\nFix the error and return only the changed files.`,
      maxOutputTokens: 6000,
    })

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    let patch: { updates: Record<string, string>; newFiles: Record<string, string>; deletedFiles: string[]; description: string; rootCause?: string }
    try {
      patch = JSON.parse(cleaned)
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      patch = match ? JSON.parse(match[0]) : { updates: {}, newFiles: {}, deletedFiles: [], description: 'Fix applied' }
    }

    const resultFiles = { ...files }
    for (const [k, v] of Object.entries(patch.updates ?? {})) resultFiles[k] = v
    for (const [k, v] of Object.entries(patch.newFiles ?? {})) resultFiles[k] = v
    for (const k of (patch.deletedFiles ?? [])) delete resultFiles[k]

    return NextResponse.json({
      files: sanitizeFiles(resultFiles),
      patch,
      description: patch.description,
      rootCause: patch.rootCause,
    })
  } catch (err) {
    // Refund on failure
    try {
      const isAdmin = user.role === 'admin' || (process.env.ADMIN_USER_IDS ?? '').split(',').includes(userId)
      if (!isAdmin) {
        await db.subscription.update({
          where: { userId: user.id },
          data: { creditsRemaining: { increment: CREDIT_COSTS.repairCode } },
        })
      }
    } catch { /* ignore */ }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fix failed' }, { status: 500 })
  }
}
