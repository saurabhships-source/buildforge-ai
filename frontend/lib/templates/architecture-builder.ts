// Architecture Builder — merges template + intent + modules into a full SaaSArchitectureSpec

import type { SaaSArchitectureSpec, SaaSTemplate, ExtractedIntent } from './types'
import { resolveModules, mergeModuleSpecs } from '@/lib/modules'
import { getTemplate } from './template-registry'

export function buildArchitectureSpec(
  template: SaaSTemplate,
  intent: ExtractedIntent,
  customModules: string[]
): SaaSArchitectureSpec {
  const resolvedMods = resolveModules(customModules)
  const merged = mergeModuleSpecs(resolvedMods)

  const projectName = intent.domain !== 'general'
    ? `${intent.domain.charAt(0).toUpperCase() + intent.domain.slice(1)} ${template.name}`
    : template.name

  const stack = {
    frontend: 'nextjs' as const,
    backend: 'nextjs-api' as const,
    database: 'postgresql' as const,
    orm: 'prisma' as const,
    auth: 'clerk' as const,
    styling: 'tailwind' as const,
    deployment: 'vercel' as const,
    ...template.stack,
  }

  const roles = template.architecture.roles ?? intent.roles
  const permissions = template.architecture.permissions ?? {}

  // Ensure all intent roles have at least a default permission set
  for (const role of intent.roles) {
    if (!permissions[role]) {
      permissions[role] = ['read:own', 'write:own']
    }
  }

  return {
    project: {
      name: projectName,
      description: template.description,
      type: intent.productType,
      domain: intent.domain,
    },
    stack,
    modules: customModules,
    roles,
    permissions,
    database: {
      tables: merged.tables,
    },
    api: {
      routes: merged.routes,
      baseUrl: '/api',
    },
    frontend: {
      pages: merged.pages,
      components: merged.components,
      designSystem: {
        primaryColor: 'indigo',
        style: 'modern',
        fonts: ['Inter', 'Geist'],
      },
    },
    services: merged.services,
    integrations: intent.integrations,
    featureFlags: {
      ...(template.architecture.featureFlags ?? {}),
      billing: intent.hasPayments,
      ai: intent.hasAI,
    },
    testing: template.architecture.testing ?? {
      unit: true,
      integration: false,
      e2e: false,
      framework: 'vitest',
    },
    buildGraph: {
      pipeline: 'saas',
      parallelNodes: [
        ['database', 'auth', 'designSystem'],
        ['api', 'services', 'permissions'],
        ['components', 'pages'],
        ['integrations', 'testing'],
        ['optimization', 'security'],
      ],
    },
  }
}

/** Build architecture from just a template id + intent (convenience wrapper) */
export function buildArchitectureFromTemplate(
  templateId: string,
  intent: ExtractedIntent,
  customModules: string[]
): SaaSArchitectureSpec | null {
  const template = getTemplate(templateId)
  if (!template) return null
  return buildArchitectureSpec(template, intent, customModules)
}
