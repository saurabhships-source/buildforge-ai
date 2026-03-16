'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, Shield, Zap, Search, Code2,
  CheckCircle2, AlertTriangle, XCircle, Activity, GitBranch,
  Loader2, Play,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface HealthScore {
  overall: number
  security: number
  performance: number
  maintainability: number
  seo: number
  accessibility: number
  label: 'critical' | 'poor' | 'fair' | 'good' | 'excellent'
}

interface IssueItem { type: string; severity: string; message: string }
interface FileAnalysis { path: string; language: string; lines: number; complexity: number; issueCount: number; issues: IssueItem[] }
interface ImprovementLog { id: string; agent: string; runAt: string; durationMs: number; changes: string[]; description: string; healthBefore: number; healthAfter: number; status: string }
interface Version { versionNum: number; createdAt: string; agent: string; prompt: string }

interface HealthReport {
  health: HealthScore
  analyses: FileAnalysis[]
  dependencyGraph: { nodeCount: number; edgeCount: number; entryPoints: string[]; orphans: string[]; cycles: string[][] }
  componentGraph: { total: number; rootComponents: string[]; highComplexity: string[] }
  allDependencies: string[]
  performanceIssues: string[]
  securityIssues: string[]
  improvementLogs: ImprovementLog[]
  versions: Version[]
  healthSnapshots: { versionNum: number; overall: number; security: number; performance: number; createdAt: string }[]
}

const HEALTH_COLOR = (score: number) =>
  score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'

const HEALTH_BG = (score: number) =>
  score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'

const SEVERITY_ICON = ({ severity }: { severity: string }) => {
  if (severity === 'critical' || severity === 'high') return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
  if (severity === 'medium') return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
  return <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
}

