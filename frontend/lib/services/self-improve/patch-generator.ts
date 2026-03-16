// Patch Generator — uses AI to generate minimal code changes from a feature plan

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { FeaturePlan } from './feature-planner'

export interface PatchFile {
  path: string
  changes: string
  explanation: string
  isNew: boolean
}

export interface GeneratedPatch {
  id: string
  planId: string
  featureName: string
  files: PatchFile[]
  generatedAt: string
  model: string
  tokensUsed?: number
}

const PATCH_SYSTEM = `You are a senior TypeScript engineer generating minimal, safe code patches.

Rules:
- Return ONLY valid JSON — no markdown, no explanation outside JSON
- Generate the MINIMAL change needed — do not rewrite entire files
- All code must be TypeScript-safe and follow Next.js App Router conventions
- Never modify auth, payments, or database schema files
- Use Tailwind CSS for any UI changes

Return format:
{
  "files": [
    {
      "path": "relative/path/to/file.tsx",
      "changes": "complete new file content OR unified diff",
      "explanation": "what changed and why",
      "isNew": false
    }
  ]
}`

export async function generatePatch(
  plan: FeaturePlan,
  modelId: ModelId = 'gemini_flash',
): Promise<GeneratedPatch> {
  if (plan.safetyLevel === 'blocked') {
    throw new Error(`Patch blocked: ${plan.blockedReason}`)
  }

  const allFiles = [...plan.filesToCreate, ...plan.filesToModify]
  const prompt = `Generate a code patch for this improvement:

Feature: ${plan.featureName}
Description: ${plan.description}
Estimated lines changed: ${plan.estimatedLinesChanged}

Files to create:
${plan.filesToCreate.map(f => `- ${f.path}: ${f.description}`).join('\n') || 'none'}

Files to modify:
${plan.filesToModify.map(f => `- ${f.path}: ${f.description}`).join('\n') || 'none'}

Test strategy: ${plan.testStrategy}

Generate the minimal code changes needed. For new files, provide complete content. For modifications, provide the complete updated file content.`

  try {
    const { text, usage } = await generateText({
      model: getModel(modelId),
      system: PATCH_SYSTEM,
      prompt,
      maxOutputTokens: 6000,
    })

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned) as { files: PatchFile[] }

    return {
      id: `patch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      planId: plan.id,
      featureName: plan.featureName,
      files: parsed.files ?? [],
      generatedAt: new Date().toISOString(),
      model: modelId,
      tokensUsed: usage?.totalTokens,
    }
  } catch (err) {
    console.warn('[patch-generator] AI failed, building heuristic patch:', err)
    return buildHeuristicPatch(plan, allFiles, modelId)
  }
}

function buildHeuristicPatch(
  plan: FeaturePlan,
  allFiles: FeaturePlan['filesToCreate'],
  modelId: ModelId,
): GeneratedPatch {
  const files: PatchFile[] = allFiles.map(f => ({
    path: f.path,
    changes: f.action === 'create'
      ? `// ${f.path}\n// TODO: Implement — ${f.description}\nexport {}`
      : `// Patch for ${f.path}\n// ${f.description}\n// Manual implementation required`,
    explanation: f.description,
    isNew: f.action === 'create',
  }))

  return {
    id: `patch-heuristic-${Date.now()}`,
    planId: plan.id,
    featureName: plan.featureName,
    files,
    generatedAt: new Date().toISOString(),
    model: modelId,
  }
}
