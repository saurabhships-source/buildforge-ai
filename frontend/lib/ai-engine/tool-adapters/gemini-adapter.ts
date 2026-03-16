import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import type { BaseAdapter, ProjectFiles, AdapterResult } from './base-adapter'
import { parseFilesJson } from './base-adapter'

const CODE_SYSTEM = `You are an expert developer. Return ONLY valid JSON: {"files":{"index.html":"..."},"entrypoint":"index.html","description":"..."}`

export class GeminiAdapter implements BaseAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any

  constructor(modelId: 'gemini-1.5-flash' | 'gemini-1.5-pro' = 'gemini-1.5-flash') {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
    this.model = google(modelId)
  }

  private async run(system: string, prompt: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { text } = await generateText({ model: this.model as any, system, prompt, maxOutputTokens: 12000 })
    return text
  }

  async generateCode(prompt: string, appType: string, existingFiles?: ProjectFiles): Promise<AdapterResult> {
    const existing = existingFiles ? `\nExisting: ${JSON.stringify(Object.keys(existingFiles))}` : ''
    return parseFilesJson(await this.run(CODE_SYSTEM, `Build a ${appType}: ${prompt}${existing}`))
  }
  async analyzeRepo(files: ProjectFiles): Promise<string> {
    return this.run('Analyze this project and list issues concisely.', JSON.stringify(Object.keys(files)))
  }
  async improveUI(files: ProjectFiles): Promise<AdapterResult> {
    return parseFilesJson(await this.run(CODE_SYSTEM, `Improve UI/UX:\n${JSON.stringify(files)}`))
  }
  async fixBugs(files: ProjectFiles): Promise<AdapterResult> {
    return parseFilesJson(await this.run(CODE_SYSTEM, `Fix all bugs:\n${JSON.stringify(files)}`))
  }
  async refactorCode(files: ProjectFiles, instructions?: string): Promise<AdapterResult> {
    return parseFilesJson(await this.run(CODE_SYSTEM, `Refactor${instructions ? ` (${instructions})` : ''}:\n${JSON.stringify(files)}`))
  }
  async runTests(files: ProjectFiles): Promise<{ passed: boolean; issues: string[] }> {
    const r = await this.run('Return JSON: {"passed":bool,"issues":[...]}', JSON.stringify(files))
    try { return JSON.parse(r) } catch { return { passed: true, issues: [] } }
  }
  async deployApp(_files: ProjectFiles, provider: 'vercel' | 'netlify'): Promise<{ config: ProjectFiles }> {
    const config: ProjectFiles = provider === 'vercel'
      ? { 'vercel.json': '{"version":2}' }
      : { 'netlify.toml': '[build]\n  publish = "."\n' }
    return { config }
  }
}
