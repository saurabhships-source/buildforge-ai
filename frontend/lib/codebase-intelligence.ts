// Codebase Intelligence Graph
// Analyzes project files and builds a dependency/relationship graph

export interface FileNode {
  path: string
  language: string
  size: number
  imports: string[]
  exports: string[]
  functions: string[]
  components: string[]
  issues: string[]
}

export interface CodebaseGraph {
  nodes: FileNode[]
  edges: { from: string; to: string; type: 'import' | 'extends' | 'uses' }[]
  stats: {
    totalFiles: number
    totalLines: number
    languages: Record<string, number>
    complexity: 'low' | 'medium' | 'high'
    issues: number
  }
}

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TypeScript/React', js: 'JavaScript',
    jsx: 'JavaScript/React', html: 'HTML', css: 'CSS',
    json: 'JSON', md: 'Markdown', py: 'Python',
    toml: 'TOML', yaml: 'YAML', yml: 'YAML',
  }
  return map[ext] ?? 'Unknown'
}

function extractImports(content: string, language: string): string[] {
  const imports: string[] = []
  if (language.includes('TypeScript') || language.includes('JavaScript')) {
    const matches = content.matchAll(/(?:import|require)\s*(?:\{[^}]*\}|[\w*]+)?\s*(?:from\s*)?['"]([^'"]+)['"]/g)
    for (const m of matches) imports.push(m[1])
  }
  if (language === 'HTML') {
    const matches = content.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|html))["']/g)
    for (const m of matches) imports.push(m[1])
  }
  return [...new Set(imports)]
}

function extractExports(content: string): string[] {
  const exports: string[] = []
  const matches = content.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g)
  for (const m of matches) exports.push(m[1])
  return exports
}

function extractFunctions(content: string): string[] {
  const fns: string[] = []
  const matches = content.matchAll(/(?:function|const|async function)\s+(\w+)\s*(?:=\s*(?:async\s*)?\(|\()/g)
  for (const m of matches) fns.push(m[1])
  return fns.slice(0, 20) // cap at 20
}

function extractComponents(content: string): string[] {
  const comps: string[] = []
  const matches = content.matchAll(/(?:export\s+)?(?:default\s+)?(?:function|const)\s+([A-Z]\w+)/g)
  for (const m of matches) comps.push(m[1])
  return comps
}

function detectIssues(content: string, filename: string): string[] {
  const issues: string[] = []
  if (/\beval\s*\(/.test(content)) issues.push('unsafe eval()')
  if (/innerHTML\s*=\s*[^"'`]/.test(content)) issues.push('potential XSS via innerHTML')
  if (/api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}/.test(content)) issues.push('possible exposed API key')
  if (/<script[^>]+src=["']http:\/\//.test(content)) issues.push('insecure HTTP script src')
  if (/TODO|FIXME|HACK/.test(content)) issues.push('TODO/FIXME markers found')
  if (content.split('\n').length > 500) issues.push('file exceeds 500 lines — consider splitting')
  return issues
}

export function buildCodebaseGraph(files: Record<string, string>): CodebaseGraph {
  const nodes: FileNode[] = []
  const edges: CodebaseGraph['edges'] = []
  const languages: Record<string, number> = {}
  let totalLines = 0
  let totalIssues = 0

  for (const [path, content] of Object.entries(files)) {
    const language = detectLanguage(path)
    const lines = content.split('\n').length
    totalLines += lines
    languages[language] = (languages[language] ?? 0) + 1

    const imports = extractImports(content, language)
    const exports = extractExports(content)
    const functions = extractFunctions(content)
    const components = extractComponents(content)
    const issues = detectIssues(content, path)
    totalIssues += issues.length

    nodes.push({ path, language, size: content.length, imports, exports, functions, components, issues })

    // Build edges from imports
    for (const imp of imports) {
      if (!imp.startsWith('.') && !imp.startsWith('/')) continue
      const resolved = imp.replace(/^\.\//, '').replace(/^\//, '')
      edges.push({ from: path, to: resolved, type: 'import' })
    }
  }

  const fileCount = nodes.length
  const complexity: CodebaseGraph['stats']['complexity'] =
    fileCount > 20 || totalLines > 2000 ? 'high' :
    fileCount > 8 || totalLines > 500 ? 'medium' : 'low'

  return {
    nodes,
    edges,
    stats: { totalFiles: fileCount, totalLines, languages, complexity, issues: totalIssues },
  }
}

// Summarize graph for AI context
export function summarizeGraph(graph: CodebaseGraph): string {
  const { stats, nodes } = graph
  const issueNodes = nodes.filter(n => n.issues.length > 0)
  return [
    `Files: ${stats.totalFiles} | Lines: ${stats.totalLines} | Complexity: ${stats.complexity}`,
    `Languages: ${Object.entries(stats.languages).map(([l, c]) => `${l}(${c})`).join(', ')}`,
    issueNodes.length > 0
      ? `Issues: ${issueNodes.map(n => `${n.path}: ${n.issues.join(', ')}`).join(' | ')}`
      : 'No issues detected',
  ].join('\n')
}
