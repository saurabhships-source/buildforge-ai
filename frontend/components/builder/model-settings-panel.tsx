'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Cpu, Cloud, Download, CheckCircle2, XCircle, Loader2,
  RefreshCw, ChevronDown, ChevronRight, Zap, Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { ModelInfo, ModelUsageMetric } from '@/lib/ai-engine/free-stack/types'

interface RuntimeStatus {
  ollama: boolean; lmstudio: boolean; gemini: boolean; groq: boolean; openrouter: boolean
}
interface StatusData {
  runtimes: RuntimeStatus
  installedModels: { ollama: string[]; lmstudio: string[] }
  catalog: ModelInfo[]
  metrics: ModelUsageMetric[]
}

interface InstallProgress { status: string; completed?: number; total?: number }

const PROVIDER_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  ollama: { label: 'Ollama (Local)', color: 'text-green-600', icon: '🖥️' },
  lmstudio: { label: 'LM Studio (Local)', color: 'text-blue-600', icon: '🔬' },
  gemini: { label: 'Google Gemini', color: 'text-yellow-600', icon: '✨' },
  groq: { label: 'Groq (Fast)', color: 'text-purple-600', icon: '⚡' },
  openrouter: { label: 'OpenRouter', color: 'text-orange-600', icon: '🔀' },
}

