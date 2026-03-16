'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, Zap, RefreshCw } from 'lucide-react'

const PLANS = [
  {
    name: 'Free Starter',
    price: { monthly: 0, annual: 0 },
    credits: 50,
    desc: 'Try BuildForge and build your first AI project.',
    cta: 'Start Free',
    href: '/signup',
    highlight: false,
    badge: null,
    features: [
      '50 credits / month',
      '2 AI-generated projects',
      'Basic templates',
      'Community support',
      'Preview deployments',
      '1 GB storage',
    ],
  },
  {
    name: 'Pro',
    price: { monthly: 19, annual: 15 },
    credits: 500,
    desc: 'For founders and indie hackers shipping real products.',
    cta: 'Start 14-Day Pro Trial',
    href: '/signup?plan=pro',
    highlight: true,
    badge: 'Most Popular',
    features: [
      '500 credits / month',
      'Unlimited projects',
      'All templates + marketplace',
      'AI Growth Engine',
      'Self-healing code repair',
      'Priority support',
      'Custom domains',
      'GitHub export',
      '20 GB storage',
    ],
  },
  {
    name: 'Team',
    price: { monthly: 49, annual: 39 },
    credits: 2000,
    desc: 'For teams building and launching multiple products.',
    cta: 'Start Team Trial',
    href: '/signup?plan=team',
    highlight: false,
    badge: null,
    features: [
      '2,000 credits / month',
      'Everything in Pro',
      'Up to 10 team members',
      'Startup Generator',
      'Multi-agent AI system',
      'Advanced analytics',
      'SSO & audit logs',
      '100 GB storage',
    ],
  },
]

const CREDIT_COSTS = [
  { action: 'Generate SaaS project', cost: 10 },
  { action: 'AI code improvement', cost: 2 },
  { action: 'Deploy project', cost: 5 },
  { action: 'Startup Generator', cost: 15 },
  { action: 'Growth Engine run', cost: 8 },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-white/[0.01]">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 mb-4">
            Pricing
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Simple, credit-based pricing
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            Start free. Credits reset every month. Upgrade when you need more.
          </p>

          {/* Annual toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                !annual
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                annual
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Annual
              <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-b from-violet-600 to-indigo-700 shadow-2xl shadow-violet-500/30 ring-1 ring-violet-500/50 scale-[1.02]'
                  : 'border border-slate-200 bg-white dark:border-white/8 dark:bg-white/3'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                    <Zap className="h-3 w-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name + desc */}
              <div className="mb-4">
                <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlight ? 'text-violet-200' : 'text-slate-500 dark:text-slate-400'}`}>
                  {plan.desc}
                </p>
              </div>

              {/* Price */}
              <div className="mb-2">
                <span className={`text-5xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  ${annual ? plan.price.annual : plan.price.monthly}
                </span>
                <span className={`text-sm ml-1 ${plan.highlight ? 'text-violet-200' : 'text-slate-400'}`}>
                  {plan.price.monthly === 0 ? '/ month' : '/mo'}
                </span>
                {annual && plan.price.monthly > 0 && (
                  <div className={`text-xs mt-0.5 ${plan.highlight ? 'text-violet-200' : 'text-slate-400'}`}>
                    billed annually
                  </div>
                )}
              </div>

              {/* Credit badge */}
              <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold mb-5 ${
                plan.highlight
                  ? 'bg-white/15 text-white'
                  : 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
              }`}>
                <RefreshCw className="h-3 w-3" />
                {plan.credits.toLocaleString()} credits / month — resets monthly
              </div>

              {/* CTA */}
              <Link
                href={plan.href}
                className={`block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all mb-6 ${
                  plan.highlight
                    ? 'bg-white text-violet-700 hover:bg-violet-50 shadow-lg'
                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                }`}
              >
                {plan.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? 'text-violet-200' : 'text-emerald-500'}`} />
                    <span className={`text-sm ${plan.highlight ? 'text-violet-100' : 'text-slate-600 dark:text-slate-300'}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Credit cost explainer */}
        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/8 dark:bg-white/3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">How credits work</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Credits are used when generating apps, improving code, or deploying projects. They reset on the 1st of every month.
              </p>
            </div>
            <div className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <RefreshCw className="h-3 w-3" />
              Resets every month
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CREDIT_COSTS.map((item) => (
              <div key={item.action} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/3">
                <div className="text-lg font-bold text-violet-600 dark:text-violet-400">{item.cost}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{item.action}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
          Need more credits or a custom plan?{' '}
          <Link href="/contact" className="text-violet-600 hover:underline dark:text-violet-400">
            Contact us for Enterprise pricing
          </Link>
        </p>
      </div>
    </section>
  )
}
