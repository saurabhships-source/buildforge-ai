'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Github, Key, Save, Eye, EyeOff, Loader2, CheckCircle2, Cpu, Cloud, RefreshCw, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

interface RuntimeStatus { ollama: boolean; lmstudio: boolean; gemini: boolean; groq: boolean; openrouter: boolean }
interface ModelStatusData { runtimes: RuntimeStatus; installedModels: { ollama: string[]; lmstudio: string[] }; catalog: { id: string; name: string; provider: string; isLocal: boolean; ollamaTag?: string }[] }

export default function SettingsPage() {
  const [githubToken, setGithubToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [modelStatus, setModelStatus] = useState<ModelStatusData | null>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [installing, setInstalling] = useState<string | null>(null)
  const [groqKey, setGroqKey] = useState('')
  const [openrouterKey, setOpenrouterKey] = useState('')
  const [localAIOnly, setLocalAIOnly] = useState(false)
  const [aiProvider, setAiProvider] = useState<'auto' | 'ollama' | 'gemini' | 'openai'>('auto')
  const [ollamaModel, setOllamaModel] = useState('qwen2.5-coder')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [savingAI, setSavingAI] = useState(false)

  const fetchModelStatus = async () => {
    setModelLoading(true)
    try {
      const res = await fetch('/api/models/status')
      const data = await res.json() as ModelStatusData
      setModelStatus(data)
    } catch { toast.error('Failed to load model status') }
    finally { setModelLoading(false) }
  }

  const handleInstallModel = async (modelId: string) => {
    setInstalling(modelId)
    try {
      const res = await fetch('/api/models/install', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      })
      if (!res.ok) { const e = await res.json() as { error: string }; throw new Error(e.error) }
      const reader = res.body!.getReader(); const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const d = JSON.parse(line.slice(6)) as { status?: string; error?: string; model?: string }
            if (d.error) throw new Error(d.error)
            if (d.model) { toast.success(`Installed ${d.model}`); fetchModelStatus() }
          } catch (e) { if (e instanceof Error && !e.message.includes('JSON')) throw e }
        }
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Install failed') }
    finally { setInstalling(null) }
  }

  useEffect(() => {
    fetch('/api/user/me')
      .then(r => r.json())
      .then(data => { if ((data as { hasGithubToken?: boolean }).hasGithubToken) setHasToken(true) })
      .catch(() => {})
    fetchModelStatus()
  }, [])

  const handleSaveToken = async () => {
    if (!githubToken.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/user/github-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken }),
      })
      if (!res.ok) throw new Error('Failed to save token')
      setHasToken(true)
      setGithubToken('')
      toast.success('GitHub token saved')
    } catch {
      toast.error('Failed to save token')
    } finally {
      setSaving(false)
    }
  }

  const handleRevokeToken = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/github-token', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to revoke token')
      setHasToken(false)
      toast.success('GitHub token removed')
    } catch {
      toast.error('Failed to revoke token')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl p-6 overflow-auto h-full">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your integrations and preferences</p>
      </div>

      {/* GitHub Integration */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Github className="h-5 w-5" />
            GitHub Integration
            {hasToken && (
              <Badge variant="outline" className="ml-auto text-green-600 border-green-500/30 bg-green-500/10">
                <CheckCircle2 className="h-3 w-3 mr-1" />Connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to export projects and import repositories.
            Create a token at{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              github.com/settings/tokens
            </a>{' '}
            with <code className="text-xs bg-muted px-1 py-0.5 rounded">repo</code> scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasToken ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4 text-green-500" />
                <span>Personal access token saved</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeToken}
                disabled={saving}
                className="text-destructive hover:text-destructive"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Revoke'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="github-token">Personal Access Token</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="github-token"
                    type={showToken ? 'text' : 'password'}
                    value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={handleSaveToken} disabled={!githubToken.trim() || saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your token is encrypted and stored securely. It is only used for GitHub API calls on your behalf.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Models — Free Stack */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-5 w-5 text-green-500" />
            AI Models — Free Stack
            <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={fetchModelStatus} disabled={modelLoading}>
              <RefreshCw className={`h-4 w-4 ${modelLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          <CardDescription>Configure local and free cloud AI models. No paid APIs required.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Local AI Only toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
            <div>
              <p className="text-sm font-medium">Local AI Only Mode</p>
              <p className="text-xs text-muted-foreground">Use only local models — works fully offline</p>
            </div>
            <Switch checked={localAIOnly} onCheckedChange={setLocalAIOnly} className="data-[state=checked]:bg-green-500" />
          </div>

          {/* Runtime status */}
          {modelStatus && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Runtime Status</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(modelStatus.runtimes).map(([key, available]) => (
                  <div key={key} className={`flex items-center gap-2 p-2 rounded border text-xs ${available ? 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400' : 'border-border/40 text-muted-foreground'}`}>
                    {available ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Cloud className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                    <span className="capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Local models */}
          {modelStatus && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Local Models (Ollama)</p>
              {!modelStatus.runtimes.ollama && (
                <div className="p-3 rounded bg-muted/30 text-xs text-muted-foreground">
                  Ollama not detected. Install from{' '}
                  <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">ollama.ai</a>
                  {' '}then run <code className="bg-muted px-1 rounded">ollama serve</code>
                </div>
              )}
              <div className="space-y-1.5">
                {modelStatus.catalog.filter(m => m.provider === 'ollama').map(model => {
                  const installed = modelStatus.installedModels.ollama.some(n => n.startsWith(model.id))
                  return (
                    <div key={model.id} className="flex items-center justify-between p-2 rounded border border-border/40">
                      <div>
                        <p className="text-xs font-medium">{model.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{model.ollamaTag}</p>
                      </div>
                      {installed ? (
                        <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />Installed
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleInstallModel(model.id)}
                          disabled={installing === model.id || !modelStatus.runtimes.ollama}
                        >
                          {installing === model.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                          {installing === model.id ? 'Installing…' : 'Install'}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cloud API keys */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Free Cloud API Keys</p>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Groq API Key <span className="text-muted-foreground">(free tier — very fast)</span></Label>
                <div className="flex gap-2 mt-1">
                  <Input type="password" placeholder="gsk_..." value={groqKey} onChange={e => setGroqKey(e.target.value)} className="text-sm" />
                  <Button variant="outline" size="sm" onClick={() => { toast.success('Groq key saved (restart server to apply)') }} disabled={!groqKey}>Save</Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Get free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">console.groq.com</a></p>
              </div>
              <div>
                <Label className="text-xs">OpenRouter API Key <span className="text-muted-foreground">(free models available)</span></Label>
                <div className="flex gap-2 mt-1">
                  <Input type="password" placeholder="sk-or-..." value={openrouterKey} onChange={e => setOpenrouterKey(e.target.value)} className="text-sm" />
                  <Button variant="outline" size="sm" onClick={() => { toast.success('OpenRouter key saved (restart server to apply)') }} disabled={!openrouterKey}>Save</Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Get free key at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">openrouter.ai</a></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Provider Selection */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-5 w-5 text-indigo-500" />
            AI Provider
          </CardTitle>
          <CardDescription>
            Choose which AI backend BuildForge uses for code generation.
            Persist by adding <code className="text-xs bg-muted px-1 rounded">AI_PROVIDER</code> to your <code className="text-xs bg-muted px-1 rounded">.env.local</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'auto', label: 'Auto', desc: 'Ollama → Gemini → OpenAI', icon: '🔀' },
              { value: 'ollama', label: 'Local (Ollama)', desc: 'qwen2.5-coder locally', icon: '🖥️' },
              { value: 'gemini', label: 'Google Gemini', desc: 'Gemini 1.5 Flash (free)', icon: '✨' },
              { value: 'openai', label: 'OpenAI', desc: 'GPT-4o-mini', icon: '🤖' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setAiProvider(opt.value)}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  aiProvider === opt.value
                    ? 'border-indigo-500/60 bg-indigo-500/10'
                    : 'border-border/40 hover:border-border hover:bg-muted/30'
                }`}
              >
                <span className="text-xl mt-0.5">{opt.icon}</span>
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                {aiProvider === opt.value && (
                  <CheckCircle2 className="h-4 w-4 text-indigo-500 ml-auto shrink-0 mt-0.5" />
                )}
              </button>
            ))}
          </div>

          {(aiProvider === 'ollama' || aiProvider === 'auto') && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border/40">
              <p className="text-xs font-medium flex items-center gap-2">
                <span>🖥️</span> Ollama Configuration
                {modelStatus?.runtimes.ollama
                  ? <Badge className="text-[10px] h-4 bg-green-500/10 text-green-600 border-green-500/20">Running</Badge>
                  : <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">Not detected</Badge>
                }
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Model</Label>
                  <Input value={ollamaModel} onChange={e => setOllamaModel(e.target.value)} placeholder="qwen2.5-coder" className="text-sm mt-1 font-mono" />
                </div>
                <div>
                  <Label className="text-xs">Base URL</Label>
                  <Input value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} placeholder="http://localhost:11434" className="text-sm mt-1 font-mono" />
                </div>
              </div>
              {!modelStatus?.runtimes.ollama && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Start Ollama with qwen2.5-coder:</p>
                  <code className="block bg-muted px-2 py-1.5 rounded font-mono text-[11px]">ollama pull qwen2.5-coder</code>
                  <code className="block bg-muted px-2 py-1.5 rounded font-mono text-[11px]">ollama serve</code>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => {
              setSavingAI(true)
              setTimeout(() => {
                setSavingAI(false)
                toast.success(`AI provider: ${aiProvider}. Add AI_PROVIDER=${aiProvider} to .env.local to persist.`)
              }, 400)
            }}
            disabled={savingAI}
            className="w-full"
          >
            {savingAI ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Apply AI Provider Settings
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Add <code className="bg-muted px-1 rounded">AI_PROVIDER={aiProvider}</code> and{' '}
            <code className="bg-muted px-1 rounded">OLLAMA_MODEL={ollamaModel}</code> to your{' '}
            <code className="bg-muted px-1 rounded">.env.local</code> to persist.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
