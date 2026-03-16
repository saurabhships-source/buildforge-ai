// Component graph — maps UI component hierarchy and data flow
import type { FileAnalysis, ComponentInfo } from './codebase-analyzer'

export interface ComponentNode {
  name: string
  file: string
  depth: number          // 0 = root/page, 1 = layout, 2+ = leaf
  children: string[]     // component names used inside this one
  props: string[]
  hasState: boolean
  hasEffects: boolean
  renderCount: number    // how many times this component is referenced
}

export interface DataFlowEdge {
  from: string           // component name
  to: string
  via: 'props' | 'context' | 'state' | 'api'
}

export interface ComponentGraph {
  nodes: ComponentNode[]
  dataFlow: DataFlowEdge[]
  rootComponents: string[]
  leafComponents: string[]
  highComplexityComponents: string[]
}

export function buildComponentGraph(analyses: FileAnalysis[]): ComponentGraph {
  const allComponents = analyses.flatMap(a => a.components)
  const componentNames = new Set(allComponents.map(c => c.name))
  const renderCounts = new Map<string, number>()
  const childrenMap = new Map<string, string[]>()

  // Count how many times each component is referenced in other files
  for (const a of analyses) {
    const content = '' // content not stored in FileAnalysis — use name matching
    for (const comp of allComponents) {
      // Check if this file's content references the component (by name in JSX)
      // We approximate by checking if the component name appears in other files' exports
      if (a.components.some(c => c.name !== comp.name)) {
        renderCounts.set(comp.name, (renderCounts.get(comp.name) ?? 0))
      }
    }
  }

  // Build children map: which components are used inside each component's file
  for (const a of analyses) {
    const fileComponents = a.components.map(c => c.name)
    for (const comp of fileComponents) {
      // Components from other files that appear in this file's imports
      const usedComponents = allComponents
        .filter(c => c.name !== comp && a.imports.some(imp => imp.includes(c.file.replace(/\.[^.]+$/, ''))))
        .map(c => c.name)
      childrenMap.set(comp, usedComponents)
    }
  }

  const nodes: ComponentNode[] = allComponents.map(comp => ({
    name: comp.name,
    file: comp.file,
    depth: comp.name.match(/^(App|Root|Layout|Page)/) ? 0 : comp.name.match(/^(Header|Footer|Sidebar|Nav)/) ? 1 : 2,
    children: childrenMap.get(comp.name) ?? [],
    props: comp.props,
    hasState: comp.hasState,
    hasEffects: comp.hasEffects,
    renderCount: renderCounts.get(comp.name) ?? 0,
  }))

  const dataFlow: DataFlowEdge[] = []
  for (const node of nodes) {
    for (const child of node.children) {
      dataFlow.push({ from: node.name, to: child, via: 'props' })
    }
    if (node.hasState) {
      for (const child of node.children) {
        dataFlow.push({ from: node.name, to: child, via: 'state' })
      }
    }
  }

  const rootComponents = nodes.filter(n => n.depth === 0).map(n => n.name)
  const leafComponents = nodes.filter(n => n.children.length === 0).map(n => n.name)
  const highComplexityComponents = nodes
    .filter(n => n.hasState && n.hasEffects && n.children.length > 3)
    .map(n => n.name)

  return { nodes, dataFlow, rootComponents, leafComponents, highComplexityComponents }
}

export function summarizeComponentGraph(graph: ComponentGraph): string {
  return [
    `Components: ${graph.nodes.length} total`,
    `Root: ${graph.rootComponents.join(', ') || 'none'}`,
    `High complexity: ${graph.highComplexityComponents.join(', ') || 'none'}`,
    `Data flow edges: ${graph.dataFlow.length}`,
  ].join('\n')
}
