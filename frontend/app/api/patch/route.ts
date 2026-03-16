import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { db } from '@/lib/db'
import { getModel, selectModel, routeAgent } from '@/lib/ai-engine/model-router'
import { generateText } from 'ai'
import { patchSystemPrompt, buildPatchUserMessage } from '@/lib/ai-engine/agents/builder-agent'
import { generateFallbackProject, sanitizeFiles } from '@/lib/ai-engine/fallback-generator'
import { buildDependencyMaps, getAffectedFiles, validateImports, buildDependencyContext } from '@/lib/dependency-analyzer'
import { validatePatchOutput } from '@/lib/ai-output-validator'
import { enforceCredits } from '@/lib/credits-server'
import { CREDIT_COSTS } from '@/lib/credits'
import type { ModelId } from '@/lib/ai-engine/model-router'

export const maxDuration = 120

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

interface PatchResult {
  updates: Record<string, string>
  newFiles: Record<string, string>
  deletedFiles: string[]
  description: string
}

function parsePatchJson(text: string): PatchResult {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      updates: parsed.updates ?? {},
      newFiles: parsed.newFiles ?? {},
      deletedFiles: Array.isArray(parsed.deletedFiles) ? parsed.deletedFiles : [],
      description: parsed.description ?? 'Patch applied',
    }
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        return {
          updates: parsed.updates ?? {},
          newFiles: parsed.newFiles ?? {},
          deletedFiles: Array.isArray(parsed.deletedFiles) ? parsed.deletedFiles : [],
          description: parsed.description ?? 'Patch applied',
        }
      } catch { /* fall through */ }
    }
    throw new Error('Failed to parse patch response as JSON')
  }
}

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  let user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })

  if (!user) {
    const { currentUser } = await import('@clerk/nextjs/server')
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@buildforge.ai`
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || email
    user = await db.user.create({
      data: {
        clerkId: userId, email, name,
        subscription: { create: { plan: 'free', creditsRemaining: 50, creditsTotal: 50 } },
      },
      include: { subscription: true },
    })
  }

  const creditError = await enforceCredits(userId, 'improveCode', { route: '/api/patch' })
  if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

  const body: {
    prompt: string
    existingFiles: Record<string, string>
    projectId?: string
    modelId?: ModelId
  } = await req.json()

  const { prompt, existingFiles, projectId, modelId } = body

  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  if (!existingFiles || Object.keys(existingFiles).length === 0) {
    return NextResponse.json({ error: 'existingFiles is required for patch mode' }, { status: 400 })
  }

  const sub = user.subscription
  const selectedModel = selectModel(sub?.plan ?? 'free', modelId)

  try {
    const { dependencyMap } = buildDependencyMaps(existingFiles)
    const allFiles = Object.keys(existingFiles)

    const promptLower = prompt.toLowerCase()
    const likelyTargets = allFiles.filter(f => {
      const base = f.split('/').pop()?.replace(/\.[^.]+$/, '').toLowerCase() ?? ''
      return promptLower.includes(base) || promptLower.includes(f.toLowerCase())
    })

    const depContext = buildDependencyContext(existingFiles, likelyTargets.length > 0 ? likelyTargets : allFiles.slice(0, 5))

    const systemPrompt = patchSystemPrompt(existingFiles)
    const userMessage = buildPatchUserMessage(prompt, existingFiles)
    const fullUserMessage = depContext ? `${userMessage}\n\n${depContext}` : userMessage

    const modelsToTry: ModelId[] = selectedModel === 'gemini_flash'
      ? ['gemini_flash', 'gemini_pro']
      : [selectedModel, 'gemini_flash']

    let patch: PatchResult | null = null
    let usedModel = selectedModel
    let validationWarnings: string[] = []

    for (const tryModel of modelsToTry) {
      try {
        const { text } = await generateText({
          model: getModel(tryModel),
          system: systemPrompt,
          prompt: fullUserMessage,
          maxOutputTokens: 8000,
        })
        const candidate = parsePatchJson(text)

        const validation = validatePatchOutput(candidate, existingFiles)
        if (!validation.valid) {
          console.warn(`[patch] validation failed on ${tryModel}:`, validation.errors)
          continue
        }
        validationWarnings = validation.warnings

        patch = candidate
        usedModel = tryModel
        break
      } catch (err) {
        console.warn(`[patch] model ${tryModel} failed:`, err instanceof Error ? err.message : err)
      }
    }

    if (!patch) {
      const fallback = generateFallbackProject(prompt, 'Patch failed, showing fallback')
      patch = { updates: fallback.files, newFiles: {}, deletedFiles: [], description: fallback.description }
    }

    const resultFiles = { ...existingFiles }
    for (const [k, v] of Object.entries(patch.updates)) resultFiles[k] = v
    for (const [k, v] of Object.entries(patch.newFiles)) resultFiles[k] = v
    for (const k of patch.deletedFiles) delete resultFiles[k]

    const changedFiles = [...Object.keys(patch.updates), ...Object.keys(patch.newFiles)]
    const importValidation = validateImports(resultFiles, changedFiles)
    const affectedFiles = getAffectedFiles(changedFiles, dependencyMap)

    if (!importValidation.valid) {
      console.warn('[patch] broken imports after patch:', importValidation.brokenImports)
      validationWarnings.push(...importValidation.brokenImports.map(b => b.reason))
    }

    let versionId = 'local'
    let versionNum = 1
    try {
      if (projectId) {
        const lastVersion = await anyDb.version.findFirst({
          where: { projectId },
          orderBy: { versionNum: 'desc' },
        })
        versionNum = (lastVersion?.versionNum ?? 0) + 1
        const version = await anyDb.version.create({
          data: {
            projectId, versionNum, prompt,
            files: resultFiles, model: usedModel,
            agent: routeAgent(prompt), creditsUsed: CREDIT_COSTS.improveCode,
          },
        })
        versionId = version.id
        await db.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } })
      }
    } catch (dbErr) {
      console.error('[patch] DB save failed:', dbErr)
    }

    return NextResponse.json({
      files: sanitizeFiles(resultFiles),
      patch,
      model: usedModel,
      versionId,
      versionNum,
      affectedFiles,
      warnings: validationWarnings,
      dependencyMap: Object.fromEntries(
        changedFiles.map(f => [f, dependencyMap[f] ?? []])
      ),
    })
  } catch (err) {
    // Refund on failure
    try {
      const isAdmin = user.role === 'admin' || (process.env.ADMIN_USER_IDS ?? '').split(',').includes(userId)
      if (!isAdmin) {
        await db.subscription.update({
          where: { userId: user.id },
          data: { creditsRemaining: { increment: CREDIT_COSTS.improveCode } },
        })
      }
    } catch { /* ignore */ }

    const msg = err instanceof Error ? err.message : 'Patch failed'
    console.error('[patch] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
