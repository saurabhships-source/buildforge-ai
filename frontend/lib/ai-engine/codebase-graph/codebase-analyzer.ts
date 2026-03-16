// Deep codebase analyzer — builds a rich structural model of any project
import type { ProjectFiles } from '../tool-adapters/base-adapter'

export type FileLanguage = 'html' | 'css' | 'js' | 'ts' | 'tsx' | 'jsx' | 'json' | 'md' | 'py' | 'toml' | 'yaml' | 'unknown'

export interface ApiCall {
  method: string
  url: string
  file: string
}

export interface DbQuery {
  type: 'select' | 'insert' | 'update' | 'delete' | 'unknown'
  table: string
  file: string
}

export interface ComponentInfo {
  name: string
  file: string
  props: string[]
  usedIn: string[]
  hasState: boolean
  hasEffects: boolean
}

export interface FileAnalysis {
  path: string
  language: FileLanguage
  lines: number
  size: number
  imports: string[]
  exports: string[]
  functions: string[]
  components: ComponentInfo[]
  apiCalls: ApiCall[]
  dbQueries: DbQuery[]
  dependencies: string[]   // npm packages used
  issues: SecurityIssue[]
  complexity: number       // 0-100 cyclomatic complexity estimate
}

export interface SecurityIssue {
  type: 'xss' | 'eval' | 'exposed_key' | 'insecure_http' | 'todo' | 'large_file' | 'hardcoded_secret'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  line?: number
}

export interface HealthScore {
  overall: number          // 0-100
  security: number
  performance: number
  maintainability: number
  seo: number
  accessibility: number
  label: 'critical' | 'poor' | 'fair' | 'good' | 'excellent'
}

function detectLanguage(path: string): FileLanguage {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, FileLanguage> = {
    html: 'html', css: 'css', js: 'js', ts: 'ts',
    tsx: 'tsx', jsx: 'jsx', json: 'json', md: 'md',
    py: 'py', toml: 'toml', yaml: 'yaml', yml: 'yaml',
  }
  return map[ext] ?? 'unknown'
}

function extractImports(content: string, lang: FileLanguage): string[] {
  const imports: string[] = []
  if (['js', 'ts', 'tsx', 'jsx'].includes(lang)) {
    for (const m of content.matchAll(/(?:import|require)\s*(?:\{[^}]*\}|[\w*]+)?\s*(?:from\s*)?['"]([^'"]+)['"]/g))
      imports.push(m[1])
  }
  if (lang === 'html') {
    for (const m of content.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|html))["']/g))
      imports.push(m[1])
  }
  return [...new Set(imports)]
}

function extractExports(content: string): string[] {
  return [...content.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g)]
    .map(m => m[1])
}

function extractFunctions(content: string): string[] {
  return [...content.matchAll(/(?:async\s+)?function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g)]
    .map(m => m[1] ?? m[2])
    .filter(Boolean)
    .slice(0, 30)
}

