// Central credit cost config — single source of truth for all AI actions

export const PLAN_CREDITS: Record<string, number> = {
  free: 50,
  pro: 500,
  team: 2000,
  enterprise: 9999,
}

export const CREDIT_COSTS = {
  generateProject: 10,
  improveCode: 2,
  deployProject: 5,
  designUI: 3,
  startupGenerator: 15,
  autonomousPipeline: 20,
  repairCode: 2,
  githubExport: 3,
  growthEngine: 8,
} as const

export type CreditAction = keyof typeof CREDIT_COSTS

export const PLAN_FEATURES: Record<string, {
  maxProjects: number | null
  marketplace: boolean
  githubExport: boolean
  teamCollaboration: boolean
  analytics: boolean
  sso: boolean
  startupGenerator: boolean
}> = {
  free: {
    maxProjects: 2,
    marketplace: false,
    githubExport: false,
    teamCollaboration: false,
    analytics: false,
    sso: false,
    startupGenerator: false,
  },
  pro: {
    maxProjects: null,
    marketplace: true,
    githubExport: true,
    teamCollaboration: false,
    analytics: false,
    sso: false,
    startupGenerator: true,
  },
  team: {
    maxProjects: null,
    marketplace: true,
    githubExport: true,
    teamCollaboration: true,
    analytics: true,
    sso: true,
    startupGenerator: true,
  },
  enterprise: {
    maxProjects: null,
    marketplace: true,
    githubExport: true,
    teamCollaboration: true,
    analytics: true,
    sso: true,
    startupGenerator: true,
  },
}

export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action]
}

export function getPlanCredits(plan: string): number {
  return PLAN_CREDITS[plan] ?? PLAN_CREDITS.free
}

export function canUseFeature(plan: string, feature: keyof typeof PLAN_FEATURES.free): boolean {
  return PLAN_FEATURES[plan]?.[feature] ?? PLAN_FEATURES.free[feature]
}
