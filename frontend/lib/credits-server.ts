/**
 * Server-side credit enforcement — used by all API routes.
 * Never import this in client components.
 */

import { db } from '@/lib/db'
import { CREDIT_COSTS, type CreditAction } from '@/lib/credits'

const ADMIN_IDS = () =>
  (process.env.ADMIN_USER_IDS ?? '').split(',').filter(Boolean)

export interface CreditCheckResult {
  allowed: boolean
  isAdmin: boolean
  creditsRemaining: number
  error?: string
}

/**
 * Check if a user has enough credits for an action.
 * Returns allowed=true for admins unconditionally.
 */
export async function checkCredits(
  clerkId: string,
  action: CreditAction
): Promise<CreditCheckResult> {
  const cost = CREDIT_COSTS[action]

  const user = await db.user.findUnique({
    where: { clerkId },
    include: { subscription: true },
  })

  if (!user) return { allowed: false, isAdmin: false, creditsRemaining: 0, error: 'User not found' }

  const isAdmin =
    user.role === 'admin' || ADMIN_IDS().includes(clerkId)

  if (isAdmin) {
    return { allowed: true, isAdmin: true, creditsRemaining: 9999 }
  }

  const remaining = user.subscription?.creditsRemaining ?? 0

  if (remaining < cost) {
    return {
      allowed: false,
      isAdmin: false,
      creditsRemaining: remaining,
      error: `You have run out of credits. Upgrade your plan to continue.`,
    }
  }

  return { allowed: true, isAdmin: false, creditsRemaining: remaining }
}

/**
 * Deduct credits for an action. Call AFTER the action succeeds.
 * Admins are skipped silently.
 */
export async function deductCredits(
  clerkId: string,
  action: CreditAction,
  metadata?: Record<string, unknown>
): Promise<void> {
  const cost = CREDIT_COSTS[action]
  const isAdmin =
    (await db.user.findUnique({ where: { clerkId }, select: { role: true } }))?.role === 'admin' ||
    ADMIN_IDS().includes(clerkId)

  if (isAdmin) return

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return

  await db.$transaction([
    db.subscription.update({
      where: { userId: user.id },
      data: { creditsRemaining: { decrement: cost } },
    }),
    db.creditUsage.create({
      data: {
        userId: user.id,
        action,
        creditsUsed: cost,
        metadata: metadata ?? {},
      },
    }),
  ])
}

/**
 * Check and deduct in one call — use this in most API routes.
 * Returns error string if not allowed, null if ok.
 */
export async function enforceCredits(
  clerkId: string,
  action: CreditAction,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  const check = await checkCredits(clerkId, action)
  if (!check.allowed) return check.error ?? 'Insufficient credits'
  if (!check.isAdmin) {
    await deductCredits(clerkId, action, metadata)
  }
  return null
}
