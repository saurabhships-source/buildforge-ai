// Template Registry — curated SaaS templates with architecture specs
// Each template defines modules, stack, and a partial architecture spec

import type { SaaSTemplate } from './types'

// ── Template definitions ──────────────────────────────────────────────────────

const SAAS_STARTER: SaaSTemplate = {
  id: 'saas-starter',
  name: 'SaaS Starter',
  description: 'Full-stack SaaS with auth, billing, dashboard, and user management',
  icon: '🚀',
  tags: ['saas', 'subscription', 'billing', 'stripe', 'auth', 'dashboard', 'users', 'nextjs'],
  productTypes: ['saas'],
  modules: ['auth', 'users', 'billing', 'dashboard', 'notifications'],
  complexity: 'standard',
  estimatedFiles: 28,
  stack: {
    frontend: 'nextjs',
    backend: 'nextjs-api',
    database: 'postgresql',
    orm: 'prisma',
    auth: 'clerk',
    styling: 'tailwind',
    deployment: 'vercel',
  },
  architecture: {
    roles: ['admin', 'user'],
    permissions: {
      admin: ['read:all', 'write:all', 'delete:all', 'manage:users', 'view:analytics'],
      user: ['read:own', 'write:own', 'delete:own'],
    },
    featureFlags: {
      billing: true,
      analytics: false,
      teamAccounts: false,
      apiAccess: false,
    },
    testing: { unit: true, integration: false, e2e: false, framework: 'vitest' },
  },
}

const AI_TOOL: SaaSTemplate = {
  id: 'ai-tool',
  name: 'AI Tool',
  description: 'AI-powered SaaS tool with credit system, streaming, and generation history',
  icon: '🤖',
  tags: ['ai', 'llm', 'generation', 'credits', 'streaming', 'saas', 'openai', 'gemini'],
  productTypes: ['ai_tool', 'saas'],
  modules: ['auth', 'users', 'billing', 'dashboard', 'ai-generator', 'analytics'],
  complexity: 'standard',
  estimatedFiles: 32,
  stack: {
    frontend: 'nextjs',
    backend: 'nextjs-api',
    database: 'postgresql',
    orm: 'prisma',
    auth: 'clerk',
    styling: 'tailwind',
    deployment: 'vercel',
  },
  architecture: {
    roles: ['admin', 'user', 'pro'],
    permissions: {
      admin: ['read:all', 'write:all', 'manage:users', 'view:analytics'],
      pro: ['read:own', 'write:own', 'use:ai', 'access:advanced'],
      user: ['read:own', 'write:own', 'use:ai'],
    },
    featureFlags: {
      billing: true,
      analytics: true,
      streaming: true,
      modelSelection: true,
    },
    testing: { unit: true, integration: true, e2e: false, framework: 'vitest' },
  },
}

const MARKETPLACE: SaaSTemplate = {
  id: 'marketplace',
  name: 'Marketplace',
  description: 'Two-sided marketplace with listings, search, payments, and reviews',
  icon: '🛒',
  tags: ['marketplace', 'listings', 'search', 'payments', 'reviews', 'sellers', 'buyers', 'stripe'],
  productTypes: ['marketplace', 'ecommerce'],
  modules: ['auth', 'users', 'billing', 'dashboard', 'analytics', 'notifications'],
  complexity: 'advanced',
  estimatedFiles: 45,
  stack: {
    frontend: 'nextjs',
    backend: 'nextjs-api',
    database: 'postgresql',
    orm: 'prisma',
    auth: 'clerk',
    styling: 'tailwind',
    deployment: 'vercel',
  },
  architecture: {
    roles: ['admin', 'seller', 'buyer'],
    permissions: {
      admin: ['read:all', 'write:all', 'manage:listings', 'manage:users', 'view:analytics'],
      seller: ['create:listing', 'manage:own_listings', 'view:orders', 'respond:reviews'],
      buyer: ['browse:listings', 'create:order', 'write:review', 'manage:own_orders'],
    },
    featureFlags: {
      billing: true,
      reviews: true,
      search: true,
      messaging: false,
      escrow: false,
    },
    testing: { unit: true, integration: true, e2e: true, framework: 'playwright' },
  },
}

