/**
 * POST /api/credits/reset
 * Monthly credit reset — called by a cron job or admin.
 * Resets all subscriptions to their plan's credit allocation.
 *
 * Auth: x-cron-secret header OR admin user session
 */

import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { db } from '@/lib/db'
import { PLAN_CREDITS } from '@/lib/credits'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: Request) {
  // Allow cron secret OR admin user
  const cronHeader = req.headers.get('x-cron-secret')
  const isCron = CRON_SECRET && cronHeader === CRON_SECRET

  if (!isCron) {
    const userIdOrResponse = await requireUserId()
    if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
    const userId = userIdOrResponse

    const user = await db.user.findUnique({ where: { clerkId: userId }, select: { role: true } })
    const isAdmin =
      user?.role === 'admin' ||
      (process.env.ADMIN_USER_IDS ?? '').split(',').filter(Boolean).includes(userId)

    if (!isAdmin) return new NextResponse('Forbidden', { status: 403 })
  }

  const subscriptions = await db.subscription.findMany({
    select: { id: true, plan: true },
  })

  const updates = subscriptions.map((sub) => {
    const total = PLAN_CREDITS[sub.plan] ?? PLAN_CREDITS.free
    return db.subscription.update({
      where: { id: sub.id },
      data: {
        creditsRemaining: total,
        creditsTotal: total,
        updatedAt: new Date(),
      },
    })
  })

  await db.$transaction(updates)

  return NextResponse.json({
    reset: subscriptions.length,
    timestamp: new Date().toISOString(),
  })
}
