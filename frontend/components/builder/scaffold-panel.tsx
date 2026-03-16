'use client'

import { useState } from 'react'
import { Database, Shield, Server, Palette, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProjectPlan } from '@/lib/ai-engine/agents/planner-agent'
import type { ScaffoldType } from '@/app/api/scaffold/route'

interface Props {
  plan: ProjectPlan | null
  isGenerating: boolean
  onScaffold: (type: ScaffoldType) => void
}

const SCAFFOLD_ITEMS: {
  type: ScaffoldType
  label: string
  icon: React.ElementType
  color: string
  description: string
  requiresPlan?: boolean
}[] = [
  {
    type: 'database',
    label: 'Database',
    icon: Database,
    color: 'text-indigo-500',
    description: 'Generate Prisma schema + DB types',
    requiresPlan: true,
  },
  {
    type: 'auth',
    label: 'Auth',
    icon: Shield,
    color: 'text-green-500',
    description: 'Add Clerk authentication',
    requiresPlan: true,
  },
  {
    type: 'api',
    label: 'API Routes',
    icon: Server,
    color: 'text-blue-500',
    description: 'Generate CRUD API routes',
    requiresPlan: true,
  },
  {
    type: 'design-system',
    label: 'Design System',
    icon: Palette,
    color: 'text-pink-500',
    description: 'Generate CSS tokens + components',
  },
]

export function ScaffoldPanel({ plan, isGenerating, onScaffold }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!plan && !expanded) return null

  return (
    <div className="border-t border-border/50 bg-card/20">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="uppercase tracking-wider">Scaffold</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-2 pb-2 space-y-1">
          {SCAFFOLD_ITEMS.map(item => {
            const Icon = item.icon
            const disabled = isGenerating || (item.requiresPlan && !plan)
            return (
              <button
                key={item.type}
                onClick={() => onScaffold(item.type)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-2 w-full px-2.5 py-2 rounded-lg border border-border/50 bg-card text-left transition-all',
                  disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted hover:border-primary/30'
                )}
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                ) : (
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', item.color)} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{item.description}</div>
                </div>
                <Badge variant="outline" className="text-[9px] h-4 shrink-0">1 cr</Badge>
              </button>
            )
          })}
          {!plan && (
            <p className="text-[10px] text-muted-foreground px-1 pt-1">
              Generate a project first to enable database, auth, and API scaffolding.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
