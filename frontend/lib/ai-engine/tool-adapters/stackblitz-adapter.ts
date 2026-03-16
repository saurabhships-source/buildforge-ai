// StackBlitz WebContainers — sandbox testing adapter
// Note: WebContainers run in-browser only. This server-side adapter simulates
// the interface; actual sandbox execution happens client-side via the preview iframe.
import type { BaseAdapter, ProjectFiles, AdapterResult } from './base-adapter'

export class StackBlitzAdapter implements BaseAdapter {
  async generateCode(_prompt: string, _appType: string): Promise<AdapterResult> {
    throw new Error('StackBlitz adapter is for testing only, not code generation')
  }
  async analyzeRepo(files: ProjectFiles): Promise<string> {
    const issues: string[] = []
    for (const [name, content] of Object.entries(files)) {
      if (content.includes('eval(')) issues.push(`${name}: unsafe eval() usage`)
      if (content.includes('document.write(')) issues.push(`${name}: unsafe document.write()`)
      if (/api[_-]?key\s*=\s*["'][^"']{10,}/.test(content)) issues.push(`${name}: possible exposed API key`)
    }
    return issues.length > 0 ? `Issues found:\n${issues.join('\n')}` : 'No issues detected'
  }
  async improveUI(files: ProjectFiles): Promise<AdapterResult> {
    return { files, entrypoint: 'index.html', description: 'No UI changes (StackBlitz is a test runner)' }
  }
  async fixBugs(files: ProjectFiles): Promise<AdapterResult> {
    return { files, entrypoint: 'index.html', description: 'No fixes (StackBlitz is a test runner)' }
  }
  async refactorCode(files: ProjectFiles): Promise<AdapterResult> {
    return { files, entrypoint: 'index.html', description: 'No refactor (StackBlitz is a test runner)' }
  }
  async runTests(files: ProjectFiles): Promise<{ passed: boolean; issues: string[] }> {
    const issues: string[] = []
    for (const [name, content] of Object.entries(files)) {
      if (content.includes('eval(')) issues.push(`${name}: eval() detected`)
      if (/<script[^>]*src=["']http:/.test(content)) issues.push(`${name}: insecure HTTP script src`)
    }
    return { passed: issues.length === 0, issues }
  }
  async deployApp(_files: ProjectFiles, provider: 'vercel' | 'netlify'): Promise<{ config: ProjectFiles }> {
    const config = provider === 'vercel'
      ? { 'vercel.json': '{"version":2}' }
      : { 'netlify.toml': '[build]\n  publish = "."\n' }
    return { config }
  }
}
