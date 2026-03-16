'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Code2,
  FlaskConical, Loader2, Play, RefreshCw, Shield, Sparkles,
  ThumbsDown, ThumbsUp, XCircle, ChevronDown, ChevronUp, Zap, Wifi,
} from 'lucide-react'
import type { SystemHealthReport } from '@/lib/services/system/health-check'
import type { SystemReport } from '@/lib/services/self-improve/system-monitor'
import type { OpportunityReport, Opportunity } from '@/lib/services/self-improve/opportunity-detector'
import type { PatchProposal } from '@/lib/services/self-improve/patch-manager'

type CycleStage = 'idle' | 'scanning' | 'detecting' | 'planning' | 'generating' | 'sandboxing' | 'testing' | 'proposing' | 'done' | 'error'

interface CycleState {
  stage: CycleStage
  message: string
  opportunityTitle?: string
}

export default function SystemPage() {
  const [cycleState, setCycleState] = useState<CycleState>({ stage: 'idle', message: '' })
  const [systemReport, setSystemReport] = useState<SystemReport | null>(null)
  const [opportunityReport, setOpportunityReport] = useState<OpportunityReport | null>(null)
  const [proposals, setProposals] = useState<PatchProposal[]>([])
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [liveHealth, setLiveHealth] = useState<SystemHealthReport | null>(null)

  const loadProposals = useCallback(async () => {
    try {
      const res = await fetch('/api/system/patch')
      if (res.ok) setProposals(await res.json())
    } catch { /* non-critical */ }
  }, [])

  // Load live health on mount
  useEffect(() => {
    fetch('/api/system/health')
      .then(r => r.json())
      .then((d: { data?: SystemHealthReport }) => { if (d.data) setLiveHealth(d.data) })
      .catch(() => {})
  }, [])

  const handleScan = useCallback(async () => {
    setIsLoading(true)
    setCycleState({ stage: 'scanning', message: 'Scanning codebase...' })
    try {
      const res = await fetch('/api/system/scan')
      const report = await res.json() as SystemReport
      setSystemReport(report)
      setCycleState({ stage: 'detecting', message: 'Detecting opportunities...' })

      const oppRes = await fetch('/api/system/opportunities')
      const { opportunityReport: oppReport } = await oppRes.json() as { opportunityReport: OpportunityReport }
      setOpportunityReport(oppReport)
      setCycleState({ stage: 'done', message: 'Scan complete' })
      toast.success(`Health: ${report.healthScore}% — ${oppReport.totalCount} opportunities found`)
    } catch {
      setCycleState({ stage: 'error', message: 'Scan failed' })
      toast.error('Scan failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleRunCycle = useCallback(async () => {
    setIsLoading(true)
    setCycleState({ stage: 'scanning', message: 'Starting improvement cycle...' })
    try {
      // Step 1: Scan
      const scanRes = await fetch('/api/system/scan')
      const report = await scanRes.json() as SystemReport
      setSystemReport(report)
      setCycleState({ stage: 'detecting', message: 'Detecting opportunities...' })

      // Step 2: Opportunities
      const oppRes = await fetch('/api/system/opportunities')
      const { opportunityReport: oppReport } = await oppRes.json() as { opportunityReport: OpportunityReport }
      setOpportunityReport(oppReport)

      // Step 3: Generate patches for top 2 high-priority opportunities
      const topOpps = oppReport.opportunities.filter(o => o.priority === 'high').slice(0, 2)
      let created = 0

      for (const opp of topOpps) {
        setCycleState({ stage: 'generating', message: `Generating patch...`, opportunityTitle: opp.title })
        try {
          const patchRes = await fetch('/api/system/patch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opportunity: opp }),
          })
          if (patchRes.ok) created++
        } catch { /* continue */ }
      }

      await loadProposals()
      setCycleState({ stage: 'done', message: `Cycle complete — ${created} proposals created` })
      toast.success(`Self-upgrade cycle complete — ${created} proposals ready for review`)
    } catch {
      setCycleState({ stage: 'error', message: 'Cycle failed' })
      toast.error('Improvement cycle failed')
    } finally {
      setIsLoading(false)
    }
  }, [loadProposals])

  const handleApprove = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/system/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      })
      if (!res.ok) throw new Error('Approve failed')
      await loadProposals()
      toast.success('Patch approved')
    } catch { toast.error('Approve failed') }
  }, [loadProposals])

  const handleReject = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/system/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', reason: 'Rejected by admin' }),
      })
      if (!res.ok) throw new Error('Reject failed')
      await loadProposals()
      toast.success('Patch rejected')
    } catch { toast.error('Reject failed') }
  }, [loadProposals])

  const healthScore = systemReport?.healthScore ?? null
  const healthColor = healthScore === null ? 'text-muted-foreground' : healthScore >= 80 ? 'text-green-400' : healthScore >= 60 ? 'text-yellow-400' : 'text-red-400'
  const healthBg = healthScore === null ? 'bg-muted/20' : healthScore >= 80 ? 'bg-green-500/10' : healthScore >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            BuildForge v2 — Self-Upgrade
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-powered system improvement with sandbox testing and human approval
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleScan}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            {isLoading && cycleState.stage === 'scanning' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Scan System
          </button>
          <button
            onClick={handleRunCycle}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Self-Upgrade
          </button>
        </div>
      </div>

      {/* Cycle progress */}
      {cycleState.stage !== 'idle' && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
          <span className="text-muted-foreground">{cycleState.message}</span>
          {cycleState.opportunityTitle && (
            <span className="text-primary font-medium truncate">{cycleState.opportunityTitle}</span>
          )}
        </div>
      )}

      {/* Health + metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`p-4 rounded-xl border border-border ${healthBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Health Score</span>
          </div>
          <div className={`text-3xl font-bold ${healthColor}`}>
            {healthScore !== null ? `${healthScore}%` : '—'}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Issues Found</span>
          </div>
          <div className="text-3xl font-bold">{systemReport?.issues.length ?? '—'}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Opportunities</span>
          </div>
          <div className="text-3xl font-bold">{opportunityReport?.totalCount ?? '—'}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Pending Patches</span>
          </div>
          <div className="text-3xl font-bold">{proposals.filter(p => p.status === 'pending').length}</div>
        </div>
        <div className={`p-4 rounded-xl border border-border ${liveHealth?.status === 'healthy' ? 'bg-green-500/5' : liveHealth?.status === 'degraded' ? 'bg-yellow-500/5' : 'bg-card'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">API Health</span>
          </div>
          <div className={`text-3xl font-bold ${liveHealth?.status === 'healthy' ? 'text-green-400' : liveHealth?.status === 'degraded' ? 'text-yellow-400' : 'text-muted-foreground'}`}>
            {liveHealth ? `${liveHealth.score}%` : '—'}
          </div>
          {liveHealth && <p className="text-xs text-muted-foreground mt-0.5">{liveHealth.avgApiLatencyMs}ms avg</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Issues */}
        {systemReport && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Detected Issues
            </h2>
            {systemReport.issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues detected</p>
            ) : (
              <div className="space-y-2">
                {systemReport.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full ${issue.severity === 'high' ? 'bg-red-400' : issue.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                    <span className="text-muted-foreground">{issue.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Opportunities */}
        {opportunityReport && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Suggested Improvements
            </h2>
            <div className="space-y-2">
              {opportunityReport.opportunities.slice(0, 6).map(opp => (
                <OpportunityRow key={opp.id} opportunity={opp} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Patch proposals */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            Patch Proposals
          </h2>
          <button onClick={loadProposals} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No proposals yet — run Self-Upgrade to generate patches</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map(proposal => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                expanded={expandedProposal === proposal.id}
                onToggle={() => setExpandedProposal(v => v === proposal.id ? null : proposal.id)}
                onApprove={() => handleApprove(proposal.id)}
                onReject={() => handleReject(proposal.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Safety notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <Shield className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-amber-400">Safety Rules Active</span> — Auth, payments, database schema, and security middleware are protected and cannot be auto-modified. All patches run through sandbox testing before human approval.
        </div>
      </div>
    </div>
  )
}

function OpportunityRow({ opportunity }: { opportunity: Opportunity }) {
  const priorityColor = opportunity.priority === 'high' ? 'text-red-400' : opportunity.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
  const icon = opportunity.category === 'performance' ? '⚡' : opportunity.category === 'ui-redesign' ? '🎨' : opportunity.category === 'refactoring' ? '🔧' : opportunity.category === 'new-feature' ? '✨' : opportunity.category === 'security' ? '🔐' : '🐛'

  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-foreground font-medium">{opportunity.title}</span>
        <span className="text-muted-foreground ml-1">— {opportunity.estimatedImpact}</span>
      </div>
      <span className={`shrink-0 font-medium ${priorityColor}`}>{opportunity.priority}</span>
    </div>
  )
}

function ProposalCard({
  proposal, expanded, onToggle, onApprove, onReject,
}: {
  proposal: PatchProposal
  expanded: boolean
  onToggle: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const statusIcon = {
    pending: <Clock className="h-3.5 w-3.5 text-yellow-400" />,
    approved: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
    rejected: <XCircle className="h-3.5 w-3.5 text-red-400" />,
    applied: <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />,
    failed: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  }[proposal.status]

  const testScore = proposal.testReport?.score
  const testPassed = proposal.testReport?.success

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{proposal.title}</p>
          <p className="text-xs text-muted-foreground">{proposal.filesChanged.length} files · {new Date(proposal.createdAt).toLocaleDateString()}</p>
        </div>
        {testScore !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${testPassed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            Tests {testScore}%
          </span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
          proposal.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
          proposal.status === 'approved' ? 'bg-green-500/10 text-green-400' :
          proposal.status === 'applied' ? 'bg-blue-500/10 text-blue-400' :
          'bg-red-500/10 text-red-400'
        }`}>{proposal.status}</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border p-3 space-y-3 bg-muted/10">
          <p className="text-xs text-muted-foreground">{proposal.description}</p>

          <div>
            <p className="text-xs font-medium mb-1">Files changed:</p>
            <div className="flex flex-wrap gap-1">
              {proposal.filesChanged.map(f => (
                <span key={f} className="text-[10px] px-1.5 py-0.5 bg-muted/40 rounded font-mono text-muted-foreground">{f.split('/').pop()}</span>
              ))}
            </div>
          </div>

          {proposal.testReport && (
            <div>
              <p className="text-xs font-medium mb-1">Test results:</p>
              <div className="space-y-0.5">
                {proposal.testReport.tests.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    {t.passed ? <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" /> : <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
                    <span className="text-muted-foreground">{t.name}</span>
                    {t.error && <span className="text-red-400">— {t.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {proposal.status === 'pending' && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={onApprove}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg border border-green-500/20 transition-colors font-medium"
              >
                <ThumbsUp className="h-3 w-3" /> Approve Patch
              </button>
              <button
                onClick={onReject}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
              >
                <ThumbsDown className="h-3 w-3" /> Reject
              </button>
            </div>
          )}

          {proposal.status === 'rejected' && proposal.rejectedReason && (
            <p className="text-xs text-red-400">Rejected: {proposal.rejectedReason}</p>
          )}
        </div>
      )}
    </div>
  )
}
