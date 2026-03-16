'use client'

import { useState, useEffect } from 'react'
import { Store, Search, Star, Download, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { agentMarketplace } from '@/lib/agent-marketplace'
import type { AgentCategory } from '@/lib/agent-marketplace'

const CATEGORIES: { id: AgentCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'generation', label: 'Generation' },
  { id: 'design', label: 'Design' },
  { id: 'backend', label: 'Backend' },
  { id: 'testing', label: 'Testing' },
  { id: 'optimization', label: 'Optimize' },
  { id: 'deployment', label: 'Deploy' },
]

export function MarketplacePanel() {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<AgentCategory | 'all'>('all')
  const [installed, setInstalled] = useState<Set<string>>(new Set())
  const [installing, setInstalling] = useState<string | null>(null)

  useEffect(() => {
    const inst = agentMarketplace.getInstalled()
    setInstalled(new Set(inst.map(a => a.id)))
  }, [expanded])

  const agents = (() => {
    let list = agentMarketplace.getAll()
    if (query) list = list.filter(a =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase()) ||
      a.tags.some(t => t.includes(query.toLowerCase()))
    )
    if (category !== 'all') list = list.filter(a => a.category === category)
    return list
  })()

  const handleInstall = async (id: string) => {
    setInstalling(id)
    await new Promise(r => setTimeout(r, 600)) // simulate install
    agentMarketplace.install(id)
    setInstalled(prev => new Set([...prev, id]))
    setInstalling(null)
  }

  const handleUninstall = (id: string) => {
    agentMarketplace.uninstall(id)
    setInstalled(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  return (
    <div className="border-t border-border/50 bg-card/20">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5" />
          <span className="uppercase tracking-wider">Agent Marketplace</span>
          {installed.size > 0 && (
            <Badge variant="outline" className="text-[9px] h-4 ml-1">{installed.size} installed</Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-2 pb-3 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search agents..."
              className="h-7 pl-6 text-[11px] bg-background"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all',
                  category === cat.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border/50 text-muted-foreground hover:border-primary/30'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Agent list */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
            {agents.map(agent => {
              const isInst = installed.has(agent.id)
              const isInstalling = installing === agent.id
              return (
                <div
                  key={agent.id}
                  className="flex items-start gap-2 p-2 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                >
                  <span className="text-base shrink-0 mt-0.5">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold">{agent.name}</span>
                      {agent.isPremium && (
                        <Badge variant="outline" className="text-[9px] h-3.5 text-amber-500 border-amber-500/30">PRO</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{agent.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5 text-[9px] text-amber-500">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        {agent.rating}
                      </div>
                      <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                        <Download className="h-2.5 w-2.5" />
                        {agent.installs.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-muted-foreground">v{agent.version}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isInst ? 'outline' : 'default'}
                    className={cn('h-6 text-[10px] px-2 shrink-0', isInst && 'text-green-600 border-green-500/30')}
                    onClick={() => isInst ? handleUninstall(agent.id) : handleInstall(agent.id)}
                    disabled={isInstalling}
                  >
                    {isInstalling ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isInst ? (
                      <><Check className="h-3 w-3 mr-0.5" />Installed</>
                    ) : (
                      <><Download className="h-3 w-3 mr-0.5" />Install</>
                    )}
                  </Button>
                </div>
              )
            })}
            {agents.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-3">No agents found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
