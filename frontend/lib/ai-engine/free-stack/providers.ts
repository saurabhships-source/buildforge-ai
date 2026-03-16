// Free AI Providers — Groq, OpenRouter, and enhanced Gemini
// All follow the unified FreeProvider interface

import type { FreeProvider, GenerateOptions } from './types'

// ── Groq Provider (free tier — very fast inference) ───────────────────────────

const GROQ_MODELS: Record<string, string> = {
  'groq-llama3': 'llama3-8b-8192',
  'groq-mixtral': 'mixtral-8x7b-32768',
  'groq-gemma': 'gemma-7b-it',
}

export class GroqProvider implements FreeProvider {
  name = 'Groq'
  private apiKey: string
  private modelId: string

  constructor(modelId = 'groq-llama3', apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GROQ_API_KEY ?? ''
    this.modelId = GROQ_MODELS[modelId] ?? 'llama3-8b-8192'
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async generate(opts: GenerateOptions): Promise<string> {
    if (!this.apiKey) throw new Error('Groq API key not configured')
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.prompt },
        ],
        max_tokens: opts.maxTokens ?? 8192,
        temperature: opts.temperature ?? 0.2,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error ${res.status}: ${err}`)
    }
    const data = await res.json() as { choices: { message: { content: string } }[] }
    return data.choices[0]?.message?.content ?? ''
  }

  async listModels(): Promise<string[]> {
    return Object.keys(GROQ_MODELS)
  }
}

// ── OpenRouter Provider (free models available) ───────────────────────────────

const OPENROUTER_MODELS: Record<string, string> = {
  'openrouter-mistral': 'mistralai/mistral-7b-instruct:free',
  'openrouter-deepseek': 'deepseek/deepseek-coder:free',
}

export class OpenRouterProvider implements FreeProvider {
  name = 'OpenRouter'
  private apiKey: string
  private modelId: string

  constructor(modelId = 'openrouter-mistral', apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENROUTER_API_KEY ?? ''
    this.modelId = OPENROUTER_MODELS[modelId] ?? 'mistralai/mistral-7b-instruct:free'
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async generate(opts: GenerateOptions): Promise<string> {
    if (!this.apiKey) throw new Error('OpenRouter API key not configured')
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://buildforge.ai',
        'X-Title': 'BuildForge AI',
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.prompt },
        ],
        max_tokens: opts.maxTokens ?? 8192,
        temperature: opts.temperature ?? 0.2,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenRouter error ${res.status}: ${err}`)
    }
    const data = await res.json() as { choices: { message: { content: string } }[] }
    return data.choices[0]?.message?.content ?? ''
  }

  async listModels(): Promise<string[]> {
    return Object.keys(OPENROUTER_MODELS)
  }
}

// ── Gemini Provider (free tier) ───────────────────────────────────────────────

export class GeminiProvider implements FreeProvider {
  name = 'Gemini'
  private apiKey: string
  private modelName: string

  constructor(modelId: 'gemini-flash' | 'gemini-pro' = 'gemini-flash', apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY ?? ''
    this.modelName = modelId === 'gemini-pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash'
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async generate(opts: GenerateOptions): Promise<string> {
    if (!this.apiKey) throw new Error('Gemini API key not configured')
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: opts.system }] },
        contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 8192,
          temperature: opts.temperature ?? 0.2,
        },
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini error ${res.status}: ${err}`)
    }
    const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] }
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }
}

// ── Ollama Provider (local) ───────────────────────────────────────────────────

export class OllamaProvider implements FreeProvider {
  name = 'Ollama'
  private baseUrl: string
  private model: string

  constructor(model = 'deepseek-coder:latest', baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
    this.model = model
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(2000) })
      return res.ok
    } catch { return false }
  }

  async generate(opts: GenerateOptions): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        system: opts.system,
        prompt: opts.prompt,
        stream: false,
        options: { temperature: opts.temperature ?? 0.2, num_predict: opts.maxTokens ?? 8192 },
      }),
    })
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${res.statusText}`)
    const data = await res.json() as { response: string }
    return data.response
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) return []
      const data = await res.json() as { models: { name: string }[] }
      return data.models?.map(m => m.name) ?? []
    } catch { return [] }
  }
}

// ── LM Studio Provider (local, OpenAI-compatible) ────────────────────────────

export class LMStudioProvider implements FreeProvider {
  name = 'LM Studio'
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.LMSTUDIO_BASE_URL ?? 'http://localhost:1234'
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/models`, { signal: AbortSignal.timeout(2000) })
      return res.ok
    } catch { return false }
  }

  async generate(opts: GenerateOptions): Promise<string> {
    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'local-model',
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.prompt },
        ],
        max_tokens: opts.maxTokens ?? 8192,
        temperature: opts.temperature ?? 0.2,
      }),
    })
    if (!res.ok) throw new Error(`LM Studio error ${res.status}: ${res.statusText}`)
    const data = await res.json() as { choices: { message: { content: string } }[] }
    return data.choices[0]?.message?.content ?? ''
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/models`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) return []
      const data = await res.json() as { data: { id: string }[] }
      return data.data?.map(m => m.id) ?? []
    } catch { return [] }
  }
}
