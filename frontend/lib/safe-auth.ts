// Safe auth wrapper — works with or without Clerk configured.
// When Clerk keys are missing (dev/preview), returns a mock dev user
// so API routes don't crash with empty responses.

import { NextResponse } from 'next/server'

const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''

const hasClerkKey =
  (rawKey.startsWith('pk_test_') || rawKey.startsWith('pk_live_')) &&
  !rawKey.includes('your_') &&
  !rawKey.includes('placeholder') &&
  rawKey.length > 20

const hasDatabase =
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('user:password@host') &&
  !process.env.DATABASE_URL.includes('your_')

export const DEV_USER_ID = 'dev_user_local'

export const DEV_APP_USER = {
  id: 'dev_local',
  clerkId: DEV_USER_ID,
  name: 'Dev User',
  email: 'dev@buildforge.local',
  role: 'admin' as const,
  githubToken: null as string | null,
  subscription: {
    plan: 'pro' as const,
    creditsRemaining: 9999,
    creditsTotal: 9999,
  },
}

/** Returns userId or null. Never throws. */
export async function safeGetUserId(): Promise<string | null> {
  if (!hasClerkKey) return DEV_USER_ID
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    return userId
  } catch {
    return null
  }
}

/** Returns userId or a 401 NextResponse. Never throws. */
export async function requireUserId(): Promise<string | NextResponse> {
  const userId = await safeGetUserId()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })
  return userId
}

/** Returns true if DB is configured and reachable */
export function isDatabaseConfigured(): boolean {
  return !!hasDatabase
}

/** Wraps a DB call — returns null instead of throwing if DB isn't configured */
export async function safeDb<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!hasDatabase) return null
  try {
    return await fn()
  } catch (err) {
    console.error('[safeDb] DB error:', err)
    return null
  }
}
