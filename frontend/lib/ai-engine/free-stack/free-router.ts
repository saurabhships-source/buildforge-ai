// Free Stack Router — routes generation requests to the best available free model
// Priority: local (Ollama/LMStudio) → free cloud (Groq → Gemini → OpenRouter)
// Automatic fallback with metrics-based routing

import type { GenerateOptions, FreeModelId } from './types'
import { FALLBACK_CHAINS, DEFAULT_LOCAL_ASSIGNMENTS, DEFAULT_CLOUD_ASSIGNMENTS } from './model-catalog'
import { OllamaProvider, LMStudioProvider, GroqProvider, GeminiProvider, OpenRouterProvider } from './providers'
import { serverModelMetrics } from './model-metrics'
import { checkOllamaInstalled, checkLMStudioInstalled } from './ollama-manager'

export interface FreeRouterConfig {
  localAIOnly: boolean
  preferLocal: boolean
  ollamaBaseUrl?: string
  lmstudioBaseUrl?: string
  geminiApiKey?: string
  groqApiKey?: string
  openrouterApiKey?: string
}

// Singleton config (set from env or settings)
let routerConfig: FreeRouterConfig = {
  localAIOnly: false,
  preferLocal: true,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  lmstudioBaseUrl: process.env.LMSTUDIO_BASE_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
}

export function configureFreeRouter(config: Partial<FreeRouterConfig>): void {
  routerConfig = { ...routerConfig, ...config }
}

// Map FreeModelId → provider instance
function getProviderForModel(modelId: FreeModelId) {
  if (modelId === 'deepseek-coder' || modelId === 'codellama' || modelId === 'llama3' ||
      modelId === 'mistral' || modelId === 'mixtral' || modelId === 'phi3' ||
      modelId === 'gemma' || modelId === 'tinyllama' || modelId === 'qwen2' ||
      modelId === 'qwen2.5-coder' || modelId === 'starcoder2') {
    const tagMap: Record<string, string> = {
      'deepseek-coder': 'deepseek-coder:latest',
      'codellama': 'codellama:latest',
      'llama3': 'llama3:latest',
      'mistral': 'mistral:latest',
      'mixtral': 'mixtral:latest',
      'phi3': 'phi3:latest',
      'gemma': 'gemma:latest',
      'tinyllama': 'tinyllama:latest',
      'qwen2': 'qwen2:latest',
      'qwen2.5-coder': 'qwen2.5-coder:latest',
      'starcoder2': 'starcoder2:latest',
    }
    return new OllamaProvider(tagMap[modelId], routerConfig.ollamaBaseUrl)
  }
  if (modelId === 'gemini-flash') return new GeminiProvider('gemini-flash', routerConfig.geminiApiKey)
  if (modelId === 'gemini-pro') return new GeminiProvider('gemini-pro', routerConfig.geminiApiKey)
  if (modelId === 'groq-llama3') return new GroqProvider('groq-llama3', routerConfig.groqApiKey)
  if (modelId === 'groq-mixtral') return new GroqProvider('groq-mixtral', routerConfig.groqApiKey)
  if (modelId === 'groq-gemma') return new GroqProvider('groq-gemma', routerConfig.groqApiKey)
  if (modelId === 'openrouter-mistral') return new OpenRouterProvider('openrouter-mistral', routerConfig.openrouterApiKey)
  if (modelId === 'openrouter-deepseek') return new OpenRouterProvider('openrouter-deepseek', routerConfig.openrouterApiKey)
  return new GeminiProvider('gemini-flash', routerConfig.geminiApiKey)
}

/** Get the ordered fallback chain for an agent type */
function getFallbackChain(agentType: string, localAIOnly: boolean): FreeModelId[] {
  const chain = FALLBACK_CHAINS[agentType] ?? FALLBACK_CHAINS.builder
  if (localAIOnly) return chain.filter(m => !m.startsWith('gemini') && !m.startsWith('groq') && !m.startsWith('openrouter'))
  return chain
}

/** Get the preferred model for an agent */
function getPreferredModel(agentType: string, localAIOnly: boolean): FreeModelId {
  const assignments = localAIOnly ? DEFAULT_LOCAL_ASSIGNMENTS : DEFAULT_CLOUD_ASSIGNMENTS
  const key = agentType as keyof typeof assignments
  return assignments[key] ?? 'gemini-flash'
}

/** Core generation with automatic fallback */
export async function generateWithFallback(opts: {
  agentType: string
  system: string
  prompt: string
  maxTokens?: number
  temperature?: number
  localAIOnly?: boolean
}): Promise<{ text: string; modelUsed: FreeModelId; provider: string }> {
  const localOnly = opts.localAIOnly ?? routerConfig.localAIOnly
  const preferred = getPreferredModel(opts.agentType, localOnly)
  const chain = getFallbackChain(opts.agentType, localOnly)

  // Build ordered list: preferred first, then rest of chain (deduped)
  const ordered = [preferred, ...chain.filter(m => m !== preferred)]

  const genOpts: GenerateOptions = {
    system: opts.system,
    prompt: opts.prompt,
    maxTokens: opts.maxTokens ?? 8192,
    temperature: opts.temperature ?? 0.2,
  }

  for (const modelId of ordered) {
    const provider = getProviderForModel(modelId)
    const start = Date.now()
    try {
      const available = await provider.isAvailable()
      if (!available) continue

      const text = await provider.generate(genOpts)
      const latency = Date.now() - start
      serverModelMetrics.record(modelId, provider.name, latency, true)
      console.log(`[free-router] ${modelId} (${provider.name}) succeeded in ${latency}ms`)
      return { text, modelUsed: modelId, provider: provider.name }
    } catch (err) {
      const latency = Date.now() - start
      const msg = err instanceof Error ? err.message : String(err)
      serverModelMetrics.record(modelId, provider.name, latency, false, msg)
      console.warn(`[free-router] ${modelId} failed: ${msg} — trying next`)
    }
  }

  throw new Error(`All models exhausted for agent "${opts.agentType}". Check your API keys and local runtime.`)
}

/** Detect which runtimes are available */
export async function detectAvailableRuntimes(): Promise<{
  ollama: boolean
  lmstudio: boolean
  gemini: boolean
  groq: boolean
  openrouter: boolean
}> {
  const [ollama, lmstudio] = await Promise.all([
    checkOllamaInstalled(),
    checkLMStudioInstalled(),
  ])
  return {
    ollama,
    lmstudio,
    gemini: !!routerConfig.geminiApiKey,
    groq: !!routerConfig.groqApiKey,
    openrouter: !!routerConfig.openrouterApiKey,
  }
}
