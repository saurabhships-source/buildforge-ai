// AI Project Hub — core types
// A ProjectRepo is the full record of an AI-built application including
// its files, build timeline, agent history, versions, and deployments.

import type { BuildRun } from '@/lib/build-graph/types'
import type { SaaSArchitectureSpec } from '@/lib/templates/types'

export type RepoVisibility = 'private' | 'public' | 'template'
export type DeployProvider = 'vercel' | 'netlify' | 'github'
export type FrameworkType = 'html' | 'react' | 'nextjs' | 'vue' | 'svelte' | 'other'
export type TemplateCategory = 'saas' | 'ai_tool' | 'dashboard' | 'marketplace' | 'landing' | 'ecommerce' | 'tool' | 'other'

export interface PromptHistory {
  id: string
  prompt: string
  agent: string
  timestamp: string
  versionId: string
  filesChanged: number
}

export interface Deployment {
  id: string
  provider: DeployProvider
  url: string
  status: 'pending' | 'live' | 'failed'
  deployedAt: string
  versionId: string
}

export interface RepoVersion {
  id: string
  versionNum: number
  prompt: string
  agent: string
  snapshotId: string
  files: Record<string, string>
  createdAt: string
  buildRunId?: string
}

export interface ProjectRepo {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  appType: string
  framework: FrameworkType
  visibility: RepoVisibility
  templateCategory?: TemplateCategory
  isTemplate: boolean
  // Current file state
  files: Record<string, string>
  // Agent metadata
  agents: string[]
  // Build history
  buildRuns: BuildRun[]
  // Version snapshots
  versions: RepoVersion[]
  // Prompt history
  prompts: PromptHistory[]
  // Deployments
  deployments: Deployment[]
  // Stats
  forkCount: number
  starCount: number
  healthScore: number
  // Gallery stats
  viewCount: number
  likeCount: number
  remixCount: number
  // Gallery metadata
  tags: string[]
  previewHtml?: string
  shareSlug?: string
  // Fork provenance
  forkedFromId?: string
  forkedFromName?: string
  // Template provenance
  templateId?: string
  templateModules?: string[]
  architectureSpec?: SaaSArchitectureSpec
  // Timestamps
  createdAt: string
  updatedAt: string
  lastBuildAt?: string
}

export interface HubTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  prompt: string
  agents: string[]
  previewUrl?: string
  icon: string
  tags: string[]
  useCount: number
}

export interface CommunityProject {
  id: string
  name: string
  description: string
  appType: string
  agents: string[]
  healthScore: number
  forkCount: number
  starCount: number
  viewCount: number
  likeCount: number
  remixCount: number
  lastBuildAt: string
  ownerName: string
  isTemplate: boolean
  templateCategory?: TemplateCategory
  icon: string
  tags: string[]
  shareSlug?: string
  framework?: string
  visibility?: string
}
