// Shared types for the builder — extracted to break circular imports
// between builder/page.tsx and builder component files

export type AppType = 'website' | 'tool' | 'saas' | 'dashboard' | 'ai_app' | 'crm' | 'internal_tool'
export type ModelId =
  | 'gpt4o' | 'gpt4o_mini' | 'gemini_flash' | 'gemini_pro' | 'ollama' | 'lmstudio'
  | 'deepseek_coder' | 'codellama' | 'llama3' | 'mistral' | 'mixtral'
  | 'phi3' | 'gemma' | 'tinyllama' | 'qwen2' | 'starcoder2'
  | 'groq_llama3' | 'groq_mixtral' | 'groq_gemma'
  | 'openrouter_mistral' | 'openrouter_deepseek'
export type AgentType =
  | 'builder'
  | 'refactor'
  | 'ui'
  | 'ux'
  | 'deploy'
  | 'debug'
  | 'security'
  | 'github'
  | 'seo'
  | 'startup'
  | 'performance'

export interface ProjectFiles {
  [filename: string]: string
}

export interface Version {
  id: string
  versionNum: number
  prompt: string
  agent: AgentType
  createdAt: string
}