export function ModelSettingsPanel({ localAIMode, onLocalAIModeChange }: {
  localAIMode: boolean
  onLocalAIModeChange: (v: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState<string | null>(null)
  const [installProgress, setInstallProgress] = useState<InstallProgress | null>(null)
  const [apiKeys, setApiKeys] = useState({ groq: '', openrouter: '' })
  const [expandedProvider, setExpandedProvider] = useState<string | null>('ollama')

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/models/status')
      const data = await res.json() as StatusData
      setStatus(data)
    } catch { toast.error('Failed to load model status') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (open) fetchStatus() }, [open, fetchStatus])

  const handleInstall = useCallback(async (modelId: string) => {
    setInstalling(modelId)
    setInstallProgress({ status: 'Starting download...' })
    try {
      const res = await fetch('/api/models/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      })
      if (!res.ok) {
        const err = await res.json() as { error: string }
        throw new Error(err.error)
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6)) as InstallProgress & { error?: string; model?: string }
            if (data.error) throw new Error(data.error)
            if (data.model) { toast.success(`Installed ${data.model}`); fetchStatus() }
            else setInstallProgress(data)
          } catch (e) { if (e instanceof Error && e.message !== 'Unexpected end') throw e }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Install failed')
    } finally {
      setInstalling(null)
      setInstallProgress(null)
    }
  }, [fetchStatus])

  const getSuccessRate = (modelId: string) => {
    const m = status?.metrics.find(x => x.modelId === modelId)
    if (!m) return null
    const total = m.successCount + m.errorCount
    return total === 0 ? null : Math.round((m.successCount / total) * 100)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border/30"
      >
        <Settings2 className="h-3.5 w-3.5" />
        <span>Model Settings</span>
        <ChevronRight className="h-3 w-3 ml-auto" />
      </button>
    )
  }

  return (
    <div className="border-t border-border/30 bg-card/20">
      <button
        onClick={() => setOpen(false)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
      >
        <Settings2 className="h-3.5 w-3.5 text-primary" />
        <span>Model Settings</span>
        <ChevronDown className="h-3 w-3 ml-auto" />
      </button>

      <div className="px-3 pb-3 space-y-3 max-h-96 overflow-y-auto">
        {/* Local AI Mode toggle */}
        <div className="flex items-center justify-between py-1.5 border-b border-border/20">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium">Local AI Only</span>
          </div>
          <Switch
            checked={localAIMode}
            onCheckedChange={onLocalAIModeChange}
            className="h-4 w-7 data-[state=checked]:bg-green-500"
          />
        </div>

        {/* Runtime status */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Runtimes</span>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {status && (
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(status.runtimes).map(([key, available]) => {
              const info = PROVIDER_LABELS[key]
              return (
                <div key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border ${available ? 'border-green-500/20 bg-green-500/5' : 'border-border/30 bg-muted/20'}`}>
                  {available
                    ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    : <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />}
                  <span className={available ? 'text-foreground' : 'text-muted-foreground'}>{info?.icon} {key}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Provider sections */}
        {status && Object.entries(PROVIDER_LABELS).map(([provider, info]) => {
          const providerModels = status.catalog.filter(m => m.provider === provider)
          if (providerModels.length === 0) return null
          const isExpanded = expandedProvider === provider
          const isAvailable = status.runtimes[provider as keyof RuntimeStatus]

          return (
            <div key={provider} className="border border-border/30 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedProvider(isExpanded ? null : provider)}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[10px] hover:bg-muted/30 transition-colors"
              >
                <span>{info.icon}</span>
                <span className={`font-medium ${info.color}`}>{info.label}</span>
                {isAvailable
                  ? <Badge className="ml-auto text-[9px] h-4 bg-green-500/10 text-green-600 border-green-500/20">Online</Badge>
                  : <Badge variant="outline" className="ml-auto text-[9px] h-4 text-muted-foreground">Offline</Badge>}
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border/20 divide-y divide-border/10">
                  {providerModels.map(model => {
                    const isInstalled = provider === 'ollama'
                      ? status.installedModels.ollama.some(n => n.startsWith(model.id))
                      : provider === 'lmstudio'
                      ? status.installedModels.lmstudio.some(n => n.includes(model.id))
                      : true // cloud models are always "available"
                    const successRate = getSuccessRate(model.id)
                    const isInstalling = installing === model.id

                    return (
                      <div key={model.id} className="flex items-center gap-2 px-2.5 py-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium truncate">{model.name}</span>
                            {successRate !== null && (
                              <span className={`text-[9px] ${successRate >= 80 ? 'text-green-500' : successRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {successRate}%
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {model.bestFor.slice(0, 2).map(t => (
                              <span key={t} className="text-[9px] text-muted-foreground bg-muted/50 px-1 rounded">{t}</span>
                            ))}
                          </div>
                        </div>
                        {model.isLocal ? (
                          isInstalled ? (
                            <Badge className="text-[9px] h-4 bg-green-500/10 text-green-600 border-green-500/20 shrink-0">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Ready
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-5 text-[9px] px-1.5 shrink-0"
                              onClick={() => handleInstall(model.id)}
                              disabled={isInstalling || !isAvailable}
                            >
                              {isInstalling ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Download className="h-2.5 w-2.5 mr-0.5" />}
                              {isInstalling ? 'Installing' : 'Install'}
                            </Button>
                          )
                        ) : (
                          <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                            <Cloud className="h-2.5 w-2.5 mr-0.5" />Free
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Install progress */}
        {installProgress && (
          <div className="p-2 rounded bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 text-[10px]">
              <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
              <span className="truncate">{installProgress.status}</span>
            </div>
            {installProgress.total && installProgress.completed && (
              <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.round((installProgress.completed / installProgress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* API Keys */}
        <div className="space-y-2 pt-1 border-t border-border/20">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Zap className="h-3 w-3" />API Keys (optional)
          </span>
          <div className="space-y-1.5">
            <div>
              <Label className="text-[10px] text-muted-foreground">Groq API Key</Label>
              <Input
                type="password"
                placeholder="gsk_..."
                value={apiKeys.groq}
                onChange={e => setApiKeys(p => ({ ...p, groq: e.target.value }))}
                className="h-6 text-[10px] mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">OpenRouter API Key</Label>
              <Input
                type="password"
                placeholder="sk-or-..."
                value={apiKeys.openrouter}
                onChange={e => setApiKeys(p => ({ ...p, openrouter: e.target.value }))}
                className="h-6 text-[10px] mt-0.5"
              />
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground">Keys are stored locally and sent only to the respective API.</p>
        </div>
      </div>
    </div>
  )
}