const CRM: SaaSTemplate = {
  id: 'crm',
  name: 'CRM System',
  description: 'Customer relationship management with pipeline, contacts, and deals',
  icon: '👥',
  tags: ['crm', 'contacts', 'deals', 'pipeline', 'sales', 'leads', 'kanban', 'email'],
  productTypes: ['crm'],
  modules: ['auth', 'users', 'dashboard', 'analytics', 'notifications'],
  complexity: 'advanced',
  estimatedFiles: 40,
  stack: {
    frontend: 'nextjs',
    backend: 'nextjs-api',
    database: 'postgresql',
    orm: 'prisma',
    auth: 'clerk',
    styling: 'tailwind',
    deployment: 'vercel',
  },
  architecture: {
    roles: ['admin', 'manager', 'sales_rep'],
    permissions: {
      admin: ['read:all', 'write:all', 'manage:team', 'view:reports'],
      manager: ['read:team', 'write:team', 'assign:leads', 'view:reports'],
      sales_rep: ['read:own', 'write:own', 'create:contact', 'update:deal'],
    },
    featureFlags: {
      emailIntegration: false,
      calendarSync: false,
      automations: false,
      reporting: true,
    },
    testing: { unit: true, integration: false, e2e: false, framework: 'vitest' },
  },
}

const AGENCY_DASHBOARD: SaaSTemplate = {
  id: 'agency-dashboard',
  name: 'Agency Dashboard',
  description: 'Client management dashboard for agencies with projects, invoices, and reporting',
  icon: '📊',
  tags: ['agency', 'clients', 'projects', 'invoices', 'dashboard', 'reporting', 'team'],
  productTypes: ['agency', 'dashboard'],
  modules: ['auth', 'users', 'billing', 'dashboard', 'analytics', 'notifications'],
  complexity: 'standard',
  estimatedFiles: 30,
  stack: {
    frontend: 'nextjs',
    backend: 'nextjs-api',
    database: 'postgresql',
    orm: 'prisma',
    auth: 'clerk',
    styling: 'tailwind',
    deployment: 'vercel',
  },
  architecture: {
    roles: ['admin', 'manager', 'client'],
    permissions: {
      admin: ['read:all', 'write:all', 'manage:clients', 'manage:team'],
      manager: ['read:assigned', 'write:assigned', 'create:report'],
      client: ['read:own_projects', 'view:invoices', 'approve:deliverables'],
    },
    featureFlags: {
      billing: true,
      clientPortal: true,
      timeTracking: false,
      whiteLabel: false,
    },
    testing: { unit: true, integration: false, e2e: false, framework: 'vitest' },
  },
}

const BOOKING_PLATFORM: SaaSTemplate = {
  id: 'booking-platform',
  name: 'Booking Platform',
  description: 'Service booking platform with calendar, payments, and provider management',
  icon: '📅',
  tags: ['booking', 'scheduling', 'calendar', 'appointments', 'services', 'payments', 'fitness', 'health'],
  productTypes: ['booking', 'saas'],
  modules: ['auth', 'users', 'billing', 'bookings', 'dashboard', 'notifications', 'analytics'],
  complexity: 'advanced',
  estimatedFiles: 38,
  stack: {
    frontend: 'nextjs',
    backend: 'nextjs-api',
    database: 'postgresql',
    orm: 'prisma',
    auth: 'clerk',
    styling: 'tailwind',
    deployment: 'vercel',
  },
  architecture: {
    roles: ['admin', 'provider', 'client'],
    permissions: {
      admin: ['read:all', 'write:all', 'manage:providers'],
      provider: ['manage:own_services', 'view:own_bookings', 'manage:availability'],
      client: ['browse:services', 'create:booking', 'cancel:own_booking'],
    },
    featureFlags: {
      billing: true,
      reminders: true,
      waitlist: false,
      groupBookings: false,
    },
    testing: { unit: true, integration: true, e2e: false, framework: 'vitest' },
  },
}

// ── Registry ──────────────────────────────────────────────────────────────────

const TEMPLATE_REGISTRY: Record<string, SaaSTemplate> = {
  'saas-starter': SAAS_STARTER,
  'ai-tool': AI_TOOL,
  'marketplace': MARKETPLACE,
  'crm': CRM,
  'agency-dashboard': AGENCY_DASHBOARD,
  'booking-platform': BOOKING_PLATFORM,
}

export function getTemplate(id: string): SaaSTemplate | undefined {
  return TEMPLATE_REGISTRY[id]
}

export function listTemplates(): SaaSTemplate[] {
  return Object.values(TEMPLATE_REGISTRY)
}

export function getTemplatesByTag(tag: string): SaaSTemplate[] {
  return listTemplates().filter(t => t.tags.includes(tag))
}

export function getTemplatesByProductType(type: string): SaaSTemplate[] {
  return listTemplates().filter(t => t.productTypes.includes(type as SaaSTemplate['productTypes'][number]))
}
