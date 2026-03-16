'use client'

import { Zap, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  cacheHit?: boolean
  cacheLevel?: 1 | 2
  cacheSimilarity?: number
}

export function CacheIndicator({ cacheHit, cacheLevel, cacheSimilarity }: Props) {
  if (!cacheHit) return null

  const isExact = cacheLevel === 1
  const pct = cacheSimilarity !== undefined ? Math.round(cacheSimilarity * 100) : 100

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 text-[10px] h-5 cursor-default ${
              isExact
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
            }`}
          >
            {isExact ? <Zap className="h-2.5 w-2.5" /> : <Database className="h-2.5 w-2.5" />}
            {isExact ? 'Cached' : `${pct}% match`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[200px]">
          {isExact
            ? 'Exact cache hit — result served instantly, no AI credits used'
            : `Semantic cache hit (${pct}% similarity) — similar prompt reused, no AI credits used`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
