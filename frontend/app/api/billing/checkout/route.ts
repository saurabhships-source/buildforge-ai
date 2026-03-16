import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { db } from '@/lib/db'
import { stripe, PLANS, PlanId } from '@/lib/stripe'
import { z } from 'zod'

const schema = z.object({
  planId: z.enum(['pro', 'team', 'enterprise']),
  interval: z.enum(['monthly', 'yearly']),
})

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey || stripeKey === 'sk_test_placeholder') {
    return NextResponse.json(
      { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment variables.' },
      { status: 503 }
    )
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })
  if (!user) return new NextResponse('User not found', { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { planId, interval } = parsed.data
  const plan = PLANS[planId as PlanId]
  const priceId = interval === 'yearly' ? plan.yearlyPriceId : plan.monthlyPriceId

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price not configured for ${planId} ${interval}. Add the price ID to your environment variables.` },
      { status: 400 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Reuse or create Stripe customer
  let customerId = user.subscription?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id, clerkId: userId },
    })
    customerId = customer.id

    await db.subscription.update({
      where: { userId: user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=true`,
    cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
    metadata: { userId: user.id, planId },
    subscription_data: {
      metadata: { userId: user.id, planId },
    },
  })

  return NextResponse.json({ url: session.url })
}
