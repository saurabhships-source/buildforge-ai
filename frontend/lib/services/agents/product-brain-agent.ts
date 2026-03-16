/**
 * Product Brain Agent — interprets user prompt and determines product type, features, entities.
 * First agent in the multi-agent pipeline.
 */

import { interpretIdea } from '@/lib/services/ai/idea-interpreter'
import { runProductBrain } from '@/lib/services/ai/product-brain'
import { generateProductSpec } from '@/lib/services/ai/product-spec'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { ProductBrainOutput } from '@/lib/services/ai/product-brain'
import type { ProductSpec } from '@/lib/services/ai/product-spec'

export interface ProductBrainAgentResult {
  idea: Awaited<ReturnType<typeof interpretIdea>>
  brain: ProductBrainOutput
  spec: ProductSpec
  needsClarification: boolean
  clarificationQuestions: string[]
}

export async function runProductBrainAgent(
  prompt: string,
  modelId: ModelId = 'gemini_flash',
): Promise<ProductBrainAgentResult> {
  logger.info('ai-pipeline', '[ProductBrainAgent] Starting', prompt.slice(0, 60))

  const idea = await interpretIdea(prompt, modelId)
  const brain = await runProductBrain(idea, modelId)

  if (!brain.confidence || brain.confidence < 0.6) {
    return {
      idea,
      brain,
      spec: {} as ProductSpec,
      needsClarification: true,
      clarificationQuestions: brain.clarificationQuestions,
    }
  }

  const spec = await generateProductSpec(brain, modelId)

  logger.info('ai-pipeline', '[ProductBrainAgent] Done', `${spec.pages.length} pages, ${spec.entities.length} entities`)

  return {
    idea,
    brain,
    spec,
    needsClarification: false,
    clarificationQuestions: [],
  }
}
