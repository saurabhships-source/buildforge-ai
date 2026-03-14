'use client'

import { useState } from 'react'
import { Check, CreditCard, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for getting started',
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      '100 AI generations',
      'Basic AI tools',
      'Email support',
      'API access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best for growing teams',
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      '500 AI generations',
      'Advanced AI tools',
      'Priority support',
      'API access',
      'Custom templates',
      'Team collaboration',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
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
    ],
  },
]

const paymentHistory = [
  { id: 1, date: '2024-01-15', amount: 49, status: 'paid', plan: 'Pro' },
  { id: 2, date: '2023-12-15', amount: 49, status: 'paid', plan: 'Pro' },
  { id: 3, date: '2023-11-15', amount: 19, status: 'paid', plan: 'Starter' },
]

export default function BillingPage() {
  const { user } = useAuth()
  const [isYearly, setIsYearly] = useState(false)

  const handleUpgrade = (planId: string) => {
    // In production, this would integrate with Stripe
    alert(`Upgrading to ${planId} plan. In production, this would redirect to Stripe Checkout.`)
  }

  const handleManageBilling = () => {
    // In production, this would redirect to Stripe Customer Portal
    alert('Opening billing portal. In production, this would redirect to Stripe Customer Portal.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are currently on the {user?.plan} plan</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm capitalize">
              {user?.plan}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                ${plans.find(p => p.id === user?.plan)?.monthlyPrice || 0}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-sm text-muted-foreground">Next billing date: February 15, 2024</p>
            </div>
            <Button variant="outline" onClick={handleManageBilling}>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Available Plans</h2>
          <div className="flex items-center gap-3">
            <Label htmlFor="billing-toggle" className={cn("text-sm", !isYearly && "font-medium")}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={cn("text-sm", isYearly && "font-medium")}>
              Yearly
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                Save 20%
              </span>
            </Label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative",
                plan.id === user?.plan && "border-primary",
                plan.popular && plan.id !== user?.plan && "border-primary/50"
              )}
            >
              {plan.popular && plan.id !== user?.plan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.id === user?.plan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              <CardHeader className="pt-6">
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.id === user?.plan ? 'outline' : 'default'}
                  disabled={plan.id === user?.plan}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {plan.id === user?.plan ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View your past payments and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentHistory.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{payment.plan} Plan</p>
                  <p className="text-sm text-muted-foreground">{payment.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${payment.amount}</p>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
