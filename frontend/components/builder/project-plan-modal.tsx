'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Rocket, Database, Shield, Plug, FileCode, Layout, Server } from 'lucide-react'
import type { ProjectPlan } from '@/lib/ai-engine/agents/planner-agent'

interface Props {
  open: boolean
  plan: ProjectPlan | null
  isLoading: boolean
  onApprove: (plan: ProjectPlan) => void
  onRegenerate: () => void
  onClose: () => void
}

const COMPLEXITY_COLORS = {
  simple: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  complex: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export function ProjectPlanModal({ open, plan, isLoading, onApprove, onRegenerate, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Project Plan
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI is analyzing your idea...</p>
          </div>
        ) : plan ? (
          <div className="space-y-4 py-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg">{plan.projectName}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={COMPLEXITY_COLORS[plan.complexity]}>
                  {plan.complexity}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  ~{plan.estimatedFiles} files
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Pages */}
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Layout className="h-3.5 w-3.5" /> Pages
                </div>
                <div className="flex flex-wrap gap-1">
                  {plan.pages.map(p => (
                    <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                  ))}
                </div>
              </div>

              {/* Components */}
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <FileCode className="h-3.5 w-3.5" /> Components
                </div>
                <div className="flex flex-wrap gap-1">
                  {plan.components.map(c => (
                    <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                  ))}
                </div>
              </div>

              {/* APIs */}
              {plan.apis.length > 0 && (
                <div className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Server className="h-3.5 w-3.5" /> API Routes
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {plan.apis.map(a => (
                      <Badge key={a} variant="outline" className="text-[10px] font-mono">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Database */}
              {plan.database && (
                <div className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Database className="h-3.5 w-3.5" /> Database
                  </div>
                  <div className="space-y-1">
                    {Object.entries(plan.database.tables).map(([table, cols]) => (
                      <div key={table} className="text-[10px]">
                        <span className="font-mono text-primary">{table}</span>
                        <span className="text-muted-foreground ml-1">({cols.slice(0, 4).join(', ')}{cols.length > 4 ? '...' : ''})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auth */}
              {plan.authentication && (
                <div className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Shield className="h-3.5 w-3.5" /> Authentication
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">{plan.authentication.provider}</Badge>
                    {plan.authentication.methods.map(m => (
                      <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Integrations */}
              {plan.integrations.length > 0 && (
                <div className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Plug className="h-3.5 w-3.5" /> Integrations
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {plan.integrations.map(i => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Design System */}
            <div className="rounded-lg border border-border/50 p-3 flex items-center gap-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Design</div>
              <Badge variant="outline" className="text-[10px]">{plan.designSystem.style}</Badge>
              <div className="flex items-center gap-1.5">
                <div className={`h-3 w-3 rounded-full bg-${plan.designSystem.primaryColor}-500`} />
                <span className="text-[10px] text-muted-foreground">{plan.designSystem.primaryColor}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{plan.designSystem.fonts.join(', ')}</span>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="outline" onClick={onRegenerate} disabled={isLoading} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate Plan
          </Button>
          <Button onClick={() => plan && onApprove(plan)} disabled={isLoading || !plan} className="gap-1.5">
            <Rocket className="h-3.5 w-3.5" />
            Approve & Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
