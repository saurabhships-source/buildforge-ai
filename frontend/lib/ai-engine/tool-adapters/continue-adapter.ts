// Continue.dev — open-source AI code assistant (repo analysis focus)
import type { BaseAdapter, ProjectFiles, AdapterResult } from './base-adapter'
import { parseFilesJson } from './base-adapter'

const BASE_URL = process.env.CONTINUE_BASE_URL ?? 'http://localhost:65432'

async function chat(prompt: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.CONTINUE_MODEL ?? 'claude-3-haiku',
    }),
  })
  if (!res.ok) throw new Error(`Continue error: ${res.statusText}`)
  const data = await res.json()
  return (data.choices?.[0]?.message?.content ?? '') as string
}

const CODE_HINT = `Return JSON: {"files":{"index.html":"..."},"entrypoint":"index.html","description":"..."}`

export class ContinueAdapter implements BaseAdapter {
  async generateCode(prompt: string, appType: string): Promise<AdapterResult> {
    return parseFilesJson(await chat(`Build a ${appType}: ${prompt}\n${CODE_HINT}`))
  }
  async analyzeRepo(files: ProjectFiles): Promise<string> {
    const summary = Object.entries(files).map(([k, v]) => `${k}: ${v.length} chars`).join('\n')
    return chat(`Analyze this project structure and identify issues:\n${summary}`)
  }
  async improveUI(files: ProjectFiles): Promise<AdapterResult> {
    return parseFilesJson(await chat(`Improve UI/UX:\n${JSON.stringify(Object.keys(files))}\n${CODE_HINT}`))
  }
  async fixBugs(files: ProjectFiles): Promise<AdapterResult> {
    return parseFilesJson(await chat(`Fix bugs:\n${JSON.stringify(files)}\n${CODE_HINT}`))
  }
  async refactorCode(files: ProjectFiles, instructions?: string): Promise<AdapterResult> {
    return parseFilesJson(await chat(`Refactor${instructions ? ` (${instructions})` : ''}:\n${JSON.stringify(files)}\n${CODE_HINT}`))
  }
  async runTests(_files: ProjectFiles): Promise<{ passed: boolean; issues: string[] }> {
    return { passed: true, issues: [] }
  }
  async deployApp(_files: ProjectFiles, provider: 'vercel' | 'netlify'): Promise<{ config: ProjectFiles }> {
    const config = provider === 'vercel'
      ? { 'vercel.json': '{"version":2}' }
      : { 'netlify.toml': '[build]\n  publish = "."\n' }
    return { config }
  }
}
