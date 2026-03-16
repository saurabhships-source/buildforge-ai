'use client'

import { useEffect, useState } from 'react'
import { Activity, Server, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { safeFetch } from '@/lib/safe-fetch'

interface HealthData {
  status: string
  checks: Record<string, { status: string; latency?: number; message?: string }>
  timestamp: string
}

interface Analytics {
  recentJobs: { id: string; type: string; status: string; createdAt: string; error?: string }[]
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    safeFetch<HealthData>('/api/system/health').then(d => { if (d) setHealth(d) })
    safeFetch<Analytics>('/api/admin/analytics').then(d => { if (d) setAnalytics(d) })
    const interval = setInterval(() => {
      safeFetch<HealthData>('/api/system/health').then(d => { if (d) setHealth(d) })
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const statusColor = (s: string) =>
    s === 'healthy' || s === 'completed' ? 'text-green-400' :
    s === 'warning' || s === 'running' ? 'text-yellow-400' : 'text-red-400'

  const statusBadge = (s: string) =>
    s === 'healthy' || s === 'completed' ? 'default' :
    s === 'warning' || s === 'running' ? 'secondary' : 'destructive'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Health</h1>
          <p className="text-muted-foreground text-sm">System monitoring and worker status</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Auto-refreshes every 15s
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {health?.checks && Object.entries(health.checks).map(([name, check]) => (
          <Card key={name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm capitalize">{name.replace(/_/g, ' ')}</CardTitle>
              {check.status === 'healthy' ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertTriangle className={`h-4 w-4 ${statusColor(check.status)}`} />
              )}
            </CardHeader>
            <CardContent>
              <Badge variant={statusBadge(check.status) as any}>{check.status}</Badge>
              {check.latency && <p className="text-xs text-muted-foreground mt-1">{check.latency}ms</p>}
              {check.message && <p className="text-xs text-muted-foreground mt-1">{check.message}</p>}
            </CardContent>
          </Card>
        ))}

        {!health?.checks && (
          <Card className="col-span-3">
            <CardContent className="py-8 text-center text-muted-foreground">Loading system health...</CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics?.recentJobs?.slice(0, 20).map(job => (
              <div key={job.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3">
                  <Badge variant={statusBadge(job.status) as any} className="text-xs">{job.status}</Badge>
                  <span className="text-sm font-mono">{job.type}</span>
                  {job.error && <span className="text-xs text-red-400 truncate max-w-xs">{job.error}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</span>
              </div>
            )) ?? <p className="text-muted-foreground text-sm">No recent jobs</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
