'use client'

import { useRouter } from 'next/navigation'
import { Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  message?: string
}

export function UpgradeModal({ open, onClose, message }: UpgradeModalProps) {
  const router = useRouter()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
            <Zap className="h-6 w-6 text-violet-500" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground">You've used all your credits</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {message ?? 'Upgrade your plan to continue building with BuildForge AI.'}
            </p>
          </div>

          <div className="w-full space-y-2 pt-2">
            <button
              onClick={() => { router.push('/dashboard/billing?plan=pro'); onClose() }}
              className={cn(
                'w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3',
                'text-sm font-semibold text-white hover:opacity-90 transition-opacity'
              )}
            >
              Upgrade to Pro — $19/mo
              <span className="ml-2 text-xs opacity-80">500 credits/month</span>
            </button>

            <button
              onClick={() => { router.push('/dashboard/billing?plan=team'); onClose() }}
              className={cn(
                'w-full rounded-xl border border-border bg-muted/40 px-4 py-3',
                'text-sm font-semibold text-foreground hover:bg-muted transition-colors'
              )}
            >
              Upgrade to Team — $49/mo
              <span className="ml-2 text-xs text-muted-foreground">2000 credits/month</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Credits reset every month. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
