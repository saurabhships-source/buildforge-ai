import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { analyzeProject, computeHealthScore } from '@/lib/ai-engine/codebase-graph/codebase-analyzer'
import { buildDependencyGraph } from '@/lib/ai-engine/codebase-graph/dependency-mapper'
import { buildComponentGraph } from '@/lib/ai-engine/codebase-graph/component-graph'
import { staticPerformanceScan } from '@/lib/ai-engine/agents/performance-agent'
import { staticSecurityScan } from '@/lib/ai-engine/agents/security-agent'
import { getProjectLogs } from '@/lib/maintenance-scheduler'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

// GET /api/projects/[id]/health — return full health report for a project
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { id: projectId } = await params

  const latestVersion = await anyDb.version.findFirst({
    where: { projectId },
    orderBy: { versionNum: 'desc' },
  })
  if (!latestVersion) {
    return NextResponse.json({ error: 'No versions found' }, { status: 404 })
  }

  const files = latestVersion.files as Record<string, string>
  const { analyses, allComponents, allApiCalls, allDbQueries, allDependencies } = analyzeProject(files)
  const health = computeHealthScore(analyses)
  const dependencyGraph = buildDependencyGraph(analyses)
  const componentGraph = buildComponentGraph(analyses)
  const performanceIssues = staticPerformanceScan(files)
  const securityIssues = staticSecurityScan(files)
  const improvementLogs = getProjectLogs(projectId, 10)

  // Version history for trend
  const versions = await anyDb.version.findMany({
    where: { projectId },
    orderBy: { versionNum: 'asc' },
    select: { versionNum: true, createdAt: true, agent: true, prompt: true },
    take: 20,
  })

  // Health snapshots for trend chart
  const healthSnapshots = await anyDb.healthSnapshot.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    select: { versionNum: true, overall: true, security: true, performance: true, createdAt: true },
    take: 30,
  }).catch(() => [])

  return NextResponse.json({
    health,
    analyses: analyses.map(a => ({
      path: a.path,
      language: a.language,
      lines: a.lines,
      complexity: a.complexity,
      issueCount: a.issues.length,
      issues: a.issues,
    })),
    dependencyGraph: {
      nodeCount: dependencyGraph.nodes.length,
      edgeCount: dependencyGraph.edges.length,
      entryPoints: dependencyGraph.entryPoints,
      orphans: dependencyGraph.orphans,
      cycles: dependencyGraph.cycles,
    },
    componentGraph: {
      total: componentGraph.nodes.length,
      rootComponents: componentGraph.rootComponents,
      highComplexity: componentGraph.highComplexityComponents,
    },
    allDependencies,
    allApiCalls,
    allDbQueries,
    performanceIssues,
    securityIssues,
    improvementLogs,
    versions,
    healthSnapshots,
  })
}
