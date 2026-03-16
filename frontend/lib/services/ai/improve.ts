// AI Code Improver — applies targeted improvements to existing code
// Feature 8: "Improve with AI" button

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface ImproveResult {
  content: string
  summary: string
  changesApplied: string[]
}

const IMPROVE_SYSTEM = `You are an expert code improver. Apply the requested improvement to the provided code.
Rules:
- Return ONLY the complete improved file content — no markdown, no explanation
- Preserve all existing functionality unless explicitly asked to change it
- Apply the design system: Tailwind CSS, modern UI patterns, smooth animations
- Make improvements surgical and targeted`

export async function improveCode(
  fileContent: string,
  instruction: string,
  filePath: string,
  modelId: ModelId = 'gemini_flash',
): Promise<ImproveResult> {
  const prompt = `File: ${filePath}

Current code:
${fileContent}

Improvement instruction: "${instruction}"

Return the complete improved file content only.`

  try {
    const { text } = await generateText({
      model: getModel(modelId),
      system: IMPROVE_SYSTEM,
      prompt,
      maxOutputTokens: 8000,
    })

    const content = text.trim()
    return {
      content,
      summary: `Applied: ${instruction}`,
      changesApplied: [instruction],
    }
  } catch (err) {
    console.warn('[improve] AI failed:', err)
    return { content: fileContent, summary: 'Improvement failed — original preserved', changesApplied: [] }
  }
}

/** Explain a code block in natural language */
export async function explainCode(
  codeBlock: string,
  filePath: string,
  modelId: ModelId = 'gemini_flash',
): Promise<string> {
  try {
    const { text } = await generateText({
      model: getModel(modelId),
      system: 'You are a code explainer. Explain code clearly and concisely in plain English. Focus on what it does, not how it works line by line.',
      prompt: `Explain this code from ${filePath}:\n\n${codeBlock}`,
      maxOutputTokens: 500,
    })
    return text.trim()
  } catch {
    return 'Unable to explain code at this time.'
  }
}

/** Debug code — find and fix errors */
export async function debugCode(
  errorMessage: string,
  codeSnippet: string,
  modelId: ModelId = 'gemini_flash',
): Promise<{ explanation: string; fixedCode: string }> {
  try {
    const { text } = await generateText({
      model: getModel(modelId),
      system: `You are an expert debugger. Return JSON: { "explanation": "what caused the error", "fixedCode": "complete fixed code" }. No markdown.`,
      prompt: `Error: ${errorMessage}\n\nCode:\n${codeSnippet}`,
      maxOutputTokens: 2000,
    })
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { explanation: 'Could not analyze error automatically.', fixedCode: codeSnippet }
  }
}
