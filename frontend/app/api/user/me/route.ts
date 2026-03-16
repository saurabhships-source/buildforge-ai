import { NextResponse } from 'next/server'
import { requireUserId, DEV_APP_USER, isDatabaseConfigured } from '@/lib/safe-auth'

export async function GET() {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  // No DB configured — return dev mock
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      id: DEV_APP_USER.id,
      clerkId: DEV_APP_USER.clerkId,
      name: DEV_APP_USER.name,
      email: DEV_APP_USER.email,
      role: DEV_APP_USER.role,
      plan: DEV_APP_USER.subscription.plan,
      creditsRemaining: DEV_APP_USER.subscription.creditsRemaining,
      creditsTotal: DEV_APP_USER.subscription.creditsTotal,
      hasGithubToken: false,
    })
  }

  try {
    const { db } = await import('@/lib/db')

    let user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { subscription: true },
    })

    if (!user) {
      const { currentUser } = await import('@clerk/nextjs/server')
      const clerkUser = await currentUser()
      if (!clerkUser) return new NextResponse('User not found', { status: 404 })

      const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email

      user = await db.user.create({
        data: {
          clerkId: userId,
          email,
          name,
          subscription: { create: { plan: 'free', creditsRemaining: 50, creditsTotal: 50 } },
        },
        include: { subscription: true },
      })
    }

    return NextResponse.json({
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.subscription?.plan ?? 'free',
      creditsRemaining: user.subscription?.creditsRemaining ?? 0,
      creditsTotal: user.subscription?.creditsTotal ?? 50,
      hasGithubToken: !!user.githubToken,
    })
  } catch (err) {
    console.error('[/api/user/me] DB error:', err)
    // Return dev mock on DB failure so the UI doesn't break
    return NextResponse.json({
      id: DEV_APP_USER.id,
      clerkId: userId,
      name: 'User',
      email: '',
      role: 'user',
      plan: 'free',
      creditsRemaining: 50,
      creditsTotal: 50,
      hasGithubToken: false,
    })
  }
}
