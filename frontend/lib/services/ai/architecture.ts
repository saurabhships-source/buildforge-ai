// Stage 3 — Architecture Designer
// Converts a project plan into a technical architecture spec

import type { ProjectPlan } from './planner'
import type { AnalyzedIntent } from './intent'

export type StateStrategy = 'react-hooks' | 'zustand' | 'redux' | 'jotai'
export type ApiStrategy = 'next-api-routes' | 'supabase-direct' | 'external-api'
export type DatabaseStrategy = 'supabase' | 'prisma' | 'none' | 'localStorage'
export type StyleStrategy = 'tailwind' | 'tailwind+shadcn' | 'css-modules'

export interface ArchitectureSpec {
  directories: string[]
  stateManagement: StateStrategy
  apiStrategy: ApiStrategy
  database: DatabaseStrategy
  styling: StyleStrategy
  authProvider: 'supabase' | 'clerk' | 'none'
  deployment: 'vercel' | 'netlify' | 'static'
  coreFiles: string[]
  patterns: string[]
}

/** Design architecture from a project plan + optional intent */
export function designArchitecture(
  plan: ProjectPlan,
  intent?: AnalyzedIntent,
): ArchitectureSpec {
  const hasAuth = intent?.hasAuth ?? plan.features.some(f => /auth|login|user/.test(f))
  const hasPayments = intent?.hasPayments ?? plan.features.some(f => /payment|stripe|billing/.test(f))
  const hasDatabase = intent?.hasDatabase ?? (hasAuth || hasPayments)
  const isComplex = (intent?.complexity === 'advanced') || plan.pages.length > 4

  // Directory structure
  const directories = ['app', 'components', 'lib', 'styles']
  if (hasAuth) directories.push('app/(auth)')
  if (plan.pages.length > 2) directories.push('app/(dashboard)')
  if (hasDatabase) directories.push('lib/db')
  if (plan.features.some(f => /api|endpoint/.test(f))) directories.push('app/api')

  // State management
  const stateManagement: StateStrategy = isComplex ? 'zustand' : 'react-hooks'

  // API strategy
  const apiStrategy: ApiStrategy = hasDatabase ? 'next-api-routes' : 'supabase-direct'

  // Database
  const database: DatabaseStrategy =
    !hasDatabase ? 'none' :
    hasPayments ? 'prisma' :
    'supabase'

  // Styling
  const styling: StyleStrategy = isComplex ? 'tailwind+shadcn' : 'tailwind'

  // Auth provider
  const authProvider = hasAuth ? 'supabase' : 'none'

  // Core files always generated
  const coreFiles = ['index.html', 'styles.css', 'script.js']
  if (hasAuth) coreFiles.push('lib/auth.ts')
  if (hasDatabase) coreFiles.push('lib/db.ts')
  if (hasPayments) coreFiles.push('lib/stripe.ts')

  // Patterns
  const patterns: string[] = ['component-based', 'responsive-first']
  if (hasAuth) patterns.push('protected-routes')
  if (hasDatabase) patterns.push('server-side-data')
  if (isComplex) patterns.push('code-splitting', 'lazy-loading')

  return {
    directories,
    stateManagement,
    apiStrategy,
    database,
    styling,
    authProvider,
    deployment: 'vercel',
    coreFiles,
    patterns,
  }
}
