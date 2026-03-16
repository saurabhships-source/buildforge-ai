'use client'

import { useEffect, useState } from 'react'
import { Activity, Users, Zap, Server } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Analytics {
  totalUsers: number
  activeUsers: number
  totalProjects: number
  totalVersions: number
  deployments: number
  creditsUsed: number
}

export default function AdminTrafficPage() {
  const [data, setData] = useState<Analytics | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.json()).then(setData)
  }, [])

  const metrics = [
    { label: 'Total Registered Users', value: data?.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'Active Users (30d)', value: data?.activeUsers, icon: Activity, color: 'text-green-400' },
    { label: 'Projects Generated', value: data?.totalProjects, icon: Zap, color: 'text-purple-400' },
    { label: 'Total Versions', value: data?.totalVersions, icon: Activity, color: 'text-orange-400' },
    { label: 'Deployments', value: data?.deployments, icon: Server, color: 'text-cyan-400' },
    { label: 'Credits Used', value: data?.creditsUsed, icon: Zap, color: 'text-pink-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Traffic Analytics</h1>
        <p className="text-muted-foreground text-sm">Platform usage and engagement metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value?.toLocaleString() ?? '—'}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Google Analytics Integration</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add your Google Analytics Measurement ID to <code className="bg-muted px-1 rounded text-xs">.env.local</code> to enable full traffic tracking.
          </p>
          <div className="bg-muted rounded-lg p-3 font-mono text-xs">
            NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
          </div>
          <p className="text-xs text-muted-foreground">
            Once configured, page views, events, and conversions will appear in your Google Analytics dashboard.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Visitors', value: '—', pct: 100 },
              { label: 'Signups', value: data?.totalUsers?.toLocaleString() ?? '—', pct: 40 },
              { label: 'First Project', value: data?.totalProjects?.toLocaleString() ?? '—', pct: 25 },
              { label: 'Deployed', value: data?.deployments?.toLocaleString() ?? '—', pct: 15 },
            ].map(step => (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-sm w-32 text-muted-foreground">{step.label}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${step.pct}%` }} />
                </div>
                <span className="text-sm font-mono w-16 text-right">{step.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
