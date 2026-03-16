// Free model catalog — all supported models with metadata
import type { ModelInfo, AgentModelAssignment } from './types'

export const MODEL_CATALOG: ModelInfo[] = [
  // ── Ollama local models ──────────────────────────────────────────────────
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 16384, bestFor: ['codegen', 'builder', 'architect'], ollamaTag: 'deepseek-coder:latest' },
  { id: 'codellama', name: 'Code Llama', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 16384, bestFor: ['codegen', 'debugger', 'refactor'], ollamaTag: 'codellama:latest' },
  { id: 'llama3', name: 'Llama 3', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 8192, bestFor: ['planner', 'general', 'analysis'], ollamaTag: 'llama3:latest' },
  { id: 'mistral', name: 'Mistral 7B', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 8192, bestFor: ['optimizer', 'refactor', 'general'], ollamaTag: 'mistral:latest' },
  { id: 'mixtral', name: 'Mixtral 8x7B', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 32768, bestFor: ['architect', 'planner', 'complex'], ollamaTag: 'mixtral:latest' },
  { id: 'phi3', name: 'Phi-3 Mini', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 4096, bestFor: ['tester', 'utility', 'fast'], ollamaTag: 'phi3:latest' },
  { id: 'gemma', name: 'Gemma 2B', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 8192, bestFor: ['ui', 'seo', 'content'], ollamaTag: 'gemma:latest' },
  { id: 'tinyllama', name: 'TinyLlama', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 2048, bestFor: ['utility', 'fast', 'simple'], ollamaTag: 'tinyllama:latest' },
  { id: 'qwen2', name: 'Qwen2', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 32768, bestFor: ['security', 'analysis', 'multilingual'], ollamaTag: 'qwen2:latest' },
  { id: 'qwen2.5-coder', name: 'Qwen2.5 Coder', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 32768, bestFor: ['codegen', 'builder', 'fullstack'], ollamaTag: 'qwen2.5-coder:latest' },
  { id: 'starcoder2', name: 'StarCoder2', provider: 'ollama', isLocal: true, isFree: true, contextWindow: 16384, bestFor: ['codegen', 'completion', 'fallback'], ollamaTag: 'starcoder2:latest' },
  // ── Gemini free tier ─────────────────────────────────────────────────────
  { id: 'gemini-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', isLocal: false, isFree: true, contextWindow: 1000000, bestFor: ['general', 'fast', 'builder'] },
  { id: 'gemini-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', isLocal: false, isFree: true, contextWindow: 2000000, bestFor: ['complex', 'architect', 'planner'] },
  // ── Groq free tier ───────────────────────────────────────────────────────
  { id: 'groq-llama3', name: 'Llama 3 (Groq)', provider: 'groq', isLocal: false, isFree: true, contextWindow: 8192, bestFor: ['fast', 'general', 'planner'] },
  { id: 'groq-mixtral', name: 'Mixtral (Groq)', provider: 'groq', isLocal: false, isFree: true, contextWindow: 32768, bestFor: ['architect', 'complex', 'analysis'] },
  { id: 'groq-gemma', name: 'Gemma (Groq)', provider: 'groq', isLocal: false, isFree: true, contextWindow: 8192, bestFor: ['ui', 'content', 'seo'] },
  // ── OpenRouter free models ───────────────────────────────────────────────
  { id: 'openrouter-mistral', name: 'Mistral (OpenRouter)', provider: 'openrouter', isLocal: false, isFree: true, contextWindow: 8192, bestFor: ['general', 'fallback'] },
  { id: 'openrouter-deepseek', name: 'DeepSeek (OpenRouter)', provider: 'openrouter', isLocal: false, isFree: true, contextWindow: 16384, bestFor: ['codegen', 'fallback'] },
]

// Default agent → model assignments (local-first)
export const DEFAULT_LOCAL_ASSIGNMENTS: AgentModelAssignment = {
  planner: 'llama3',
  architect: 'mixtral',
  builder: 'qwen2.5-coder',
  debugger: 'codellama',
  optimizer: 'mistral',
  tester: 'phi3',
  ui: 'gemma',
  security: 'qwen2',
  seo: 'gemma',
  utility: 'tinyllama',
}

export const DEFAULT_CLOUD_ASSIGNMENTS: AgentModelAssignment = {
  planner: 'groq-llama3',
  architect: 'groq-mixtral',
  builder: 'gemini-flash',
  debugger: 'gemini-flash',
  optimizer: 'groq-mixtral',
  tester: 'groq-gemma',
  ui: 'groq-gemma',
  security: 'gemini-pro',
  seo: 'groq-gemma',
  utility: 'gemini-flash',
}

// Fallback chains per agent — tried in order on failure
export const FALLBACK_CHAINS: Record<string, FreeModelId[]> = {
  builder: ['qwen2.5-coder', 'deepseek-coder', 'codellama', 'starcoder2', 'gemini-flash', 'groq-llama3'],
  planner: ['llama3', 'mixtral', 'groq-llama3', 'gemini-flash'],
  architect: ['mixtral', 'llama3', 'groq-mixtral', 'gemini-pro'],
  debugger: ['codellama', 'deepseek-coder', 'starcoder2', 'gemini-flash'],
  optimizer: ['mistral', 'mixtral', 'groq-mixtral', 'gemini-flash'],
  tester: ['phi3', 'tinyllama', 'groq-gemma', 'gemini-flash'],
  ui: ['gemma', 'phi3', 'groq-gemma', 'gemini-flash'],
  security: ['qwen2', 'mistral', 'gemini-pro', 'groq-mixtral'],
  seo: ['gemma', 'tinyllama', 'groq-gemma', 'gemini-flash'],
  utility: ['tinyllama', 'phi3', 'gemini-flash'],
}

import type { FreeModelId } from './types'

export function getModelInfo(id: FreeModelId): ModelInfo | undefined {
  return MODEL_CATALOG.find(m => m.id === id)
}

export function getLocalModels(): ModelInfo[] {
  return MODEL_CATALOG.filter(m => m.isLocal)
}

export function getCloudModels(): ModelInfo[] {
  return MODEL_CATALOG.filter(m => !m.isLocal)
}
