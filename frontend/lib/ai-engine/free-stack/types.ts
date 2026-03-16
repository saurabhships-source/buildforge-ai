// Free AI Stack — unified types for all providers and model management

export type LocalRuntime = 'ollama' | 'lmstudio'
export type CloudProvider = 'gemini' | 'groq' | 'openrouter'
export type FreeModelId =
  // Ollama local models
  | 'deepseek-coder' | 'codellama' | 'llama3' | 'mistral' | 'mixtral'
  | 'phi3' | 'gemma' | 'tinyllama' | 'qwen2' | 'starcoder2'
  // Cloud free tier
  | 'gemini-flash' | 'gemini-pro'
  | 'groq-llama3' | 'groq-mixtral' | 'groq-gemma'
  | 'openrouter-mistral' | 'openrouter-deepseek'

export type AgentModelAssignment = {
  planner: FreeModelId
  architect: FreeModelId
  builder: FreeModelId
  debugger: FreeModelId
  optimizer: FreeModelId
  tester: FreeModelId
  ui: FreeModelId
  security: FreeModelId
  seo: FreeModelId
  utility: FreeModelId
}

export interface ModelInfo {
  id: FreeModelId
  name: string
  provider: 'ollama' | 'lmstudio' | 'gemini' | 'groq' | 'openrouter'
  isLocal: boolean
  isFree: boolean
  contextWindow: number
  bestFor: string[]
  ollamaTag?: string  // e.g. "deepseek-coder:latest"
}

export interface ProviderStatus {
  name: string
  available: boolean
  models: string[]
  latencyMs?: number
  error?: string
}

export interface ModelUsageMetric {
  modelId: string
  provider: string
  successCount: number
  errorCount: number
  totalLatencyMs: number
  avgLatencyMs: number
  lastUsed: string
  lastError?: string
}

export interface FreeStackConfig {
  localAIOnly: boolean
  preferredRuntime: LocalRuntime
  enabledProviders: {
    ollama: boolean
    lmstudio: boolean
    gemini: boolean
    groq: boolean
    openrouter: boolean
  }
  apiKeys: {
    gemini?: string
    groq?: string
    openrouter?: string
  }
  agentAssignments: Partial<AgentModelAssignment>
  installedModels: string[]
}

export interface GenerateOptions {
  system: string
  prompt: string
  maxTokens?: number
  temperature?: number
}

export interface FreeProvider {
  name: string
  isAvailable(): Promise<boolean>
  generate(opts: GenerateOptions): Promise<string>
  listModels?(): Promise<string[]>
}
