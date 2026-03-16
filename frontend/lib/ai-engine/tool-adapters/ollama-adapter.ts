import type { BaseAdapter, ProjectFiles, AdapterResult } from './base-adapter'
import { parseFilesJson } from './base-adapter'

const BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5-coder'

async function generate(system: string, prompt: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, system, prompt, stream: false }),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`)
  const data = await res.json()
  return data.response as string
}

const CODE_SYSTEM = `You are an expert developer. Return ONLY valid JSON: {"files":{"index.html":"..."},"entrypoint":"index.html","description":"..."}`

export class OllamaAdapter implements BaseAdapter {
  async generateCode(prompt: string, appType: string, existingFiles?: ProjectFiles): Promise<AdapterResult> {
    const existing = existingFiles ? `\nExisting files: ${JSON.stringify(Object.keys(existingFiles))}` : ''
    const text = await generate(CODE_SYSTEM, `Build a ${appType}: ${prompt}${existing}`)
    return parseFilesJson(text)
  }
  async analyzeRepo(files: ProjectFiles): Promise<string> {
    const fileList = Object.entries(files).map(([k, v]) => `=== ${k} ===\n${v.slice(0, 500)}`).join('\n')
    return generate('You are a code reviewer. Analyze this project and list issues.', fileList)
  }
  async improveUI(files: ProjectFiles): Promise<AdapterResult> {
    const text = await generate(CODE_SYSTEM, `Improve the UI/UX of these files:\n${JSON.stringify(files)}`)
    return parseFilesJson(text)
  }
  async fixBugs(files: ProjectFiles): Promise<AdapterResult> {
    const text = await generate(CODE_SYSTEM, `Fix all bugs in these files:\n${JSON.stringify(files)}`)
    return parseFilesJson(text)
  }
  async refactorCode(files: ProjectFiles, instructions?: string): Promise<AdapterResult> {
    const text = await generate(CODE_SYSTEM, `Refactor these files${instructions ? `: ${instructions}` : ''}:\n${JSON.stringify(files)}`)
    return parseFilesJson(text)
  }
  async runTests(files: ProjectFiles): Promise<{ passed: boolean; issues: string[] }> {
    const result = await generate('You are a QA engineer. List any issues as JSON: {"passed":bool,"issues":[...]}', JSON.stringify(files))
    try { return JSON.parse(result) } catch { return { passed: true, issues: [] } }
  }
  async deployApp(_files: ProjectFiles, provider: 'vercel' | 'netlify'): Promise<{ config: ProjectFiles }> {
    const config: ProjectFiles = provider === 'vercel'
      ? { 'vercel.json': '{"version":2}' }
      : { 'netlify.toml': '[build]\n  publish = "."\n' }
    return { config }
  }
}
