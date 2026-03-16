// Centralized AI request wrapper — timeout, retry, JSON parsing, fallback

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import { logger } from './logger'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface AIRequestOptions {
  system: string
  prompt: string
  modelId?: ModelId
  maxOutputTokens?: number
  timeoutMs?: number
  retries?: number
}

/** Strip markdown fences from AI output */
export function stripFences(text: string): string {
  return text.replace(/^```[\w]*\n?/gm, '').replace(/^```\n?/gm, '').trim()
}

/** Parse JSON from AI output, stripping fences first */
export function parseAIJson<T>(text: string): T {
  return JSON.parse(stripFences(text)) as T
}

/** Execute an AI text generation request with timeout + retry */
export async function aiRequest(opts: AIRequestOptions): Promise<string> {
  const {
    system,
    prompt,
    modelId = 'gemini_flash',
    maxOutputTokens = 4000,
    timeoutMs = 25_000,
    retries = 2,
  } = opts

  const run = async (): Promise<string> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const { text } = await generateText({
        model: getModel(modelId),
        system,
        prompt,
        maxOutputTokens,
        abortSignal: controller.signal,
      })
      return text
    } finally {
      clearTimeout(timer)
    }
  }

  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await run()
      if (attempt > 0) {
        logger.info('ai-pipeline', `AI request succeeded on attempt ${attempt + 1}`)
      }
      return result
    } catch (err) {
      lastErr = err
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt)))
      }
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : 'AI request failed'
  logger.error('ai-pipeline', `AI request failed after ${retries + 1} attempts`, msg)
  throw lastErr
}

/** Execute an AI request and parse the result as JSON, with a fallback */
export async function aiJsonRequest<T>(
  opts: AIRequestOptions,
  fallback: () => T,
): Promise<T> {
  try {
    const text = await aiRequest(opts)
    return parseAIJson<T>(text)
  } catch (err) {
    logger.warn('ai-pipeline', 'AI JSON request failed, using fallback', err instanceof Error ? err.message : String(err))
    return fallback()
  }
}
