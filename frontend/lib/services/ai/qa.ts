// Stage 6 — QA Debugger
// Validates and auto-fixes generated files before preview

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface QAIssue {
  file: string
  type: 'syntax' | 'missing-import' | 'broken-ref' | 'empty' | 'ts-error'
  description: string
  severity: 'error' | 'warning'
}

export interface QAResult {
  files: Record<string, string>
  issues: QAIssue[]
  fixedCount: number
  passedCount: number
}

const QA_SYSTEM = `You are a code QA engineer. Fix issues in the provided file.
Return ONLY the corrected file content — no markdown, no explanation.
Rules:
- Fix all syntax errors
- Add missing closing tags/brackets
- Ensure Tailwind CDN is included in HTML files
- Fix broken JavaScript references
- Ensure all functions are properly closed
- Remove any markdown fences or code block markers`

/** Detect issues in a single file without AI */
function detectIssues(path: string, content: string): QAIssue[] {
  const issues: QAIssue[] = []

  if (!content || content.trim().length < 10) {
    issues.push({ file: path, type: 'empty', description: 'File is empty or too short', severity: 'error' })
    return issues
  }

  const ext = path.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'html') {
    if (!content.includes('<!DOCTYPE') && !content.includes('<html')) {
      issues.push({ file: path, type: 'syntax', description: 'Missing DOCTYPE or html tag', severity: 'error' })
    }
    if (!content.includes('tailwindcss') && !content.includes('tailwind')) {
      issues.push({ file: path, type: 'missing-import', description: 'Missing Tailwind CDN', severity: 'warning' })
    }
    // Check for unclosed tags (simple heuristic)
    const openDivs = (content.match(/<div/g) ?? []).length
    const closeDivs = (content.match(/<\/div>/g) ?? []).length
    if (Math.abs(openDivs - closeDivs) > 3) {
      issues.push({ file: path, type: 'syntax', description: `Unbalanced div tags (${openDivs} open, ${closeDivs} close)`, severity: 'warning' })
    }
  }

  if (ext === 'js') {
    // Check for unclosed braces
    const opens = (content.match(/\{/g) ?? []).length
    const closes = (content.match(/\}/g) ?? []).length
    if (Math.abs(opens - closes) > 2) {
      issues.push({ file: path, type: 'syntax', description: `Unbalanced braces (${opens} open, ${closes} close)`, severity: 'error' })
    }
    // Check for markdown fences accidentally included
    if (content.includes('```')) {
      issues.push({ file: path, type: 'syntax', description: 'Contains markdown code fences', severity: 'error' })
    }
  }

  if (content.includes('```')) {
    issues.push({ file: path, type: 'syntax', description: 'Contains markdown code fences', severity: 'error' })
  }

  return issues
}

/** Quick fix without AI — handles common issues */
function quickFix(path: string, content: string, issues: QAIssue[]): string {
  let fixed = content

  // Remove markdown fences
  if (fixed.includes('```')) {
    fixed = fixed.replace(/^```[\w]*\n?/gm, '').replace(/^```\n?/gm, '').trim()
  }

  const ext = path.split('.').pop()?.toLowerCase() ?? ''

  // Add Tailwind CDN to HTML if missing
  if (ext === 'html' && !fixed.includes('tailwindcss') && issues.some(i => i.type === 'missing-import')) {
    fixed = fixed.replace(
      '</head>',
      '  <script src="https://cdn.tailwindcss.com"><\/script>\n</head>'
    )
  }

  // Wrap bare HTML content in proper structure
  if (ext === 'html' && !fixed.includes('<!DOCTYPE') && !fixed.includes('<html')) {
    fixed = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body>
${fixed}
</body>
</html>`
  }

  return fixed
}

/** AI-powered fix for complex issues */
async function aiFix(
  path: string,
  content: string,
  issues: QAIssue[],
  modelId: ModelId,
): Promise<string> {
  const issueList = issues.map(i => `- ${i.type}: ${i.description}`).join('\n')
  try {
    const { text } = await generateText({
      model: getModel(modelId),
      system: QA_SYSTEM,
      prompt: `Fix this file: ${path}\n\nIssues found:\n${issueList}\n\nCurrent content:\n${content.slice(0, 6000)}`,
      maxOutputTokens: 8000,
    })
    return text.replace(/^```[\w]*\n?/gm, '').replace(/^```\n?/gm, '').trim()
  } catch {
    return content
  }
}

/** Validate and fix all generated files */
export async function validateAndFix(
  files: Record<string, string>,
  modelId: ModelId = 'gemini_flash',
  useAI = false,
): Promise<QAResult> {
  const result: QAResult = {
    files: { ...files },
    issues: [],
    fixedCount: 0,
    passedCount: 0,
  }

  for (const [path, content] of Object.entries(files)) {
    const issues = detectIssues(path, content)
    result.issues.push(...issues)

    const hasErrors = issues.some(i => i.severity === 'error')

    if (hasErrors) {
      // Always try quick fix first
      const quickFixed = quickFix(path, content, issues)
      const remainingIssues = detectIssues(path, quickFixed)

      if (remainingIssues.some(i => i.severity === 'error') && useAI) {
        // Fall back to AI fix for complex issues
        const aiFixed = await aiFix(path, quickFixed, remainingIssues, modelId)
        result.files[path] = aiFixed
      } else {
        result.files[path] = quickFixed
      }
      result.fixedCount++
    } else {
      result.passedCount++
    }
  }

  return result
}

/** Lightweight sync validation — no AI, no async */
export function validateSync(files: Record<string, string>): QAIssue[] {
  const issues: QAIssue[] = []
  for (const [path, content] of Object.entries(files)) {
    issues.push(...detectIssues(path, content))
  }
  return issues
}
