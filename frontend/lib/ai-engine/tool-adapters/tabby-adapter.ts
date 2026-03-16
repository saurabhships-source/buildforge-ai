// TabbyML — self-hosted code completion server
import type { BaseAdapter, ProjectFiles, AdapterResult } from './base-adapter'
import { parseFilesJson } from './base-adapter'

const BASE_URL = process.env.TABBY_BASE_URL ?? 'http://localhost:8080'

async function complete(prompt: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.TABBY_API_KEY ?? ''}` },
    body: JSON.stringify({ language: 'javascript', segments: { prefix: prompt } }),
  })
  if (!res.ok) throw new Error(`Tabby error: ${res.statusText}`)
  const data = await res.json()
  return (data.choices?.[0]?.text ?? '') as string
}

const CODE_SYSTEM = `{"files":{"index.html":"..."},"entrypoint":"index.html","description":"..."}`

export class TabbyAdapter implements BaseAdapter {
  async generateCode(prompt: string, appType: string): Promise<AdapterResult> {
    const text = await complete(`// Build a ${appType}: ${prompt}\n// Return JSON:\n${CODE_SYSTEM}\n`)
    return parseFilesJson(text)
  }
  async analyzeRepo(files: ProjectFiles): Promise<string> {
    return `Tabby analysis: ${Object.keys(files).length} files detected.`
  }
  async improveUI(files: ProjectFiles): Promise<AdapterResult> {
    const text = await complete(`// Improve UI:\n${JSON.stringify(Object.keys(files))}\n${CODE_SYSTEM}`)
    return parseFilesJson(text)
  }
  async fixBugs(files: ProjectFiles): Promise<AdapterResult> {
    const text = await complete(`// Fix bugs:\n${JSON.stringify(Object.keys(files))}\n${CODE_SYSTEM}`)
    return parseFilesJson(text)
  }
  async refactorCode(files: ProjectFiles): Promise<AdapterResult> {
    const text = await complete(`// Refactor:\n${JSON.stringify(Object.keys(files))}\n${CODE_SYSTEM}`)
    return parseFilesJson(text)
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
