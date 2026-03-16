'use client'

import { useEffect, useState } from 'react'
import { Users, DollarSign, CreditCard, TrendingUp, Zap, Activity, Server, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { safeFetch } from '@/lib/safe-fetch'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalProjects: number
  totalVersions: number
  deployments: number
  creditsUsed: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    safeFetch<Stats>('/api/admin/analytics')
      .then(data => { if (data) setStats(data) })
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, href: '/admin/users', color: 'text-blue-400' },
    { label: 'Active Users (30d)', value: stats?.activeUsers, icon: Activity, href: '/admin/users', color: 'text-green-400' },
    { label: 'Projects Generated', value: stats?.totalProjects, icon: Zap, href: '/admin/issues', color: 'text-purple-400' },
    { label: 'Deployments', value: stats?.deployments, icon: Server, href: '/admin/system', color: 'text-cyan-400' },
    { label: 'Credits Used', value: stats?.creditsUsed, icon: CreditCard, href: '/admin/credits', color: 'text-orange-400' },
    { label: 'Total Versions', value: stats?.totalVersions, icon: TrendingUp, href: '/admin/payments', color: 'text-pink-400' },
  ]

  const navLinks = [
    { href: '/admin/users', label: 'User Management', desc: 'View, suspend, delete users' },
    { href: '/admin/credits', label: 'Credit Management', desc: 'Add, remove, reset credits' },
    { href: '/admin/payments', label: 'Payment Analytics', desc: 'Revenue charts and subscriptions' },
    { href: '/admin/traffic', label: 'Traffic Analytics', desc: 'Visitors, signups, conversions' },
    { href: '/admin/system', label: 'Platform Health', desc: 'AI workers, deploy queue, errors' },
    { href: '/admin/issues', label: 'Issue Tracker', desc: 'Generation and deploy failures' },
    { href: '/admin/logs', label: 'Activity Logs', desc: 'Admin audit trail' },
    { href: '/admin/cache', label: 'Cache Manager', desc: 'Semantic cache stats and invalidation' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Founder Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Full platform control — unlimited access</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(card => (
          <Link key={card.label} href={card.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '—' : (stats ? card.value?.toLocaleString() ?? '0' : '—')}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Admin Sections</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-4">
                  <p className="font-medium text-sm">{link.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{link.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
