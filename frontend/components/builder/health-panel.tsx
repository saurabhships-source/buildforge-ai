'use client'

import { useState } from 'react'
import { Activity, ChevronDown, ChevronUp, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { HealthReport, HealthMetric } from '@/app/api/health-check/route'

interface Props {
  files: Record<string, string>
  isGenerating: boolean
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-500 border-green-500/30 bg-green-500/10',
  B: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  C: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  D: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
  F: 'text-red-500 border-red-500/30 bg-red-500/10',
}

const STATUS_ICONS = {
  good: <CheckCircle className="h-3 w-3 text-green-500" />,
  warning: <AlertTriangle className="h-3 w-3 text-yellow-500" />,
  error: <XCircle className="h-3 w-3 text-red-500" />,
}

function ScoreBar({ score, status }: { score: number; status: HealthMetric['status'] }) {
  const color = status === 'good' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-mono w-7 text-right text-muted-foreground">{score}</span>
    </div>
  )
}

export function HealthPanel({ files, isGenerating }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [report, setReport] = useState<HealthReport | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null)

  const hasFiles = Object.keys(files).length > 0

  const runHealthCheck = async () => {
    if (!hasFiles || isChecking) return
    setIsChecking(true)
    try {
      const res = await fetch('/api/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      })
      const data = await res.json()
      if (data.report) setReport(data.report)
    } catch { /* non-critical */ }
    finally { setIsChecking(false) }
  }

  if (!hasFiles) return null

  return (
    <div className="border-t border-border/50 bg-card/20">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          <span className="uppercase tracking-wider">Health</span>
          {report && (
            <Badge variant="outline" className={cn('text-[9px] h-4 ml-1', GRADE_COLORS[report.grade])}>
              {report.grade} · {report.overall}
            </Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {!report ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs gap-1.5"
              onClick={runHealthCheck}
              disabled={isChecking || isGenerating}
            >
              {isChecking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
              {isChecking ? 'Analyzing...' : 'Run Health Check'}
            </Button>
          ) : (
            <div className="space-y-2">
              {/* Overall score */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Overall Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', report.overall >= 80 ? 'bg-green-500' : report.overall >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
                      style={{ width: `${report.overall}%` }}
                    />
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] h-5', GRADE_COLORS[report.grade])}>
                    {report.grade}
                  </Badge>
                </div>
              </div>

              {/* Metrics */}
              {report.metrics.map(metric => (
                <div key={metric.name} className="space-y-1">
                  <button
                    onClick={() => setExpandedMetric(expandedMetric === metric.name ? null : metric.name)}
                    className="flex items-center justify-between w-full group"
                  >
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICONS[metric.status]}
                      <span className="text-[10px] font-medium">{metric.name}</span>
                    </div>
                    <ChevronDown className={cn('h-2.5 w-2.5 text-muted-foreground transition-transform', expandedMetric === metric.name && 'rotate-180')} />
                  </button>
                  <ScoreBar score={metric.score} status={metric.status} />
                  {expandedMetric === metric.name && (metric.issues.length > 0 || metric.suggestions.length > 0) && (
                    <div className="pl-4 space-y-1 pt-1">
                      {metric.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-1 text-[10px] text-red-500">
                          <span className="shrink-0 mt-0.5">•</span>{issue}
                        </div>
                      ))}
                      {metric.suggestions.slice(0, 2).map((s, i) => (
                        <div key={i} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                          <span className="shrink-0 mt-0.5 text-blue-400">→</span>{s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Button
                size="sm"
                variant="ghost"
                className="w-full h-6 text-[10px] text-muted-foreground"
                onClick={runHealthCheck}
                disabled={isChecking}
              >
                {isChecking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Re-run
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
