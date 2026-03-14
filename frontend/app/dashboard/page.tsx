'use client'

import { CreditCard, Zap, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'

const recentActivity = [
  { id: 1, action: 'Generated AI content', time: '2 minutes ago', credits: 5 },
  { id: 2, action: 'Created automation workflow', time: '1 hour ago', credits: 10 },
  { id: 3, action: 'Generated product description', time: '3 hours ago', credits: 3 },
  { id: 4, action: 'Built custom chatbot', time: 'Yesterday', credits: 15 },
]

export default function DashboardPage() {
  const { user } = useAuth()

  const planLimits = {
    starter: 100,
    pro: 500,
    enterprise: 9999,
  }

  const maxCredits = planLimits[user?.plan || 'starter']
  const creditsUsed = maxCredits - (user?.credits || 0)
  const usagePercentage = (creditsUsed / maxCredits) * 100

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here&apos;s your AI usage overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user?.plan}</div>
            <p className="text-xs text-muted-foreground">
              {user?.plan === 'enterprise' ? 'Unlimited features' : 'Upgrade for more'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.credits}</div>
            <p className="text-xs text-muted-foreground">
              of {maxCredits === 9999 ? 'unlimited' : maxCredits} credits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsUsed}</div>
            <p className="text-xs text-muted-foreground">
              credits used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Generations Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              AI outputs created
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Your credit usage this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Credits used</span>
                <span className="font-medium">{usagePercentage.toFixed(0)}%</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{creditsUsed} used</span>
              <span>{user?.credits} remaining</span>
            </div>
            {user?.plan !== 'enterprise' && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/dashboard/billing">
                  Upgrade Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest AI generations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    -{activity.credits} credits
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with AI tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/dashboard/builder">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="font-medium">AI Builder</div>
                  <div className="text-xs text-muted-foreground">Generate AI content and tools</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/dashboard/usage">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="font-medium">View Usage</div>
                  <div className="text-xs text-muted-foreground">Track your AI consumption</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href="/dashboard/billing">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="font-medium">Manage Billing</div>
                  <div className="text-xs text-muted-foreground">Upgrade or manage plan</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