function extractComponents(content: string, path: string): ComponentInfo[] {
  const comps: ComponentInfo[] = []
  for (const m of content.matchAll(/(?:export\s+)?(?:default\s+)?(?:function|const)\s+([A-Z]\w+)/g)) {
    const name = m[1]
    const hasState = /useState\s*\(/.test(content)
    const hasEffects = /useEffect\s*\(/.test(content)
    const props = [...content.matchAll(/\{\s*([\w,\s]+)\s*\}\s*:/g)].map(p => p[1]).slice(0, 5)
    comps.push({ name, file: path, props, usedIn: [], hasState, hasEffects })
  }
  return comps
}

function extractApiCalls(content: string, path: string): ApiCall[] {
  const calls: ApiCall[] = []
  for (const m of content.matchAll(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g))
    calls.push({ method: 'GET', url: m[1], file: path })
  for (const m of content.matchAll(/axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g))
    calls.push({ method: m[1].toUpperCase(), url: m[2], file: path })
  return calls
}

function extractDbQueries(content: string, path: string): DbQuery[] {
  const queries: DbQuery[] = []
  for (const m of content.matchAll(/db\.(\w+)\.(findMany|findFirst|findUnique|create|update|delete|upsert)/g))
    queries.push({
      type: m[2].startsWith('find') ? 'select' : m[2] === 'create' ? 'insert' : m[2] === 'update' ? 'update' : 'delete',
      table: m[1],
      file: path,
    })
  return queries
}

function extractNpmDeps(content: string, lang: FileLanguage): string[] {
  if (!['js', 'ts', 'tsx', 'jsx'].includes(lang)) return []
  return [...content.matchAll(/from\s+['"](@?[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)?)['"]/g)]
    .map(m => m[1])
    .filter(d => !d.startsWith('.') && !d.startsWith('/'))
}

function detectSecurityIssues(content: string, path: string): SecurityIssue[] {
  const issues: SecurityIssue[] = []
  if (/\beval\s*\(/.test(content))
    issues.push({ type: 'eval', severity: 'critical', message: 'unsafe eval() usage' })
  if (/innerHTML\s*=\s*[^"'`\s]/.test(content))
    issues.push({ type: 'xss', severity: 'high', message: 'potential XSS via innerHTML assignment' })
  if (/api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}/.test(content))
    issues.push({ type: 'exposed_key', severity: 'critical', message: 'possible exposed API key in source' })
  if (/<script[^>]+src=["']http:\/\//.test(content))
    issues.push({ type: 'insecure_http', severity: 'high', message: 'insecure HTTP script src' })
  if (/password\s*[:=]\s*["'][^"']{4,}/.test(content))
    issues.push({ type: 'hardcoded_secret', severity: 'critical', message: 'possible hardcoded password' })
  if (/TODO|FIXME|HACK/.test(content))
    issues.push({ type: 'todo', severity: 'low', message: 'TODO/FIXME markers present' })
  if (content.split('\n').length > 500)
    issues.push({ type: 'large_file', severity: 'low', message: `file exceeds 500 lines (${content.split('\n').length})` })
  return issues
}

function estimateComplexity(content: string): number {
  // Count decision points: if, else, for, while, switch, ternary, &&, ||
  const decisions = (content.match(/\b(if|else|for|while|switch|case|\?\s*[^:]+:|\&\&|\|\|)/g) ?? []).length
  return Math.min(100, Math.round((decisions / Math.max(content.split('\n').length, 1)) * 200))
}

export function analyzeFile(path: string, content: string): FileAnalysis {
  const lang = detectLanguage(path)
  return {
    path,
    language: lang,
    lines: content.split('\n').length,
    size: content.length,
    imports: extractImports(content, lang),
    exports: extractExports(content),
    functions: extractFunctions(content),
    components: extractComponents(content, path),
    apiCalls: extractApiCalls(content, path),
    dbQueries: extractDbQueries(content, path),
    dependencies: extractNpmDeps(content, lang),
    issues: detectSecurityIssues(content, path),
    complexity: estimateComplexity(content),
  }
}

export function computeHealthScore(analyses: FileAnalysis[]): HealthScore {
  const allIssues = analyses.flatMap(a => a.issues)
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length
  const highCount = allIssues.filter(i => i.severity === 'high').length
  const avgComplexity = analyses.reduce((s, a) => s + a.complexity, 0) / Math.max(analyses.length, 1)

  const security = Math.max(0, 100 - criticalCount * 25 - highCount * 10)
  const maintainability = Math.max(0, 100 - avgComplexity)
  const performance = analyses.some(a => a.path.endsWith('.html') && !a.issues.find(i => i.type === 'insecure_http'))
    ? 80 : 60
  const seo = analyses.some(a => a.path === 'sitemap.xml') ? 85 :
    analyses.some(a => a.path.endsWith('.html') && a.size > 500) ? 60 : 40
  const accessibility = analyses.some(a => a.path.endsWith('.html')) ? 65 : 50

  const overall = Math.round((security + maintainability + performance + seo + accessibility) / 5)
  const label: HealthScore['label'] =
    overall >= 90 ? 'excellent' : overall >= 75 ? 'good' : overall >= 55 ? 'fair' : overall >= 35 ? 'poor' : 'critical'

  return { overall, security, performance, maintainability, seo, accessibility, label }
}

export function analyzeProject(files: ProjectFiles): {
  analyses: FileAnalysis[]
  health: HealthScore
  allComponents: ComponentInfo[]
  allApiCalls: ApiCall[]
  allDbQueries: DbQuery[]
  allDependencies: string[]
} {
  const analyses = Object.entries(files).map(([path, content]) => analyzeFile(path, content))
  const health = computeHealthScore(analyses)
  const allComponents = analyses.flatMap(a => a.components)
  const allApiCalls = analyses.flatMap(a => a.apiCalls)
  const allDbQueries = analyses.flatMap(a => a.dbQueries)
  const allDependencies = [...new Set(analyses.flatMap(a => a.dependencies))]

  return { analyses, health, allComponents, allApiCalls, allDbQueries, allDependencies }
}
