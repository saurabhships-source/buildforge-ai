'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, CreditCard, ExternalLink, Loader2, Sparkles, Zap, Star, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: Sparkles,
    desc: 'Get started for free',
    monthly: 0,
    yearly: 0,
    credits: '50 credits/month',
    features: ['50 AI credits/month', 'Basic templates', 'Community projects', 'Public projects only', 'Single workspace', 'Basic AI models'],
    cta: 'Start Free',
    iconBg: 'bg-slate-600',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    desc: 'For serious builders',
    monthly: 19,
    yearly: 15,
    credits: '500 credits/month',
    features: ['500 AI credits/month', 'Advanced templates', 'Private projects', 'AI Project Hub publishing', 'Priority AI models', 'GitHub export', 'Vercel / Netlify deploy'],
    cta: 'Start 14-Day Trial',
    iconBg: 'bg-indigo-600',
  },
  {
    id: 'team',
    name: 'Team',
    icon: Star,
    desc: 'For power users & teams',
    monthly: 49,
    yearly: 39,
    credits: '2000 credits/month',
    features: ['2000 AI credits/month', 'All SaaS templates', 'Full agent system', 'Up to 10 team members', 'Advanced analytics', 'SSO & audit logs', 'Priority support', '100 GB storage'],
    cta: 'Start Team Trial',
    popular: true,
    iconBg: 'bg-gradient-to-br from-violet-500 to-indigo-600',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    desc: 'For large teams and orgs',
    monthly: null,
    yearly: null,
    credits: 'Unlimited',
    features: ['Unlimited projects', 'Private deployments', 'Custom AI agents', 'Team management', 'Dedicated support', 'SSO & security', 'SLA guarantee', 'Custom integrations'],
    cta: 'Contact Sales',
    iconBg: 'bg-emerald-600',
  },
]

export default function BillingPage() {
  const { user, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const [isYearly, setIsYearly] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  // Handle Stripe redirect callbacks
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Payment successful! Your plan has been upgraded.')
      refreshUser()
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled. You remain on your current plan.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free' || planId === user?.plan) return
    if (planId === 'enterprise') { window.location.href = '/contact'; return }
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval: isYearly ? 'yearly' : 'monthly' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? 'Failed to start checkout. Check your Stripe configuration.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('No billing account found. Subscribe to a plan first.')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setPortalLoading(false)
    }
  }

  const currentPlan = PLANS.find(p => p.id === (user?.plan ?? 'free'))
  const creditsTotal = user?.creditsTotal ?? 50
  const creditsRemaining = user?.creditsRemaining ?? 0
  const creditsUsed = creditsTotal - creditsRemaining
  const usagePct = creditsTotal > 0 ? Math.min((creditsUsed / creditsTotal) * 100, 100) : 0

  return (
    <div className="space-y-8 p-6 overflow-auto h-full max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing information.</p>
      </div>

      {/* Current plan card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {currentPlan && (
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', currentPlan.iconBg)}>
                <currentPlan.icon className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{currentPlan?.name ?? 'Free'} Plan</span>
                <Badge variant="secondary" className="capitalize text-xs">{user?.plan ?? 'free'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{currentPlan?.credits}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading} className="gap-2">
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Manage Billing
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Credit usage bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Credits used this period</span>
            <span className="font-semibold text-foreground">
              {creditsUsed} / {creditsTotal === 9999 ? '∞' : creditsTotal}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usagePct > 80 ? 'bg-red-500' : usagePct > 50 ? 'bg-yellow-500' : 'bg-violet-500'
              )}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{usagePct.toFixed(0)}% used</p>
        </div>
      </div>

      {/* Plan selector */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Available Plans</h2>
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition-all', !isYearly ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn('flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all', isYearly ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              Yearly
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === (user?.plan ?? 'free')
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-5 transition-all',
                  isCurrent
                    ? 'border-violet-500/50 bg-violet-500/5'
                    : plan.popular
                    ? 'border-violet-500/30 bg-card hover:border-violet-500/50'
                    : 'border-border bg-card hover:border-violet-500/20'
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-bold text-white">
                    Current Plan
                  </div>
                )}
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-3 py-0.5 text-[10px] font-bold text-white">
                    Most Popular
                  </div>
                )}

                <div className={cn('mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg', plan.iconBg)}>
                  <plan.icon className="h-4 w-4 text-white" />
                </div>
                <div className="font-bold text-foreground">{plan.name}</div>
                <div className="text-xs text-muted-foreground mb-3">{plan.desc}</div>

                <div className="mb-4">
                  {plan.monthly === null ? (
                    <span className="text-2xl font-black text-foreground">Custom</span>
                  ) : plan.monthly === 0 ? (
                    <span className="text-2xl font-black text-foreground">Free</span>
                  ) : (
                    <span className="text-2xl font-black text-foreground">
                      ${isYearly ? plan.yearly : plan.monthly}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </span>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">{plan.credits}</div>
                </div>

                <ul className="flex-1 space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-violet-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    'w-full text-sm',
                    plan.popular && !isCurrent
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500'
                      : ''
                  )}
                  variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'outline'}
                  disabled={isCurrent || plan.id === 'free' || loadingPlan === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                  ) : isCurrent ? 'Current Plan' : plan.cta}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
