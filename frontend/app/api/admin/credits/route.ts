import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/check-admin'
import { logAdminAction } from '@/lib/admin/audit-log'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes
  const admin = adminOrRes

  const { userId, action, amount } = await req.json()
  if (!userId || !action) return NextResponse.json({ error: 'userId and action required' }, { status: 400 })

  const sub = await db.subscription.findUnique({ where: { userId } })
  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

  let newCredits = sub.creditsRemaining
  if (action === 'add') newCredits = sub.creditsRemaining + (amount ?? 100)
  else if (action === 'remove') newCredits = Math.max(0, sub.creditsRemaining - (amount ?? 0))
  else if (action === 'reset') newCredits = sub.creditsTotal
  else return NextResponse.json({ error: 'action must be add|remove|reset' }, { status: 400 })

  await db.subscription.update({ where: { userId }, data: { creditsRemaining: newCredits } })
  await logAdminAction({
    adminId: admin.id, action: 'credit_update', targetId: userId, targetType: 'user',
    details: { action, amount, before: sub.creditsRemaining, after: newCredits },
  })

  return NextResponse.json({ success: true, creditsRemaining: newCredits })
}

// GET /api/admin/credits — credit analytics
export async function GET(req: Request) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') ?? '30', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [totalConsumed, byAction, topUsers] = await Promise.all([
    // Total credits consumed in period
    db.creditUsage.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { creditsUsed: true },
    }),

    // Credits by action type
    db.creditUsage.groupBy({
      by: ['action'],
      where: { createdAt: { gte: since } },
      _sum: { creditsUsed: true },
      _count: { id: true },
      orderBy: { _sum: { creditsUsed: 'desc' } },
    }),

    // Top users by consumption
    db.creditUsage.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since } },
      _sum: { creditsUsed: true },
      orderBy: { _sum: { creditsUsed: 'desc' } },
      take: 10,
    }),
  ])

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    totalCreditsConsumed: totalConsumed._sum.creditsUsed ?? 0,
    byAction: byAction.map(r => ({
      action: r.action,
      creditsUsed: r._sum.creditsUsed ?? 0,
      count: r._count.id,
    })),
    topUsers: topUsers.map(r => ({
      userId: r.userId,
      creditsUsed: r._sum.creditsUsed ?? 0,
    })),
  })
}

