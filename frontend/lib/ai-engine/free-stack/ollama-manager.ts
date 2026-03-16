// Ollama Manager — detect, list, download, and run local Ollama models
// Server-side only (Node.js fetch)

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

export interface OllamaPullProgress {
  status: string
  completed?: number
  total?: number
  digest?: string
}

/** Check if Ollama is running and reachable */
export async function checkOllamaInstalled(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

/** List all locally installed Ollama models */
export async function listLocalModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return []
    const data = await res.json() as { models: OllamaModel[] }
    return data.models ?? []
  } catch {
    return []
  }
}

/** Check if a specific model is installed */
export async function isModelInstalled(modelTag: string): Promise<boolean> {
  const models = await listLocalModels()
  return models.some(m => m.name === modelTag || m.name.startsWith(modelTag.split(':')[0]))
}

/** Pull (download) a model — returns an async generator of progress events */
export async function* downloadModel(modelTag: string): AsyncGenerator<OllamaPullProgress> {
  const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelTag, stream: true }),
  })
  if (!res.ok || !res.body) {
    yield { status: `Error: ${res.statusText}` }
    return
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try { yield JSON.parse(line) as OllamaPullProgress } catch { /* skip */ }
    }
  }
}

/** Run a prompt through a local Ollama model */
export async function runLocalModel(opts: {
  model: string
  system: string
  prompt: string
  temperature?: number
}): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model,
      system: opts.system,
      prompt: opts.prompt,
      stream: false,
      options: { temperature: opts.temperature ?? 0.2, num_predict: 8192 },
    }),
  })
  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${res.statusText}`)
  const data = await res.json() as { response: string }
  return data.response
}

/** Check LM Studio availability (OpenAI-compatible at port 1234) */
export async function checkLMStudioInstalled(): Promise<boolean> {
  const base = process.env.LMSTUDIO_BASE_URL ?? 'http://localhost:1234'
  try {
    const res = await fetch(`${base}/v1/models`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

/** List LM Studio loaded models */
export async function listLMStudioModels(): Promise<string[]> {
  const base = process.env.LMSTUDIO_BASE_URL ?? 'http://localhost:1234'
  try {
    const res = await fetch(`${base}/v1/models`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return []
    const data = await res.json() as { data: { id: string }[] }
    return data.data?.map(m => m.id) ?? []
  } catch {
    return []
  }
}
