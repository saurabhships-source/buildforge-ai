import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export const PLANS = {
  free: {
    name: 'Free',
    credits: 50,
    monthlyPriceId: null,
    yearlyPriceId: null,
    monthlyPrice: 0,
    yearlyPrice: 0,
  },
  pro: {
    name: 'Pro',
    credits: 500,
    monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
    yearlyPriceId: process.env.STRIPE_PRICE_PRO_YEARLY ?? null,
    monthlyPrice: 19,
    yearlyPrice: 15,
  },
  team: {
    name: 'Team',
    credits: 2000,
    monthlyPriceId: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? null,
    yearlyPriceId: process.env.STRIPE_PRICE_TEAM_YEARLY ?? null,
    monthlyPrice: 49,
    yearlyPrice: 39,
  },
  enterprise: {
    name: 'Enterprise',
    credits: 9999,
    monthlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? null,
    yearlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? null,
    monthlyPrice: 99,
    yearlyPrice: 79,
  },
} as const

export type PlanId = keyof typeof PLANS
