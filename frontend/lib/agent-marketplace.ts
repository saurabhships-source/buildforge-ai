// Agent Marketplace — plugin interface and registry for installable AI agents
// Developers can publish agents that extend the build graph.

export interface AgentPlugin {
  id: string
  name: string
  description: string
  author: string
  version: string
  capabilities: AgentCapability[]
  category: AgentCategory
  isPremium: boolean
  price?: number          // credits per run
  rating: number          // 0-5
  installs: number
  tags: string[]
  icon: string            // emoji
  run: (context: AgentPluginContext) => Promise<AgentPluginResult>
}

export type AgentCapability =
  | 'code_generation'
  | 'ui_design'
  | 'database_schema'
  | 'api_generation'
  | 'testing'
  | 'seo'
  | 'security_audit'
  | 'performance'
  | 'analytics'
  | 'deployment'
  | 'documentation'
  | 'accessibility'

export type AgentCategory =
  | 'generation'
  | 'design'
  | 'backend'
  | 'testing'
  | 'optimization'
  | 'deployment'
  | 'analytics'

export interface AgentPluginContext {
  prompt: string
  files: Record<string, string>
  modelId: string
  plan?: Record<string, unknown>
  emitEvent: (agent: string, action: string, status?: 'info' | 'success' | 'error' | 'running') => void
}

export interface AgentPluginResult {
  files: Record<string, string>
  description: string
  metadata?: Record<string, unknown>
}

// ── Built-in marketplace agents ───────────────────────────────────────────────

const BUILTIN_AGENTS: Omit<AgentPlugin, 'run'>[] = [
  {
    id: 'ui-generator',
    name: 'UI Generator Pro',
    description: 'Generates stunning UI components with glassmorphism, animations, and micro-interactions',
    author: 'BuildForge',
    version: '1.0.0',
    capabilities: ['ui_design', 'code_generation'],
    category: 'design',
    isPremium: false,
    rating: 4.8,
    installs: 12400,
    tags: ['ui', 'design', 'components', 'tailwind'],
    icon: '🎨',
  },
  {
    id: 'database-agent',
    name: 'Database Architect',
    description: 'Generates Prisma schemas, migrations, and CRUD operations from natural language',
    author: 'BuildForge',
    version: '1.2.0',
    capabilities: ['database_schema', 'api_generation'],
    category: 'backend',
    isPremium: false,
    rating: 4.7,
    installs: 8900,
    tags: ['database', 'prisma', 'postgresql', 'crud'],
    icon: '🗄️',
  },
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    description: 'Adds complete SEO: meta tags, Open Graph, JSON-LD schema, sitemap, robots.txt',
    author: 'BuildForge',
    version: '1.1.0',
    capabilities: ['seo'],
    category: 'optimization',
    isPremium: false,
    rating: 4.6,
    installs: 7200,
    tags: ['seo', 'meta', 'opengraph', 'schema'],
    icon: '🔍',
  },
  {
    id: 'testing-agent',
    name: 'Test Suite Generator',
    description: 'Generates unit tests, integration tests, and E2E test scenarios',
    author: 'BuildForge',
    version: '1.0.0',
    capabilities: ['testing'],
    category: 'testing',
    isPremium: false,
    rating: 4.5,
    installs: 5600,
    tags: ['testing', 'jest', 'vitest', 'playwright'],
    icon: '🧪',
  },
  {
    id: 'analytics-agent',
    name: 'Analytics Integrator',
    description: 'Adds analytics tracking, event logging, and dashboard widgets',
    author: 'Community',
    version: '0.9.0',
    capabilities: ['analytics', 'code_generation'],
    category: 'analytics',
    isPremium: false,
    rating: 4.3,
    installs: 3100,
    tags: ['analytics', 'tracking', 'events', 'dashboard'],
    icon: '📊',
  },
  {
    id: 'accessibility-agent',
    name: 'Accessibility Auditor',
    description: 'Audits and fixes WCAG 2.1 AA compliance issues across all generated files',
    author: 'BuildForge',
    version: '1.0.0',
    capabilities: ['accessibility', 'code_generation'],
    category: 'optimization',
    isPremium: false,
    rating: 4.7,
    installs: 4800,
    tags: ['a11y', 'wcag', 'accessibility', 'aria'],
    icon: '♿',
  },
  {
    id: 'deploy-agent-pro',
    name: 'Deploy Agent Pro',
    description: 'One-click deployment to Vercel, Netlify, Railway with CI/CD pipeline setup',
    author: 'BuildForge',
    version: '2.0.0',
    capabilities: ['deployment'],
    category: 'deployment',
    isPremium: true,
    price: 2,
    rating: 4.9,
    installs: 9800,
    tags: ['deploy', 'vercel', 'netlify', 'cicd'],
    icon: '🚀',
  },
  {
    id: 'docs-generator',
    name: 'Documentation Generator',
    description: 'Auto-generates README, API docs, component storybook, and inline JSDoc comments',
    author: 'Community',
    version: '1.0.0',
    capabilities: ['documentation'],
    category: 'generation',
    isPremium: false,
    rating: 4.4,
    installs: 2900,
    tags: ['docs', 'readme', 'jsdoc', 'storybook'],
    icon: '📚',
  },
]

const INSTALLED_KEY = 'buildforge_installed_agents'

function loadInstalled(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(INSTALLED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveInstalled(ids: string[]): void {
  try { localStorage.setItem(INSTALLED_KEY, JSON.stringify(ids)) } catch { /* quota */ }
}

export const agentMarketplace = {
  getAll(): Omit<AgentPlugin, 'run'>[] {
    return BUILTIN_AGENTS
  },

  getInstalled(): Omit<AgentPlugin, 'run'>[] {
    const installed = loadInstalled()
    return BUILTIN_AGENTS.filter(a => installed.includes(a.id))
  },

  isInstalled(id: string): boolean {
    return loadInstalled().includes(id)
  },

  install(id: string): void {
    const installed = loadInstalled()
    if (!installed.includes(id)) {
      installed.push(id)
      saveInstalled(installed)
    }
  },

  uninstall(id: string): void {
    saveInstalled(loadInstalled().filter(i => i !== id))
  },

  search(query: string): Omit<AgentPlugin, 'run'>[] {
    const q = query.toLowerCase()
    return BUILTIN_AGENTS.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some(t => t.includes(q))
    )
  },

  getByCategory(category: AgentCategory): Omit<AgentPlugin, 'run'>[] {
    return BUILTIN_AGENTS.filter(a => a.category === category)
  },
}
