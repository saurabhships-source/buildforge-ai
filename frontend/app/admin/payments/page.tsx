'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { safeFetch } from '@/lib/safe-fetch'

type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

interface PaymentData {
  totalRevenue: number
  activeCount: number
  series: { label: string; revenue: number; signups: number }[]
  planBreakdown: { free: number; pro: number; enterprise: number }
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaymentData | null>(null)
  const [period, setPeriod] = useState<Period>('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    safeFetch<PaymentData>(`/api/admin/payments?period=${period}`)
      .then(data => { if (data) setData(data) })
      .finally(() => setLoading(false))
  }, [period])

  const maxRevenue = Math.max(...(data?.series.map(s => s.revenue) ?? [1]), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Analytics</h1>
        <p className="text-muted-foreground text-sm">Revenue and subscription statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${data?.totalRevenue.toLocaleString() ?? '—'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Subs</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.activeCount ?? '—'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pro Users</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-400">{data?.planBreakdown.pro ?? '—'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Enterprise</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-cyan-400">{data?.planBreakdown.enterprise ?? '—'}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Over Time</CardTitle>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="flex items-end gap-1 h-48">
              {data?.series.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${Math.max(4, (s.revenue / maxRevenue) * 160)}px` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-popover border rounded px-1 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      ${s.revenue}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground rotate-45 origin-left">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Plan Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {data && Object.entries(data.planBreakdown).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{plan}</Badge>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
