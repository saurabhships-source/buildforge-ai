// Dependency mapper — builds a directed graph of file and module relationships
import type { FileAnalysis } from './codebase-analyzer'

export interface DependencyNode {
  id: string           // file path or package name
  type: 'file' | 'package' | 'api' | 'db'
  label: string
  language?: string
  size?: number
  issueCount: number
}

export interface DependencyEdge {
  from: string
  to: string
  type: 'import' | 'api_call' | 'db_query' | 'extends' | 'uses'
  weight: number       // 1 = weak, 3 = strong
}

export interface DependencyGraph {
  nodes: DependencyNode[]
  edges: DependencyEdge[]
  entryPoints: string[]
  orphans: string[]    // files with no imports or importers
  cycles: string[][]   // detected circular dependencies
}

export function buildDependencyGraph(analyses: FileAnalysis[]): DependencyGraph {
  const nodes: DependencyNode[] = []
  const edges: DependencyEdge[] = []
  const fileSet = new Set(analyses.map(a => a.path))
  const importedBy = new Map<string, string[]>()

  // File nodes
  for (const a of analyses) {
    nodes.push({
      id: a.path,
      type: 'file',
      label: a.path.split('/').pop() ?? a.path,
      language: a.language,
      size: a.size,
      issueCount: a.issues.length,
    })

    // Import edges (file → file)
    for (const imp of a.imports) {
      const resolved = resolveImport(imp, a.path, fileSet)
      if (resolved) {
        edges.push({ from: a.path, to: resolved, type: 'import', weight: 2 })
        const list = importedBy.get(resolved) ?? []
        list.push(a.path)
        importedBy.set(resolved, list)
      } else if (!imp.startsWith('.') && !imp.startsWith('/')) {
        // External package node
        if (!nodes.find(n => n.id === imp)) {
          nodes.push({ id: imp, type: 'package', label: imp, issueCount: 0 })
        }
        edges.push({ from: a.path, to: imp, type: 'import', weight: 1 })
      }
    }

    // API call edges
    for (const call of a.apiCalls) {
      const apiId = `api:${call.url}`
      if (!nodes.find(n => n.id === apiId)) {
        nodes.push({ id: apiId, type: 'api', label: `${call.method} ${call.url}`, issueCount: 0 })
      }
      edges.push({ from: a.path, to: apiId, type: 'api_call', weight: 2 })
    }

    // DB query edges
    for (const q of a.dbQueries) {
      const dbId = `db:${q.table}`
      if (!nodes.find(n => n.id === dbId)) {
        nodes.push({ id: dbId, type: 'db', label: `DB: ${q.table}`, issueCount: 0 })
      }
      edges.push({ from: a.path, to: dbId, type: 'db_query', weight: 3 })
    }
  }

  // Entry points: files not imported by anyone
  const entryPoints = analyses
    .filter(a => !importedBy.has(a.path))
    .map(a => a.path)

  // Orphans: files with no imports and not imported
  const orphans = analyses
    .filter(a => a.imports.length === 0 && !importedBy.has(a.path))
    .map(a => a.path)

  // Cycle detection (simple DFS)
  const cycles = detectCycles(analyses.map(a => a.path), edges)

  return { nodes, edges, entryPoints, orphans, cycles }
}

function resolveImport(imp: string, fromFile: string, fileSet: Set<string>): string | null {
  if (!imp.startsWith('.') && !imp.startsWith('/')) return null
  const dir = fromFile.split('/').slice(0, -1).join('/')
  const base = imp.startsWith('/') ? imp.slice(1) : `${dir}/${imp}`.replace(/\/\.\//g, '/').replace(/[^/]+\/\.\.\//g, '')
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}/index.ts`, `${base}/index.js`]
  return candidates.find(c => fileSet.has(c)) ?? null
}

function detectCycles(nodes: string[], edges: DependencyEdge[]): string[][] {
  const adj = new Map<string, string[]>()
  for (const e of edges.filter(e => e.type === 'import')) {
    const list = adj.get(e.from) ?? []
    list.push(e.to)
    adj.set(e.from, list)
  }

  const cycles: string[][] = []
  const visited = new Set<string>()
  const stack = new Set<string>()
  const path: string[] = []

  function dfs(node: string) {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node)
      if (cycleStart !== -1) cycles.push(path.slice(cycleStart))
      return
    }
    if (visited.has(node)) return
    visited.add(node)
    stack.add(node)
    path.push(node)
    for (const neighbor of adj.get(node) ?? []) dfs(neighbor)
    path.pop()
    stack.delete(node)
  }

  for (const node of nodes) dfs(node)
  return cycles.slice(0, 5) // cap at 5 cycles
}

// Summarize graph for AI context injection
export function summarizeDependencyGraph(graph: DependencyGraph): string {
  const fileNodes = graph.nodes.filter(n => n.type === 'file')
  const pkgNodes = graph.nodes.filter(n => n.type === 'package')
  const lines = [
    `Files: ${fileNodes.length} | Packages: ${pkgNodes.length} | Edges: ${graph.edges.length}`,
    `Entry points: ${graph.entryPoints.slice(0, 5).join(', ')}`,
    graph.orphans.length > 0 ? `Orphan files: ${graph.orphans.join(', ')}` : '',
    graph.cycles.length > 0 ? `Circular deps: ${graph.cycles.map(c => c.join(' → ')).join(' | ')}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}