export default function ProjectEvolutionPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [report, setReport] = useState<HealthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [maintaining, setMaintaining] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/health`)
      if (!res.ok) throw new Error('Failed to load health report')
      setReport(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchReport() }, [fetchReport])

  const handleRunMaintenance = async () => {
    setMaintaining(true)
    toast.loading('Running maintenance cycle...', { id: 'maintain' })
    try {
      const res = await fetch(`/api/projects/${projectId}/maintain`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Maintenance complete — health ${data.healthBefore.overall}% → ${data.healthAfter.overall}%`, { id: 'maintain' })
      fetchReport()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Maintenance failed', { id: 'maintain' })
    } finally {
      setMaintaining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!report) return null

  const { health, analyses, dependencyGraph, componentGraph, performanceIssues, securityIssues, improvementLogs, versions, healthSnapshots } = report
  const allIssues = analyses.flatMap(a => a.issues.map(i => ({ ...i, file: a.path })))

  return (
    <div className="space-y-6 p-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects"><ArrowLeft className="h-4 w-4 mr-1" />Projects</Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Project Evolution</h1>
            <p className="text-sm text-muted-foreground">Codebase intelligence & autonomous maintenance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh
          </Button>
          <Button size="sm" onClick={handleRunMaintenance} disabled={maintaining}>
            {maintaining ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
            Run Maintenance
          </Button>
        </div>
      </div>

      {/* Health Score Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Overall', value: health.overall, icon: Activity },
          { label: 'Security', value: health.security, icon: Shield },
          { label: 'Performance', value: health.performance, icon: Zap },
          { label: 'Maintainability', value: health.maintainability, icon: Code2 },
          { label: 'SEO', value: health.seo, icon: Search },
          { label: 'Accessibility', value: health.accessibility, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="pt-4 pb-3 text-center">
              <Icon className={`h-4 w-4 mx-auto mb-1 ${HEALTH_COLOR(value)}`} />
              <div className={`text-2xl font-bold ${HEALTH_COLOR(value)}`}>{value}%</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
              <Progress value={value} className={`h-1 mt-2 [&>div]:${HEALTH_BG(value)}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Codebase Graph */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="h-4 w-4" />Codebase Intelligence Graph
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <div className="text-xl font-bold">{dependencyGraph.nodeCount}</div>
                <div className="text-xs text-muted-foreground">Graph Nodes</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <div className="text-xl font-bold">{dependencyGraph.edgeCount}</div>
                <div className="text-xs text-muted-foreground">Dependencies</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <div className="text-xl font-bold">{componentGraph.total}</div>
                <div className="text-xs text-muted-foreground">Components</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <div className={`text-xl font-bold ${dependencyGraph.cycles.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {dependencyGraph.cycles.length}
                </div>
                <div className="text-xs text-muted-foreground">Circular Deps</div>
              </div>
            </div>
            {dependencyGraph.entryPoints.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Entry points</div>
                <div className="flex flex-wrap gap-1">
                  {dependencyGraph.entryPoints.map(e => (
                    <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                  ))}
                </div>
              </div>
            )}
            {componentGraph.highComplexity.length > 0 && (
              <div>
                <div className="text-xs text-amber-500 mb-1">High complexity components</div>
                <div className="flex flex-wrap gap-1">
                  {componentGraph.highComplexity.map(c => (
                    <Badge key={c} variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issues */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Detected Issues
              {allIssues.length > 0 && <Badge variant="destructive" className="text-[10px] ml-auto">{allIssues.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allIssues.length === 0 && performanceIssues.length === 0 && securityIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCircle2 className="h-4 w-4" />No issues detected
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {allIssues.slice(0, 10).map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <SEVERITY_ICON severity={issue.severity} />
                    <div>
                      <span className="text-muted-foreground">{(issue as { file?: string }).file}: </span>
                      {issue.message}
                    </div>
                  </div>
                ))}
                {performanceIssues.slice(0, 3).map((issue, i) => (
                  <div key={`perf-${i}`} className="flex items-start gap-2 text-xs">
                    <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Version History */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {versions.map(v => (
                <div key={v.versionNum} className="flex items-center gap-3 text-xs border-b border-border/30 pb-2">
                  <Badge variant="outline" className="text-[10px] shrink-0">v{v.versionNum}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-foreground">{v.prompt}</div>
                    <div className="text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()} · {v.agent}Agent</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Improvement Logs */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">AI Improvement History</CardTitle>
          </CardHeader>
          <CardContent>
            {improvementLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No maintenance cycles run yet. Click "Run Maintenance" to start.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {improvementLogs.map(log => (
                  <div key={log.id} className="text-xs border-b border-border/30 pb-2 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{log.agent}Agent</Badge>
                      <span className="text-muted-foreground">{new Date(log.runAt).toLocaleDateString()}</span>
                      <span className={`ml-auto font-medium ${log.healthAfter > log.healthBefore ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {log.healthBefore}% → {log.healthAfter}%
                      </span>
                    </div>
                    <div className="text-muted-foreground">{log.description}</div>
                    {log.changes.length > 0 && (
                      <div className="text-muted-foreground/70">{log.changes.slice(0, 3).join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Analysis Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">File Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left pb-2 font-medium">File</th>
                  <th className="text-left pb-2 font-medium">Language</th>
                  <th className="text-right pb-2 font-medium">Lines</th>
                  <th className="text-right pb-2 font-medium">Complexity</th>
                  <th className="text-right pb-2 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {analyses.map(a => (
                  <tr key={a.path}>
                    <td className="py-1.5 font-mono truncate max-w-[200px]">{a.path}</td>
                    <td className="py-1.5 text-muted-foreground">{a.language}</td>
                    <td className="py-1.5 text-right">{a.lines}</td>
                    <td className={`py-1.5 text-right ${a.complexity > 60 ? 'text-red-500' : a.complexity > 30 ? 'text-amber-500' : 'text-green-500'}`}>
                      {a.complexity}
                    </td>
                    <td className={`py-1.5 text-right ${a.issueCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {a.issueCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Health Trend */}
      {healthSnapshots.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />Health Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-20">
              {healthSnapshots.map((snap, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div
                    className={`w-full rounded-sm transition-all ${HEALTH_BG(snap.overall)}`}
                    style={{ height: `${snap.overall}%`, opacity: 0.8 }}
                    title={`v${snap.versionNum}: ${snap.overall}%`}
                  />
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">v{snap.versionNum}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
