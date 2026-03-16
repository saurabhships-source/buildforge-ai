'use client'

import { Zap, TrendingUp, Rocket, Cpu, Sparkles, GitBranch, ArrowUpRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const CREDIT_COSTS = [
  { action: 'Generate project', cost: 10, icon: Cpu, color: 'text-violet-500' },
  { action: 'Improve code', cost: 2, icon: Zap, color: 'text-indigo-500' },
  { action: 'Deploy project', cost: 5, icon: Rocket, color: 'text-emerald-500' },
  { action: 'Design UI', cost: 3, icon: TrendingUp, color: 'text-cyan-500' },
  { action: 'Startup generator', cost: 15, icon: Sparkles, color: 'text-pink-500' },
  { action: 'Growth engine', cost: 8, icon: TrendingUp, color: 'text-orange-500' },
  { action: 'GitHub export', cost: 3, icon: GitBranch, color: 'text-slate-500' },
  { action: 'Autonomous pipeline', cost: 20, icon: Cpu, color: 'text-yellow-500' },
]

export default function UsagePage() {
  const { user } = useAuth()

  const creditsTotal = user?.creditsTotal ?? 50
  const creditsRemaining = user?.creditsRemaining ?? 0
  const creditsUsed = creditsTotal - creditsRemaining
  const usagePct = creditsTotal > 0 ? Math.min((creditsUsed / creditsTotal) * 100, 100) : 0
  const isUnlimited = creditsTotal === 9999

  const stats = [
    { label: 'Credits Remaining', value: isUnlimited ? '∞' : creditsRemaining, sub: 'available now', color: 'text-violet-600 dark:text-violet-400' },
    { label: 'Credits Used', value: creditsUsed, sub: 'this billing cycle', color: 'text-foreground' },
    { label: 'Total Credits', value: isUnlimited ? 'Unlimited' : creditsTotal, sub: 'per billing cycle', color: 'text-foreground' },
  ]

  return (
    <div className="space-y-8 p-6 overflow-auto h-full max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
        <p className="text-muted-foreground">Monitor your AI credit consumption and generation activity.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn('mt-1 text-3xl font-black', s.color)}>{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Usage bar */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Credit Usage</h2>
          <span className="text-sm text-muted-foreground">{usagePct.toFixed(0)}% used</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              usagePct > 80 ? 'bg-red-500' : usagePct > 50 ? 'bg-yellow-500' : 'bg-gradient-to-r from-violet-500 to-indigo-500'
            )}
            style={{ width: `${usagePct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{creditsUsed} credits used</span>
          <span>{isUnlimited ? '∞' : creditsRemaining} remaining</span>
        </div>
        {usagePct > 80 && !isUnlimited && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
            <p className="text-sm text-orange-700 dark:text-orange-300">Running low on credits.</p>
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-1 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline"
            >
              Upgrade plan <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
        {creditsRemaining < 1 && !isUnlimited && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">You have no credits remaining.</p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">Upgrade your plan to continue building.</p>
            <Link
              href="/dashboard/billing"
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
            >
              Upgrade Plan <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Credit costs reference */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground mb-4">Credit Costs</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CREDIT_COSTS.map((item) => (
            <div key={item.action} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <item.icon className={cn('h-4 w-4', item.color)} />
                <span className="text-sm text-foreground">{item.action}</span>
              </div>
              <span className="text-sm font-bold text-foreground">{item.cost} credits</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Credits reset monthly at the start of your billing cycle.</p>
      </div>
    </div>
  )
}
