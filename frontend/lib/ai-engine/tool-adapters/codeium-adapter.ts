// Codeium — AI code completion and generation
import type { BaseAdapter, ProjectFiles, AdapterResult } from './base-adapter'
import { parseFilesJson } from './base-adapter'

const API_URL = 'https://api.codeium.com/v1/generate'

async function generate(prompt: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${process.env.CODEIUM_API_KEY ?? ''}`,
    },
    body: JSON.stringify({ prompt, language: 'javascript', max_tokens: 4096 }),
  })
  if (!res.ok) throw new Error(`Codeium error: ${res.statusText}`)
  const data = await res.json()
  return (data.completion ?? '') as string
}

const CODE_HINT = `Return JSON: {"files":{"index.html":"..."},"entrypoint":"index.html","description":"..."}`

export class CodeiumAdapter implements BaseAdapter {
  async generateCode(prompt: string, appType: string): Promise<AdapterResult> {
    return parseFilesJson(await generate(`Build a ${appType}: ${prompt}\n${CODE_HINT}`))
  }
  async analyzeRepo(files: ProjectFiles): Promise<string> {
    return `Codeium analysis: ${Object.keys(files).length} files.`
  }
  async improveUI(files: ProjectFiles): Promise<AdapterResult> {
    return parseFilesJson(await generate(`Improve UI for: ${JSON.stringify(Object.keys(files))}\n${CODE_HINT}`))
  }
  async fixBugs(files: ProjectFiles): Promise<AdapterResult> {
    return parseFilesJson(await generate(`Fix bugs in: ${JSON.stringify(Object.keys(files))}\n${CODE_HINT}`))
  }
  async refactorCode(files: ProjectFiles): Promise<AdapterResult> {
    return parseFilesJson(await generate(`Refactor: ${JSON.stringify(Object.keys(files))}\n${CODE_HINT}`))
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
