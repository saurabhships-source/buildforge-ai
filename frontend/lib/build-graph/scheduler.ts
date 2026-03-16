// Build Graph Scheduler
// Executes nodes in dependency order, running independent nodes in parallel.
// Every node execution is recorded in the build timeline with incremental snapshots.

import type { BuildNode, BuildContext, BuildGraphResult, AgentEvent } from './types'
import { BuildRunRecorder, generateBuildId } from './timeline'

/**
 * Topological sort — returns nodes in execution order respecting dependencies.
 * Nodes with no dependencies come first; nodes at the same level can run in parallel.
 */
export function topoSort(nodes: BuildNode[]): BuildNode[][] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const inDegree = new Map(nodes.map(n => [n.id, 0]))
  const dependents = new Map<string, string[]>(nodes.map(n => [n.id, []]))

  for (const node of nodes) {
    for (const dep of node.dependencies) {
      inDegree.set(node.id, (inDegree.get(node.id) ?? 0) + 1)
      dependents.get(dep)?.push(node.id)
    }
  }

  const levels: BuildNode[][] = []
  let ready = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0)

  while (ready.length > 0) {
    levels.push(ready)
    const next: BuildNode[] = []
    for (const node of ready) {
      for (const depId of dependents.get(node.id) ?? []) {
        const newDeg = (inDegree.get(depId) ?? 1) - 1
        inDegree.set(depId, newDeg)
        if (newDeg === 0) {
          const n = nodeMap.get(depId)
          if (n) next.push(n)
        }
      }
    }
    ready = next
  }

  return levels
}

/**
 * Execute the build graph.
 * Nodes at the same dependency level run in parallel.
 * Each node receives the accumulated files from all previously completed nodes.
 * Every node completion is recorded as a timeline step with an incremental snapshot.
 */
export async function executeGraph(
  nodes: BuildNode[],
  ctx: Omit<BuildContext, 'files' | 'emitEvent'> & {
    onEvent?: (e: AgentEvent) => void
    projectId?: string | null
    mode?: string
  }
): Promise<BuildGraphResult> {
  const events: AgentEvent[] = []
  const accumulatedFiles: Record<string, string> = {}
  const start = Date.now()

  const buildId = generateBuildId()
  const recorder = new BuildRunRecorder(
    buildId,
    ctx.projectId ?? null,
    ctx.prompt,
    ctx.mode ?? 'fast'
  )

  const emitEvent = (event: AgentEvent) => {
    events.push(event)
    ctx.onEvent?.(event)
  }

  const levels = topoSort(nodes)

  for (const level of levels) {
    // Run all nodes in this level in parallel
    await Promise.all(level.map(async (node) => {
      // Skip if any dependency failed
      const depFailed = node.dependencies.some(depId => {
        const dep = nodes.find(n => n.id === depId)
        return dep?.status === 'failed'
      })

      if (depFailed) {
        node.status = 'skipped'
        emitEvent({
          id: `${node.id}-skip`,
          agent: node.type,
          action: `skipped — dependency failed`,
          timestamp: new Date().toISOString(),
          status: 'info',
        })
        // Record skipped step
        recorder.recordStep({
          nodeId: node.id,
          nodeType: node.type,
          agent: node.type,
          action: 'skipped — dependency failed',
          description: 'Skipped',
          status: 'skipped',
          durationMs: 0,
          currentFiles: { ...accumulatedFiles },
        })
        return
      }

      node.status = 'running'
      const nodeStart = Date.now()

      emitEvent({
        id: `${node.id}-start`,
        agent: node.type,
        action: `starting ${node.label}`,
        timestamp: new Date().toISOString(),
        status: 'running',
      })

      const buildCtx: BuildContext = {
        ...ctx,
        files: { ...accumulatedFiles },
        emitEvent,
      }

      try {
        const result = await node.run(buildCtx)
        node.status = result.skipped ? 'skipped' : 'completed'
        node.durationMs = Date.now() - nodeStart
        node.result = result.files

        // Merge files into accumulator
        Object.assign(accumulatedFiles, result.files)

        emitEvent({
          id: `${node.id}-done`,
          agent: node.type,
          action: result.skipped ? `skipped — ${result.description}` : result.description,
          timestamp: new Date().toISOString(),
          status: result.skipped ? 'info' : 'success',
        })

        // Record timeline step with snapshot of current accumulated state
        recorder.recordStep({
          nodeId: node.id,
          nodeType: node.type,
          agent: node.type,
          action: node.label,
          description: result.description,
          status: node.status,
          durationMs: node.durationMs,
          currentFiles: { ...accumulatedFiles },
        })
      } catch (err) {
        node.status = 'failed'
        node.error = err instanceof Error ? err.message : String(err)
        node.durationMs = Date.now() - nodeStart

        emitEvent({
          id: `${node.id}-error`,
          agent: node.type,
          action: `failed: ${node.error}`,
          timestamp: new Date().toISOString(),
          status: 'error',
        })

        recorder.recordStep({
          nodeId: node.id,
          nodeType: node.type,
          agent: node.type,
          action: node.label,
          description: node.error ?? 'Failed',
          status: 'failed',
          durationMs: node.durationMs ?? 0,
          currentFiles: { ...accumulatedFiles },
        })
      }
    }))
  }

  const totalDurationMs = Date.now() - start
  const timeline = recorder.complete(totalDurationMs)

  return {
    files: accumulatedFiles,
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.label,
      status: n.status,
      durationMs: n.durationMs,
      description: n.result ? `${Object.keys(n.result).length} files` : n.error,
      changes: n.result ? Object.keys(n.result).map(f => `${f}`) : [],
    })),
    events,
    timeline,
    totalDurationMs,
  }
}
