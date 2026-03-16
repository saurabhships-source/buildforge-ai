/**
 * GET /api/cron/reset-credits
 * Monthly credit reset — called by a cron service (Vercel Cron, Railway, etc.)
 * Protected by CRON_SECRET header.
 *
 * Resets all subscriptions to their plan's credit allocation.
 * Schedule: 0 0 1 * * (1st of every month at midnight UTC)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PLAN_CREDITS } from '@/lib/credits'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')

  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  if (secret !== CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
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

  console.log(`[cron/reset-credits] Reset ${subscriptions.length} subscriptions at ${new Date().toISOString()}`)

  return NextResponse.json({
    ok: true,
    reset: subscriptions.length,
    timestamp: new Date().toISOString(),
  })
}
