// Opportunity Detector — converts system report into actionable improvement opportunities

import type { SystemReport, SystemIssue } from './system-monitor'

export type OpportunityPriority = 'low' | 'medium' | 'high'
export type OpportunityCategory =
  | 'ui-redesign' | 'performance' | 'refactoring' | 'new-feature' | 'bug-fix' | 'security'

export interface Opportunity {
  id: string
  title: string
  description: string
  category: OpportunityCategory
  priority: OpportunityPriority
  estimatedImpact: string
  affectedFiles: string[]
  effort: 'small' | 'medium' | 'large'
}

export interface OpportunityReport {
  detectedAt: string
  opportunities: Opportunity[]
  totalCount: number
  highPriorityCount: number
}

// Static opportunities that are always valuable for the platform
const STATIC_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-preview-perf',
    title: 'Preview Runtime Optimization',
    description: 'Add debounced refresh and incremental DOM patching to reduce preview flicker on file changes.',
    category: 'performance',
    priority: 'high',
    estimatedImpact: '40% faster preview updates',
    affectedFiles: ['components/builder/preview-panel.tsx'],
    effort: 'small',
  },
  {
    id: 'opp-gallery-skeleton',
    title: 'Gallery Skeleton Loading States',
    description: 'Replace blank loading states in the gallery with skeleton cards for better perceived performance.',
    category: 'ui-redesign',
    priority: 'medium',
    estimatedImpact: 'Improved user experience during data fetch',
    affectedFiles: ['app/apps/page.tsx'],
    effort: 'small',
  },
  {
    id: 'opp-cache-embeddings',
    title: 'Improve Semantic Cache Accuracy',
    description: 'Upgrade TF-IDF embedder to use bigrams and IDF weighting for better semantic similarity matching.',
    category: 'performance',
    priority: 'high',
    estimatedImpact: '15% higher cache hit rate',
    affectedFiles: ['lib/cache/semantic-embedder.ts'],
    effort: 'medium',
  },
  {
    id: 'opp-builder-split',
    title: 'Refactor Builder Page into Sub-components',
    description: 'Split the 1000+ line builder page into focused sub-components to improve maintainability.',
    category: 'refactoring',
    priority: 'medium',
    estimatedImpact: 'Faster builds, easier testing',
    affectedFiles: ['app/dashboard/builder/page.tsx'],
    effort: 'large',
  },
  {
    id: 'opp-error-boundary',
    title: 'Add React Error Boundaries to Builder',
    description: 'Wrap builder panels in error boundaries to prevent full-page crashes from panel errors.',
    category: 'bug-fix',
    priority: 'high',
    estimatedImpact: 'Prevents cascading UI failures',
    affectedFiles: ['app/dashboard/builder/page.tsx', 'components/builder/preview-panel.tsx'],
    effort: 'small',
  },
  {
    id: 'opp-api-rate-limit',
    title: 'Add Rate Limiting to Generate API',
    description: 'Implement per-user rate limiting on /api/generate to prevent abuse and reduce costs.',
    category: 'security',
    priority: 'high',
    estimatedImpact: 'Reduced API abuse, lower costs',
    affectedFiles: ['app/api/generate/route.ts', 'app/api/generate/stream/route.ts'],
    effort: 'small',
  },
  {
    id: 'opp-prompt-suggestions',
    title: 'AI Prompt Autocomplete',
    description: 'Add AI-powered prompt suggestions in the builder based on prompt history and trending apps.',
    category: 'new-feature',
    priority: 'medium',
    estimatedImpact: 'Higher user engagement and generation quality',
    affectedFiles: ['components/builder/prompt-panel.tsx', 'lib/prompt-history.ts'],
    effort: 'medium',
  },
  {
    id: 'opp-mobile-builder',
    title: 'Mobile-Responsive Builder Layout',
    description: 'Add a mobile-optimized single-panel view for the builder on small screens.',
    category: 'ui-redesign',
    priority: 'low',
    estimatedImpact: 'Accessible on mobile devices',
    affectedFiles: ['app/dashboard/builder/page.tsx'],
    effort: 'medium',
  },
]

function issueToOpportunity(issue: SystemIssue, index: number): Opportunity {
  const id = `opp-issue-${index}`
  if (issue.type === 'large-file') {
    return {
      id,
      title: `Refactor ${issue.file?.split('/').pop() ?? 'large file'}`,
      description: issue.description,
      category: 'refactoring',
      priority: issue.severity,
      estimatedImpact: 'Improved maintainability and build speed',
      affectedFiles: issue.file ? [issue.file] : [],
      effort: 'large',
    }
  }
  if (issue.type === 'performance' || issue.type === 'api-error') {
    return {
      id,
      title: `Fix ${issue.file ?? 'performance issue'}`,
      description: issue.description,
      category: issue.type === 'api-error' ? 'bug-fix' : 'performance',
      priority: issue.severity,
      estimatedImpact: 'Faster response times',
      affectedFiles: issue.file ? [issue.file] : [],
      effort: 'small',
    }
  }
  return {
    id,
    title: `Address: ${issue.description.slice(0, 60)}`,
    description: issue.description,
    category: 'refactoring',
    priority: issue.severity,
    estimatedImpact: 'Cleaner codebase',
    affectedFiles: issue.file ? [issue.file] : [],
    effort: 'small',
  }
}

export function detectOpportunities(systemReport: SystemReport): OpportunityReport {
  // Convert high/medium severity issues into opportunities
  const issueOpportunities = systemReport.issues
    .filter(i => i.severity !== 'low')
    .map((issue, idx) => issueToOpportunity(issue, idx))

  // Merge with static opportunities, deduplicating by affected file
  const existingFiles = new Set(issueOpportunities.flatMap(o => o.affectedFiles))
  const filteredStatic = STATIC_OPPORTUNITIES.filter(
    o => !o.affectedFiles.some(f => existingFiles.has(f))
  )

  const all = [...issueOpportunities, ...filteredStatic]
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 }
      return p[a.priority] - p[b.priority]
    })

  return {
    detectedAt: new Date().toISOString(),
    opportunities: all,
    totalCount: all.length,
    highPriorityCount: all.filter(o => o.priority === 'high').length,
  }
}
