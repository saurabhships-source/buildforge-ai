import { headers } from 'next/headers'
import { stripe, PLANS, PlanId } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const headerPayload = await headers()
  const signature = headerPayload.get('stripe-signature')

  if (!signature) return new Response('Missing stripe-signature', { status: 400 })

  let event: Stripe.Event
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET not configured')
      return new Response('Webhook secret not configured', { status: 500 })
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const planId = (sub.metadata.planId ?? 'free') as PlanId
      const plan = PLANS[planId] ?? PLANS.free
      const userId = sub.metadata.userId

      if (!userId) break

      await db.subscription.update({
        where: { userId },
        data: {
          stripeSubscriptionId: sub.id,
          plan: planId,
          creditsTotal: plan.credits,
          creditsRemaining: plan.credits,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.userId
      if (!userId) break

      await db.subscription.update({
        where: { userId },
        data: {
          plan: 'free',
          stripeSubscriptionId: null,
          creditsTotal: 50,
          creditsRemaining: 50,
          cancelAtPeriodEnd: false,
        },
      })
      break
    }

    case 'invoice.paid': {
      // Reset credits on successful renewal
      const invoice = event.data.object as Stripe.Invoice
      const subId = (invoice as { subscription?: string }).subscription
      if (!subId) break

      const sub = await stripe.subscriptions.retrieve(subId)
      const planId = (sub.metadata.planId ?? 'free') as PlanId
      const plan = PLANS[planId] ?? PLANS.free
      const userId = sub.metadata.userId
      if (!userId) break

      await db.subscription.update({
        where: { userId },
        data: {
          creditsRemaining: plan.credits,
          creditsTotal: plan.credits,
        },
      })
      break
    }
  }

  return new Response('OK', { status: 200 })
}
