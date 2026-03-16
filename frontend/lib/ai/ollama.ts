// Ollama local AI service — direct interface to the Ollama API
// Runs at http://localhost:11434 by default

const BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5-coder'

export interface OllamaGenerateOptions {
  model?: string
  system?: string
  prompt: string
  stream?: boolean
  temperature?: number
  maxTokens?: number
}

/**
 * Generate text using a locally running Ollama model.
 * Returns the response string, or null on failure.
 */
export async function generateWithOllama(
  prompt: string,
  options: Omit<OllamaGenerateOptions, 'prompt'> = {}
): Promise<string | null> {
  const model = options.model ?? DEFAULT_MODEL
  try {
    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        system: options.system,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.2,
          num_predict: options.maxTokens ?? 12000,
        },
      }),
    })
    if (!res.ok) {
      console.error(`[ollama] HTTP ${res.status}: ${res.statusText}`)
      return null
    }
    const data = await res.json() as { response?: string }
    return data.response ?? null
  } catch (err) {
    console.error('[ollama] generation error:', err)
    return null
  }
}

/**
 * Check if Ollama is running and reachable.
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * List all models currently installed in Ollama.
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return []
    const data = await res.json() as { models?: { name: string }[] }
    return data.models?.map(m => m.name) ?? []
  } catch {
    return []
  }
}

/**
 * Build a structured prompt for full app generation.
 * Instructs the model to output FILE: blocks that can be parsed.
 */
export function buildOllamaAppPrompt(userPrompt: string, appType = 'web application'): string {
  return `You are an expert full stack developer. Generate a complete ${appType} based on the user request below.

User request: ${userPrompt}

Requirements:
- Create multiple files (HTML, CSS, JavaScript)
- Include working navigation between pages
- Write real, specific content — no placeholders
- Add comments explaining the code
- Make it visually polished with Tailwind CSS (CDN)

Output format — use exactly this structure for each file:

FILE: index.html
<!DOCTYPE html>
...complete file content...

FILE: styles.css
/* complete CSS */
...

FILE: script.js
// complete JavaScript
...

Output ONLY the FILE blocks. No explanations before or after.`
}
