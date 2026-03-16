// Feature Planner — converts an opportunity into a concrete implementation plan

import type { Opportunity } from './opportunity-detector'

export interface FileChange {
  path: string
  action: 'create' | 'modify' | 'delete'
  description: string
}

export interface FeaturePlan {
  id: string
  featureName: string
  description: string
  opportunity: Opportunity
  filesToCreate: FileChange[]
  filesToModify: FileChange[]
  testStrategy: string
  rollbackStrategy: string
  estimatedLinesChanged: number
  safetyLevel: 'safe' | 'review-required' | 'blocked'
  blockedReason?: string
}

// Files that must never be auto-modified (safety rules)
const PROTECTED_FILES = [
  'middleware.ts',
  'lib/stripe.ts',
  'lib/db.ts',
  'prisma/schema.prisma',
  'app/api/billing',
  'app/(auth)',
  'lib/auth',
]

function isSafeToModify(files: string[]): { safe: boolean; reason?: string } {
  for (const file of files) {
    for (const protected_ of PROTECTED_FILES) {
      if (file.includes(protected_)) {
        return { safe: false, reason: `${file} is a protected file (auth/payments/db)` }
      }
    }
  }
  return { safe: true }
}

function buildPlanForOpportunity(opportunity: Opportunity): FeaturePlan {
  const safetyCheck = isSafeToModify(opportunity.affectedFiles)

  const base: FeaturePlan = {
    id: `plan-${opportunity.id}`,
    featureName: opportunity.title,
    description: opportunity.description,
    opportunity,
    filesToCreate: [],
    filesToModify: [],
    testStrategy: 'TypeScript compile check + visual inspection of affected UI',
    rollbackStrategy: 'Restore previous version snapshot via version-control service',
    estimatedLinesChanged: 0,
    safetyLevel: safetyCheck.safe ? 'safe' : 'blocked',
    blockedReason: safetyCheck.reason,
  }

  if (!safetyCheck.safe) return base

  // Build specific plans per opportunity category
  switch (opportunity.id) {
    case 'opp-preview-perf':
      return {
        ...base,
        filesToModify: [
          { path: 'components/builder/preview-panel.tsx', action: 'modify', description: 'Add 300ms debounce to iframe refresh, use srcDoc instead of full reload' },
        ],
        estimatedLinesChanged: 25,
        testStrategy: 'Visual test: change a file and verify preview updates without full reload',
      }

    case 'opp-gallery-skeleton':
      return {
        ...base,
        filesToCreate: [
          { path: 'components/gallery-skeleton.tsx', action: 'create', description: 'Skeleton card component matching gallery card dimensions' },
        ],
        filesToModify: [
          { path: 'app/apps/page.tsx', action: 'modify', description: 'Replace loading spinner with skeleton grid' },
        ],
        estimatedLinesChanged: 45,
      }

    case 'opp-error-boundary':
      return {
        ...base,
        filesToCreate: [
          { path: 'components/builder/panel-error-boundary.tsx', action: 'create', description: 'React error boundary with fallback UI for builder panels' },
        ],
        filesToModify: [
          { path: 'app/dashboard/builder/page.tsx', action: 'modify', description: 'Wrap each panel in PanelErrorBoundary' },
        ],
        estimatedLinesChanged: 60,
        testStrategy: 'Throw test error in panel, verify boundary catches it without crashing page',
      }

    case 'opp-api-rate-limit':
      return {
        ...base,
        filesToCreate: [
          { path: 'lib/rate-limiter.ts', action: 'create', description: 'In-memory sliding window rate limiter (60 req/min per user)' },
        ],
        filesToModify: [
          { path: 'app/api/generate/route.ts', action: 'modify', description: 'Apply rate limiter middleware' },
          { path: 'app/api/generate/stream/route.ts', action: 'modify', description: 'Apply rate limiter middleware' },
        ],
        estimatedLinesChanged: 40,
        safetyLevel: 'review-required',
        testStrategy: 'Send 70 requests in 60s, verify 429 after limit',
      }

    case 'opp-cache-embeddings':
      return {
        ...base,
        filesToModify: [
          { path: 'lib/cache/semantic-embedder.ts', action: 'modify', description: 'Add bigram tokenization and IDF weighting to TF-IDF embedder' },
        ],
        estimatedLinesChanged: 35,
        testStrategy: 'Run similarity tests on known prompt pairs, verify score improvement',
      }

    default:
      return {
        ...base,
        filesToModify: opportunity.affectedFiles.map(f => ({
          path: f,
          action: 'modify' as const,
          description: `Apply improvements for: ${opportunity.description}`,
        })),
        estimatedLinesChanged: opportunity.effort === 'small' ? 30 : opportunity.effort === 'medium' ? 80 : 200,
        safetyLevel: opportunity.effort === 'large' ? 'review-required' : 'safe',
      }
  }
}

export function planFeature(opportunity: Opportunity): FeaturePlan {
  return buildPlanForOpportunity(opportunity)
}

export function planMultiple(opportunities: Opportunity[]): FeaturePlan[] {
  return opportunities.map(planFeature)
}
