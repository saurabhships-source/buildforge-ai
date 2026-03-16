import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

export type ModelId =
  | 'gpt4o' | 'gpt4o_mini'
  | 'gemini_flash' | 'gemini_pro'
  | 'ollama' | 'lmstudio'
  // Free stack model IDs
  | 'deepseek_coder' | 'codellama' | 'llama3' | 'mistral' | 'mixtral'
  | 'phi3' | 'gemma' | 'tinyllama' | 'qwen2' | 'starcoder2'
  | 'groq_llama3' | 'groq_mixtral' | 'groq_gemma'
  | 'openrouter_mistral' | 'openrouter_deepseek'

export type AgentType = 'builder' | 'refactor' | 'ui' | 'ux' | 'deploy' | 'debug' | 'security' | 'github' | 'seo' | 'startup' | 'performance'
export type AdapterType = 'openai' | 'gemini' | 'ollama' | 'lmstudio' | 'codeium' | 'continue' | 'tabby' | 'stackblitz' | 'groq' | 'openrouter'
export type TaskType = 'codegen' | 'repo_analysis' | 'completion' | 'ui_improvement' | 'testing' | 'security'

// Map new free-stack model IDs to their FreeModelId equivalents
export const FREE_STACK_MODEL_MAP: Record<string, string> = {
  deepseek_coder: 'deepseek-coder',
  codellama: 'codellama',
  llama3: 'llama3',
  mistral: 'mistral',
  mixtral: 'mixtral',
  phi3: 'phi3',
  gemma: 'gemma',
  tinyllama: 'tinyllama',
  qwen2: 'qwen2',
  starcoder2: 'starcoder2',
  groq_llama3: 'groq-llama3',
  groq_mixtral: 'groq-mixtral',
  groq_gemma: 'groq-gemma',
  openrouter_mistral: 'openrouter-mistral',
  openrouter_deepseek: 'openrouter-deepseek',
  gemini_flash: 'gemini-flash',
  gemini_pro: 'gemini-pro',
}

// Agent → preferred free model assignment
export const AGENT_MODEL_MAP: Record<AgentType, string> = {
  builder: 'deepseek-coder',
  refactor: 'mistral',
  ui: 'gemma',
  ux: 'gemma',
  deploy: 'tinyllama',
  debug: 'codellama',
  security: 'qwen2',
  github: 'llama3',
  seo: 'gemma',
  startup: 'mixtral',
  performance: 'mistral',
}

export function getModel(modelId: ModelId): LanguageModel {
  switch (modelId) {
    case 'gpt4o': {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
      return openai('gpt-4o') as unknown as LanguageModel
    }
    case 'gpt4o_mini': {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
      return openai('gpt-4o-mini') as unknown as LanguageModel
    }
    case 'gemini_flash': {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
      return google('gemini-1.5-flash') as unknown as LanguageModel
    }
    case 'gemini_pro': {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
      return google('gemini-1.5-pro') as unknown as LanguageModel
    }
    // All local/free models fall back to gemini_flash for Vercel AI SDK compatibility
    // Actual generation is handled by generateWithFallback() in free-router.ts
    default: {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
      return google('gemini-1.5-flash') as unknown as LanguageModel
    }
  }
}

/** Check if a modelId belongs to the free stack */
export function isFreeStackModel(modelId: ModelId): boolean {
  return modelId in FREE_STACK_MODEL_MAP || modelId === 'ollama' || modelId === 'lmstudio'
}

/** Convert ModelId to FreeModelId string */
export function toFreeModelId(modelId: ModelId): string {
  if (modelId === 'ollama') return 'deepseek-coder'
  if (modelId === 'lmstudio') return 'deepseek-coder'
  return FREE_STACK_MODEL_MAP[modelId] ?? 'gemini-flash'
}

export function selectModel(plan: string, requested?: ModelId, localMode?: boolean): ModelId {
  if (localMode) return 'ollama'
  if (requested) return requested
  // Default to free Gemini flash — no paid API needed
  if (plan === 'enterprise') return 'gemini_pro'
  return 'gemini_flash'
}

export function routeAgent(prompt: string): AgentType {
  const p = prompt.toLowerCase()
  if (/fix|error|bug|broken|crash|undefined|null|exception/.test(p)) return 'debug'
  if (/deploy|vercel|netlify|publish|host|go live/.test(p)) return 'deploy'
  if (/security|vulnerability|xss|injection|exposed|unsafe/.test(p)) return 'security'
  if (/ux|user experience|accessibility|a11y|mobile|responsive|flow/.test(p)) return 'ux'
  if (/design|style|color|layout|ui|look|theme|font|spacing/.test(p)) return 'ui'
  if (/refactor|clean|improve|optimize|rewrite|simplify|performance/.test(p)) return 'refactor'
  if (/github|commit|push|repo|branch|git/.test(p)) return 'github'
  if (/seo|sitemap|robots|meta|schema|opengraph|search engine/.test(p)) return 'seo'
  if (/startup|saas product|full stack|complete app|landing page.*billing/.test(p)) return 'startup'
  if (/performance|speed|load time|bundle|optimize|lazy|cache/.test(p)) return 'performance'
  return 'builder'
}

export function routeByTask(taskType: TaskType, localMode: boolean): AdapterType {
  if (localMode) {
    if (taskType === 'completion') return 'tabby'
    return 'ollama'
  }
  switch (taskType) {
    case 'codegen': return 'openai'
    case 'repo_analysis': return 'continue'
    case 'completion': return 'tabby'
    case 'ui_improvement': return 'openai'
    case 'testing': return 'stackblitz'
    case 'security': return 'openai'
    default: return 'gemini'
  }
}
