'use client'

import { useState, useEffect } from 'react'
import { Database, Zap, TrendingDown, RefreshCw, Trash2, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface CacheStats {
  totalEntries: number
  activeEntries: number
  totalHits: number
  redisEnabled: boolean
  memoryUsageKb: number
}

export default function CacheDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [invalidatePrompt, setInvalidatePrompt] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cache/stats')
      if (res.ok) setStats(await res.json())
    } catch { toast.error('Failed to load cache stats') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const handleInvalidate = async () => {
    if (!invalidatePrompt.trim()) return
    try {
      await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: invalidatePrompt }),
      })
      toast.success('Cache entry invalidated')
      setInvalidatePrompt('')
      fetchStats()
    } catch { toast.error('Invalidation failed') }
  }

  // Estimated cost savings: assume $0.02 per generation, cache hits save that
  const estimatedSavings = stats ? (stats.totalHits * 0.02).toFixed(2) : '0.00'
  const hitRate = stats && stats.totalEntries > 0
    ? Math.round((stats.totalHits / (stats.totalHits + stats.totalEntries)) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Cache Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Semantic prompt cache — reduce AI costs by 70–90%</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Cache Entries', value: stats?.activeEntries ?? 0, icon: <Database className="h-4 w-4" />, color: 'text-blue-600' },
          { label: 'Total Hits', value: stats?.totalHits ?? 0, icon: <Zap className="h-4 w-4" />, color: 'text-green-600' },
          { label: 'Hit Rate', value: `${hitRate}%`, icon: <TrendingDown className="h-4 w-4" />, color: 'text-violet-600' },
          { label: 'Est. Savings', value: `$${estimatedSavings}`, icon: <TrendingDown className="h-4 w-4" />, color: 'text-emerald-600' },
        ].map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <div className={`${stat.color} mb-2`}>{stat.icon}</div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Infrastructure status */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="h-4 w-4" /> Cache Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Level 1 — Exact Cache</p>
              <p className="text-xs text-muted-foreground">SHA-256 prompt hash → instant lookup</p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Level 2 — Semantic Cache</p>
              <p className="text-xs text-muted-foreground">TF-IDF embeddings, cosine similarity ≥ 82%</p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Redis Backend</p>
              <p className="text-xs text-muted-foreground">Set REDIS_URL env var to enable persistence</p>
            </div>
            <Badge variant="outline" className={stats?.redisEnabled ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}>
              {stats?.redisEnabled ? 'Connected' : 'Memory only'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Memory Usage</p>
              <p className="text-xs text-muted-foreground">In-process LRU cache (max 500 entries)</p>
            </div>
            <span className="text-sm font-medium">{stats?.memoryUsageKb ?? 0} KB</span>
          </div>
        </CardContent>
      </Card>

      {/* Cache architecture */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cache Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {[
              'User Prompt',
              'L1: Exact Hash',
              'L2: Semantic Match',
              'AI Generation',
              'Store in Cache',
              'Return Files',
            ].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded border text-xs ${
                  i < 3 ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                  i === 3 ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' :
                  'bg-green-500/10 border-green-500/20 text-green-600'
                }`}>{step}</span>
                {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Cache hits at L1 or L2 short-circuit the pipeline — no AI credits consumed.
            TTL: 7 days (templates), 30 days (common prompts).
          </p>
        </CardContent>
      </Card>

      {/* Invalidate */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Invalidate Cache Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Enter prompt to invalidate..."
            value={invalidatePrompt}
            onChange={e => setInvalidatePrompt(e.target.value)}
            className="flex-1"
          />
          <Button variant="destructive" size="sm" onClick={handleInvalidate} disabled={!invalidatePrompt.trim()}>
            Invalidate
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
