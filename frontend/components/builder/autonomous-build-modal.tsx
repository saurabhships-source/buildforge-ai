'use client'

import { useState } from 'react'
import { X, Zap, CheckCircle2, Circle, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export interface AutonomousStep {
  id: string
  label: string
  description: string
  status: 'pending' | 'active' | 'done' | 'error'
}

const DEFAULT_STEPS: AutonomousStep[] = [
  { id: 'analyze', label: 'Analyzing idea', description: 'Understanding requirements and scope', status: 'pending' },
  { id: 'spec', label: 'Designing architecture', description: 'Creating product specification', status: 'pending' },
  { id: 'database', label: 'Generating database', description: 'Schema and data models', status: 'pending' },
  { id: 'backend', label: 'Generating backend', description: 'API routes and server logic', status: 'pending' },
  { id: 'frontend', label: 'Generating frontend', description: 'UI components and pages', status: 'pending' },
  { id: 'deploy', label: 'Preparing deployment', description: 'Config and environment setup', status: 'pending' },
]

interface Props {
  open: boolean
  isRunning: boolean
  steps?: AutonomousStep[]
  onStart: (idea: string) => void
  onClose: () => void
}

export function AutonomousBuildModal({ open, isRunning, steps, onStart, onClose }: Props) {
  const [idea, setIdea] = useState('')

  if (!open) return null

  const displaySteps = steps ?? DEFAULT_STEPS
  const activeStep = displaySteps.find(s => s.status === 'active')
  const doneCount = displaySteps.filter(s => s.status === 'done').length
  const progress = Math.round((doneCount / displaySteps.length) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gradient-to-r from-violet-500/10 to-indigo-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/20">
              <Zap className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Autonomous Build</h2>
              <p className="text-[10px] text-muted-foreground">AI builds your entire app automatically</p>
            </div>
          </div>
          {!isRunning && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Idea input — only show before running */}
          {!isRunning && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Describe your app idea</label>
              <Textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder={'e.g. "A SaaS tool for managing social media posts with scheduling, analytics, and team collaboration"'}
                className="min-h-[100px] text-sm resize-none"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">
                Be specific — include features, target users, and tech preferences for best results.
              </p>
            </div>
          )}

          {/* Progress steps */}
          {isRunning && (
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{activeStep?.label ?? 'Starting...'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Step list */}
              <div className="space-y-1.5">
                {displaySteps.map((step, i) => (
                  <div key={step.id} className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${step.status === 'active' ? 'bg-violet-500/10 border border-violet-500/20' : step.status === 'done' ? 'opacity-60' : 'opacity-40'}`}>
                    <div className="mt-0.5 shrink-0">
                      {step.status === 'done' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : step.status === 'active' ? (
                        <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
                      ) : step.status === 'error' ? (
                        <Circle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.description}</p>
                    </div>
                    {step.status === 'done' && (
                      <span className="text-[9px] text-green-500 shrink-0">Done</span>
                    )}
                    {i < displaySteps.length - 1 && step.status !== 'active' && step.status !== 'done' && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                Each stage is saved as a version — you can edit at any point.
              </p>
            </div>
          )}

          {/* Credit notice */}
          {!isRunning && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <p className="text-[10px] text-amber-300">Uses 20 credits — generates a complete application end-to-end.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isRunning && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/50 bg-muted/20">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
              onClick={() => { if (idea.trim()) onStart(idea.trim()) }}
              disabled={!idea.trim()}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Start Autonomous Build
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
