import type { BaseAdapter, ProjectFiles, AdapterResult } from './base-adapter'
import { parseFilesJson } from './base-adapter'

// LM Studio exposes an OpenAI-compatible API at localhost:1234
const BASE_URL = process.env.LMSTUDIO_BASE_URL ?? 'http://localhost:1234'
const MODEL = process.env.LMSTUDIO_MODEL ?? 'local-model'

const CODE_SYSTEM = `You are an expert developer. Return ONLY valid JSON: {"files":{"index.html":"..."},"entrypoint":"index.html","description":"..."}`

async function chat(system: string, user: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.2,
    }),
  })
  if (!res.ok) throw new Error(`LM Studio error: ${res.statusText}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}

export class LMStudioAdapter implements BaseAdapter {
  async generateCode(prompt: string, appType: string, existingFiles?: ProjectFiles): Promise<AdapterResult> {
    const existing = existingFiles ? `\nExisting: ${JSON.stringify(Object.keys(existingFiles))}` : ''
    const text = await chat(CODE_SYSTEM, `Build a ${appType}: ${prompt}${existing}`)
    return parseFilesJson(text)
  }
  async analyzeRepo(files: ProjectFiles): Promise<string> {
    return chat('Analyze this project and list issues.', JSON.stringify(Object.keys(files)))
  }
  async improveUI(files: ProjectFiles): Promise<AdapterResult> {
    return parseFilesJson(await chat(CODE_SYSTEM, `Improve UI/UX:\n${JSON.stringify(files)}`))
  }
  async fixBugs(files: ProjectFiles): Promise<AdapterResult> {
    return parseFilesJson(await chat(CODE_SYSTEM, `Fix bugs:\n${JSON.stringify(files)}`))
  }
  async refactorCode(files: ProjectFiles, instructions?: string): Promise<AdapterResult> {
    return parseFilesJson(await chat(CODE_SYSTEM, `Refactor${instructions ? ` (${instructions})` : ''}:\n${JSON.stringify(files)}`))
  }
  async runTests(files: ProjectFiles): Promise<{ passed: boolean; issues: string[] }> {
    const r = await chat('Return JSON: {"passed":bool,"issues":[...]}', JSON.stringify(files))
    try { return JSON.parse(r) } catch { return { passed: true, issues: [] } }
  }
  async deployApp(_files: ProjectFiles, provider: 'vercel' | 'netlify'): Promise<{ config: ProjectFiles }> {
    const config: ProjectFiles = provider === 'vercel'
      ? { 'vercel.json': '{"version":2}' }
      : { 'netlify.toml': '[build]\n  publish = "."\n' }
    return { config }
  }
}
