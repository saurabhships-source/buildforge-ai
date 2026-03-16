// Template-Driven SaaS Architecture System — core types

export type SaaSProductType = 'saas' | 'ai_tool' | 'marketplace' | 'crm' | 'dashboard' | 'agency' | 'ecommerce' | 'course' | 'booking' | 'tool'
export type DatabaseType = 'postgresql' | 'sqlite' | 'supabase' | 'mongodb'
export type AuthProvider = 'clerk' | 'supabase' | 'nextauth' | 'none'
export type StylingFramework = 'tailwind' | 'shadcn' | 'chakra' | 'mantine'
export type OrmType = 'prisma' | 'drizzle' | 'none'

export interface StackConfig {
  frontend: 'nextjs' | 'react' | 'html'
  backend: 'nextjs-api' | 'fastapi' | 'express' | 'none'
  database: DatabaseType
  orm: OrmType
  auth: AuthProvider
  styling: StylingFramework
  deployment: 'vercel' | 'netlify' | 'railway'
}

export interface DatabaseTable {
  name: string
  columns: { name: string; type: string; required?: boolean; unique?: boolean; relation?: string }[]
  indexes?: string[]
}

export interface ApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  auth: boolean
  roles?: string[]
}

export interface PageSpec {
  name: string
  path: string
  auth: boolean
  roles?: string[]
  components: string[]
  description: string
}

export interface ComponentSpec {
  name: string
  type: 'layout' | 'page' | 'feature' | 'ui' | 'form' | 'chart' | 'table'
  props?: string[]
  description: string
}

export interface ServiceSpec {
  name: string
  description: string
  methods: string[]
}

export interface ModuleSpec {
  id: string
  name: string
  description: string
  tables: DatabaseTable[]
  routes: ApiRoute[]
  pages: PageSpec[]
  components: ComponentSpec[]
  services: ServiceSpec[]
  dependencies: string[]  // other module ids this depends on
}

export interface SaaSArchitectureSpec {
  project: {
    name: string
    description: string
    type: SaaSProductType
    domain: string
  }
  stack: StackConfig
  modules: string[]           // ordered list of module ids
  roles: string[]             // e.g. ['admin', 'user', 'moderator']
  permissions: Record<string, string[]>  // role → allowed actions
  database: {
    tables: DatabaseTable[]
  }
  api: {
    routes: ApiRoute[]
    baseUrl: string
  }
  frontend: {
    pages: PageSpec[]
    components: ComponentSpec[]
    designSystem: {
      primaryColor: string
      style: string
      fonts: string[]
    }
  }
  services: ServiceSpec[]
  integrations: string[]
  featureFlags: Record<string, boolean>
  testing: {
    unit: boolean
    integration: boolean
    e2e: boolean
    framework: 'vitest' | 'jest' | 'playwright'
  }
  buildGraph: {
    pipeline: 'fast' | 'full' | 'saas'
    parallelNodes: string[][]  // groups of node ids that run in parallel
  }
}

// ── Template types ────────────────────────────────────────────────────────────

export interface SaaSTemplate {
  id: string
  name: string
  description: string
  icon: string
  tags: string[]
  productTypes: SaaSProductType[]
  modules: string[]
  stack: Partial<StackConfig>
  architecture: Partial<SaaSArchitectureSpec>
  previewUrl?: string
  complexity: 'starter' | 'standard' | 'advanced'
  estimatedFiles: number
}

// ── Intent extraction ─────────────────────────────────────────────────────────

export interface ExtractedIntent {
  productType: SaaSProductType
  domain: string
  features: string[]
  roles: string[]
  integrations: string[]
  hasAuth: boolean
  hasPayments: boolean
  hasDatabase: boolean
  hasAI: boolean
  complexity: 'simple' | 'medium' | 'complex'
}

export interface TemplateMatch {
  templateId: string
  confidence: number  // 0-1
  reasoning: string
  suggestedModules: string[]
}
