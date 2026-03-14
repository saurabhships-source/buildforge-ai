'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles, Zap, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Starter',
    icon: Sparkles,
    description: 'Perfect for getting started',
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      '100 AI generations/month',
      'Basic AI tools',
      'Email support',
      'API access',
      'Community access',
    ],
    popular: false,
    gradient: 'from-slate-500 to-slate-600',
    cta: 'Start Free Trial',
  },
  {
    name: 'Pro',
    icon: Zap,
    description: 'Best for growing teams',
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      '500 AI generations/month',
      'Advanced AI tools',
      'Priority support',
      'Full API access',
      'Custom templates',
      'Team collaboration',
      'Analytics dashboard',
    ],
    popular: true,
    gradient: 'from-primary to-accent',
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    icon: Building2,
    description: 'For large organizations',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      'Unlimited generations',
      'Custom AI workflows',
      'Dedicated support',
      'Full API access',
      'Custom integrations',
      'SSO & security',
      'SLA guarantee',
      'Custom training',
    ],
    popular: false,
    gradient: 'from-violet-500 to-purple-600',
    cta: 'Contact Sales',
  },
]

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="relative px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-muted/50 to-transparent" />
      
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent">
            Simple Pricing
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Choose your plan
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Start free, upgrade when you need. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Label 
              htmlFor="billing" 
              className={cn(
                "text-sm transition-colors cursor-pointer", 
                !isYearly ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              Monthly
            </Label>
            <Switch
              id="billing"
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <Label 
              htmlFor="billing" 
              className={cn(
                "flex items-center gap-2 text-sm transition-colors cursor-pointer", 
                isYearly ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              Yearly
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Save 20%
              </span>
            </Label>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-12 grid max-w-lg gap-6 lg:max-w-none lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300",
                plan.popular 
                  ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]" 
                  : "border-border/50 hover:border-border hover:shadow-lg"
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-primary to-accent px-12 py-1 text-xs font-semibold text-white shadow-sm">
                  Most Popular
                </div>
              )}
              
              {/* Header */}
              <div className="p-6 pb-0 lg:p-8 lg:pb-0">
                <div className={cn(
                  "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                  plan.gradient
                )}>
                  <plan.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                
                {/* Price */}
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight lg:text-5xl">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">
                    /{isYearly ? 'year' : 'month'}
                  </span>
                </div>
                {isYearly && (
                  <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    Save ${(plan.monthlyPrice * 12) - plan.yearlyPrice} per year
                  </p>
                )}
              </div>
              
              {/* Features */}
              <div className="flex flex-1 flex-col p-6 lg:p-8">
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        plan.popular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA */}
                <Button
                  className={cn(
                    "mt-8 w-full",
                    plan.popular && "shadow-lg shadow-primary/25"
                  )}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  asChild
                >
                  <Link href="/signup">{plan.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust message */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  )
}
