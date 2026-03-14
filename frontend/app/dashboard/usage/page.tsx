'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'

const usageData = [
  { category: 'Content Generation', used: 45, total: 100 },
  { category: 'Tool Building', used: 23, total: 50 },
  { category: 'Automation Workflows', used: 12, total: 25 },
  { category: 'API Calls', used: 156, total: 500 },
]

const dailyUsage = [
  { day: 'Mon', credits: 12 },
  { day: 'Tue', credits: 8 },
  { day: 'Wed', credits: 15 },
  { day: 'Thu', credits: 22 },
  { day: 'Fri', credits: 18 },
  { day: 'Sat', credits: 5 },
  { day: 'Sun', credits: 10 },
]

export default function UsagePage() {
  const { user } = useAuth()

  const planLimits = {
    starter: 100,
    pro: 500,
    enterprise: 9999,
  }

  const maxCredits = planLimits[user?.plan || 'starter']
  const creditsUsed = maxCredits - (user?.credits || 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
        <p className="text-muted-foreground">
          Monitor your AI usage and credit consumption.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{maxCredits === 9999 ? 'Unlimited' : maxCredits}</div>
            <p className="text-xs text-muted-foreground">per billing cycle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{creditsUsed}</div>
            <p className="text-xs text-muted-foreground">this billing cycle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{user?.credits}</div>
            <p className="text-xs text-muted-foreground">available to use</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage by Category</CardTitle>
          <CardDescription>Breakdown of credit usage across different features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {usageData.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.category}</span>
                <span className="text-muted-foreground">
                  {item.used} / {item.total}
                </span>
              </div>
              <Progress value={(item.used / item.total) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Usage (Last 7 Days)</CardTitle>
          <CardDescription>Your credit consumption over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-[200px]">
            {dailyUsage.map((day) => {
              const maxDaily = Math.max(...dailyUsage.map(d => d.credits))
              const height = (day.credits / maxDaily) * 100
              
              return (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full flex flex-col items-center">
                    <span className="text-xs font-medium mb-1">{day.credits}</span>
                    <div
                      className="w-full max-w-[40px] rounded-t-md bg-primary transition-all"
                      style={{ height: `${height}px` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
