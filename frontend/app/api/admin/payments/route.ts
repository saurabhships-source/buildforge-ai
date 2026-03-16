import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/check-admin'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? 'monthly' // daily|weekly|monthly|quarterly|yearly

  // Aggregate subscription data as revenue proxy
  const subs = await db.subscription.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const planRevenue: Record<string, number> = { free: 0, pro: 19, enterprise: 49 }
  const totalRevenue = subs.reduce((sum, s) => sum + (planRevenue[s.plan] ?? 0), 0)
  const activeCount = subs.filter(s => !s.cancelAtPeriodEnd).length

  // Build time-series buckets from createdAt
  const now = new Date()
  const buckets = buildTimeBuckets(period, now)
  const series = buckets.map(bucket => ({
    label: bucket.label,
    revenue: subs
      .filter(s => s.createdAt >= bucket.start && s.createdAt < bucket.end)
      .reduce((sum, s) => sum + (planRevenue[s.plan] ?? 0), 0),
    signups: subs.filter(s => s.createdAt >= bucket.start && s.createdAt < bucket.end).length,
  }))

  const planBreakdown = {
    free: subs.filter(s => s.plan === 'free').length,
    pro: subs.filter(s => s.plan === 'pro').length,
    enterprise: subs.filter(s => s.plan === 'enterprise').length,
  }

  return NextResponse.json({ totalRevenue, activeCount, series, planBreakdown, subscriptions: subs.slice(0, 50) })
}

function buildTimeBuckets(period: string, now: Date) {
  const buckets: { label: string; start: Date; end: Date }[] = []
  if (period === 'daily') {
    for (let i = 29; i >= 0; i--) {
      const start = new Date(now); start.setDate(now.getDate() - i); start.setHours(0, 0, 0, 0)
      const end = new Date(start); end.setDate(start.getDate() + 1)
      buckets.push({ label: start.toLocaleDateString('en', { month: 'short', day: 'numeric' }), start, end })
    }
  } else if (period === 'weekly') {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now); start.setDate(now.getDate() - i * 7); start.setHours(0, 0, 0, 0)
      const end = new Date(start); end.setDate(start.getDate() + 7)
      buckets.push({ label: `W${12 - i}`, start, end })
    }
  } else if (period === 'monthly') {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      buckets.push({ label: start.toLocaleDateString('en', { month: 'short', year: '2-digit' }), start, end })
    }
  } else if (period === 'quarterly') {
    for (let i = 7; i >= 0; i--) {
      const q = Math.floor(now.getMonth() / 3) - i
      const year = now.getFullYear() + Math.floor(q / 4)
      const qMod = ((q % 4) + 4) % 4
      const start = new Date(year, qMod * 3, 1)
      const end = new Date(year, qMod * 3 + 3, 1)
      buckets.push({ label: `Q${qMod + 1} ${year}`, start, end })
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i
      const start = new Date(year, 0, 1)
      const end = new Date(year + 1, 0, 1)
      buckets.push({ label: String(year), start, end })
    }
  }
  return buckets
}
