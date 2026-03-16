import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const customerId = user.subscription?.stripeCustomerId
  if (!customerId) {
    return NextResponse.json({ error: 'No billing account found. Subscribe to a plan first.' }, { status: 400 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey || stripeKey === 'sk_test_placeholder') {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}
