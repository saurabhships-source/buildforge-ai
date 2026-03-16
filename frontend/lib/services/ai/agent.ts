// Feature 1 — Autonomous AI Agent
// Iteratively reads, analyzes, and improves project files

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface AgentIteration {
  iteration: number
  analysis: string
  filesChanged: string[]
  improvement: string
}

export interface AgentRunResult {
  files: Record<string, string>
  iterations: AgentIteration[]
  summary: string
  initialScore: number
  finalScore: number
}

const AGENT_SYSTEM = `You are an autonomous AI software engineer. Your job is to analyze a project and improve it.

Each iteration you must:
1. Identify the most impactful improvement
2. Apply it to the relevant files
3. Return the updated files

Return JSON:
{
  "analysis": "what you found and what you're improving",
  "improvement": "one sentence summary of change",
  "files": { "filename": "complete updated file content" }
}

Rules:
- Only return files that changed
- Return complete file content, never partial
- Focus on: UI quality, functionality, performance, accessibility
- Use Tailwind CSS, modern HTML/JS patterns
- No markdown fences in response`

function scoreProject(files: Record<string, string>): number {
  let score = 40
  const content = Object.values(files).join('\n')
  if (/tailwind|class=/.test(content)) score += 10
  if (/animation|transition/.test(content)) score += 5
  if (/<nav|navbar/i.test(content)) score += 5
  if (/responsive|md:|lg:/.test(content)) score += 10
  if (/dark:|dark-mode/.test(content)) score += 5
  if (/meta.*description|og:title/.test(content)) score += 5
  if (/hover:|focus:/.test(content)) score += 5
  if (Object.keys(files).length > 1) score += 10
  return Math.min(score, 100)
}

export async function runAutonomousAgent(
  files: Record<string, string>,
  goal: string,
  opts: {
    maxIterations?: number
    modelId?: ModelId
    onIteration?: (iter: AgentIteration, currentFiles: Record<string, string>) => void
  } = {},
): Promise<AgentRunResult> {
  const { maxIterations = 3, modelId = 'gemini_flash', onIteration } = opts
  const initialScore = scoreProject(files)
  let currentFiles = { ...files }
  const iterations: AgentIteration[] = []

  for (let i = 0; i < maxIterations; i++) {
    const filesContext = Object.entries(currentFiles)
      .map(([k, v]) => `=== ${k} ===\n${v.slice(0, 2000)}`)
      .join('\n\n')

    const prompt = `Goal: "${goal}"
Iteration: ${i + 1}/${maxIterations}

Current project files:
${filesContext}

Analyze and apply the most impactful improvement.`

    try {
      const { text } = await generateText({
        model: getModel(modelId),
        system: AGENT_SYSTEM,
        prompt,
        maxOutputTokens: 8000,
      })

      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const result = JSON.parse(cleaned) as {
        analysis: string
        improvement: string
        files: Record<string, string>
      }

      const changedFiles = Object.keys(result.files ?? {})
      if (changedFiles.length > 0) {
        currentFiles = { ...currentFiles, ...result.files }
      }

      const iter: AgentIteration = {
        iteration: i + 1,
        analysis: result.analysis ?? '',
        filesChanged: changedFiles,
        improvement: result.improvement ?? '',
      }
      iterations.push(iter)
      onIteration?.(iter, currentFiles)
    } catch (err) {
      console.warn(`[agent] iteration ${i + 1} failed:`, err)
      iterations.push({
        iteration: i + 1,
        analysis: 'Iteration failed',
        filesChanged: [],
        improvement: 'No changes applied',
      })
    }
  }

  const finalScore = scoreProject(currentFiles)
  const summary = iterations
    .filter(it => it.filesChanged.length > 0)
    .map(it => it.improvement)
    .join('; ') || 'No improvements applied'

  return { files: currentFiles, iterations, summary, initialScore, finalScore }
}
