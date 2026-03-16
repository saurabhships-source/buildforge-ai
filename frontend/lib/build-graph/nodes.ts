// Build Graph Nodes — one node per agent/task
// Each node wraps an agent call and returns files.

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import { builderSystemPrompt, buildUserMessage } from '@/lib/ai-engine/agents/builder-agent'
import { debugSystemPrompt } from '@/lib/ai-engine/agents/debug-agent'
import { uiSystemPrompt } from '@/lib/ai-engine/agents/ui-agent'
import { uxSystemPrompt } from '@/lib/ai-engine/agents/ux-agent'
import { seoSystemPrompt, generateStaticSEO } from '@/lib/ai-engine/agents/seo-agent'
import { performanceSystemPrompt, staticPerformanceScan } from '@/lib/ai-engine/agents/performance-agent'
import { securitySystemPrompt, staticSecurityScan } from '@/lib/ai-engine/agents/security-agent'
import { parseFilesJson } from '@/lib/ai-engine/tool-adapters/base-adapter'
import { generateFallbackProject } from '@/lib/ai-engine/fallback-generator'
import type { BuildNode, BuildContext, BuildNodeResult } from './types'
import type { SaaSArchitectureSpec } from '@/lib/templates/types'
import type { ModelId } from '@/lib/ai-engine/model-router'

const TIMEOUT_MS = 55_000

async function aiGenerate(model: ModelId, system: string, prompt: string): Promise<string> {
  const result = await Promise.race([
    generateText({ model: getModel(model), system, prompt, maxOutputTokens: 12000 }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('AI timeout')), TIMEOUT_MS)),
  ])
  return result.text
}

function filesContext(files: Record<string, string>): string {
  return Object.entries(files).map(([k, v]) => `=== ${k} ===\n${v}`).join('\n\n')
}

// ── Node factory helpers ──────────────────────────────────────────────────────

export function makePlannerNode(): BuildNode {
  return {
    id: 'planner',
    type: 'planner',
    label: 'PlannerAgent: analyzing prompt',
    dependencies: [],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      ctx.emitEvent({ id: 'planner-1', agent: 'planner', action: 'analyzing prompt', timestamp: new Date().toISOString(), status: 'running' })
      // Planner doesn't produce files — it enriches context. Return empty.
      return { files: {}, description: 'Plan analyzed', skipped: false }
    },
  }
}

export function makeArchitectNode(): BuildNode {
  return {
    id: 'architect',
    type: 'architect',
    label: 'ArchitectAgent: designing architecture',
    dependencies: ['planner'],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      ctx.emitEvent({ id: 'arch-1', agent: 'architect', action: 'designing architecture', timestamp: new Date().toISOString(), status: 'running' })
      const system = `You are ArchitectAgent. Design a file architecture for the project.
Return ONLY JSON: { "files": { "README.md": "# Architecture\\n...", "package.json": "..." }, "entrypoint": "index.html", "description": "..." }`
      try {
        const text = await aiGenerate(ctx.modelId as ModelId, system, `Design architecture for: ${ctx.prompt}`)
        const result = parseFilesJson(text)
        ctx.emitEvent({ id: 'arch-2', agent: 'architect', action: `designed ${Object.keys(result.files).length} scaffold files`, timestamp: new Date().toISOString(), status: 'success' })
        return { files: result.files, description: result.description }
      } catch {
        return { files: {}, description: 'Architecture skipped', skipped: true }
      }
    },
  }
}

export function makeBuilderNode(): BuildNode {
  return {
    id: 'builder',
    type: 'builder',
    label: 'BuilderAgent: generating components',
    dependencies: ['architect'],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      ctx.emitEvent({ id: 'build-1', agent: 'builder', action: 'generating project files', timestamp: new Date().toISOString(), status: 'running' })
      const system = builderSystemPrompt(ctx.appType, Object.keys(ctx.files).length > 0 ? ctx.files : undefined, ctx.prompt)
      const userMsg = buildUserMessage(ctx.prompt, ctx.appType, Object.keys(ctx.files).length > 0 ? ctx.files : undefined)
      try {
        const text = await aiGenerate(ctx.modelId as ModelId, system, userMsg)
        const result = parseFilesJson(text)
        const fileCount = Object.keys(result.files).length
        ctx.emitEvent({ id: 'build-2', agent: 'builder', action: `generated ${fileCount} files`, timestamp: new Date().toISOString(), status: 'success' })
        return { files: result.files, description: result.description }
      } catch (err) {
        const fallback = generateFallbackProject(ctx.prompt, err instanceof Error ? err.message : 'Build failed')
        return { files: fallback.files, description: fallback.description }
      }
    },
  }
}

export function makeDebuggerNode(): BuildNode {
  return {
    id: 'debugger',
    type: 'debugger',
    label: 'DebuggerAgent: fixing errors',
    dependencies: ['builder'],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      if (Object.keys(ctx.files).length === 0) return { files: {}, description: 'No files to debug', skipped: true }
      ctx.emitEvent({ id: 'debug-1', agent: 'debugger', action: 'scanning for errors', timestamp: new Date().toISOString(), status: 'running' })
      const system = debugSystemPrompt(ctx.files)
      try {
        const text = await aiGenerate(ctx.modelId as ModelId, system, `Fix all errors in this project:\n${filesContext(ctx.files)}`)
        const result = parseFilesJson(text)
        ctx.emitEvent({ id: 'debug-2', agent: 'debugger', action: 'errors fixed', timestamp: new Date().toISOString(), status: 'success' })
        return { files: result.files, description: result.description }
      } catch {
        return { files: {}, description: 'Debug skipped', skipped: true }
      }
    },
  }
}

export function makeOptimizerNode(): BuildNode {
  return {
    id: 'optimizer',
    type: 'optimizer',
    label: 'OptimizerAgent: improving performance',
    dependencies: ['debugger'],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const issues = staticPerformanceScan(ctx.files)
      if (issues.length === 0) {
        ctx.emitEvent({ id: 'opt-1', agent: 'optimizer', action: 'no performance issues found', timestamp: new Date().toISOString(), status: 'info' })
        return { files: {}, description: 'No performance issues', skipped: true }
      }
      ctx.emitEvent({ id: 'opt-2', agent: 'optimizer', action: `fixing ${issues.length} performance issues`, timestamp: new Date().toISOString(), status: 'running' })
      const system = performanceSystemPrompt(ctx.files)
      try {
        const text = await aiGenerate(ctx.modelId as ModelId, system, `Optimize performance. Issues: ${issues.join(', ')}\n\n${filesContext(ctx.files)}`)
        const result = parseFilesJson(text)
        return { files: result.files, description: result.description }
      } catch {
        return { files: {}, description: 'Optimizer skipped', skipped: true }
      }
    },
  }
}

export function makeTesterNode(): BuildNode {
  return {
    id: 'tester',
    type: 'tester',
    label: 'TesterAgent: generating tests',
    dependencies: ['optimizer'],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      ctx.emitEvent({ id: 'test-1', agent: 'tester', action: 'generating test suite', timestamp: new Date().toISOString(), status: 'running' })
      const system = `You are TesterAgent. Generate a comprehensive test suite for this project.
Include: unit tests, integration tests, accessibility checks.
Return ONLY JSON: { "files": { "tests/index.test.js": "..." }, "entrypoint": "index.html", "description": "..." }`
      try {
        const text = await aiGenerate(ctx.modelId as ModelId, system, `Generate tests for:\n${filesContext(ctx.files)}`)
        const result = parseFilesJson(text)
        ctx.emitEvent({ id: 'test-2', agent: 'tester', action: `generated ${Object.keys(result.files).length} test files`, timestamp: new Date().toISOString(), status: 'success' })
        return { files: result.files, description: result.description }
      } catch {
        return { files: {}, description: 'Tests skipped', skipped: true }
      }
    },
  }
}

export function makeUINode(): BuildNode {
  return {
    id: 'ui',
    type: 'ui',
    label: 'UIAgent: polishing design',
    dependencies: ['debugger'],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      ctx.emitEvent({ id: 'ui-1', agent: 'ui', action: 'polishing UI design', timestamp: new Date().toISOString(), status: 'running' })
      const system = uiSystemPrompt(ctx.files)
      try {
        const text = await aiGenerate(ctx.modelId as ModelId, system, `Improve the visual design:\n${filesContext(ctx.files)}`)
        const result = parseFilesJson(text)
        return { files: result.files, description: result.description }
      } catch {
        return { files: {}, description: 'UI polish skipped', skipped: true }
      }
    },
  }
}

export function makeUXNode(): BuildNode {
  return {
    id: 'ux',
    type: 'ux',
    label: 'UXAgent: improving user experience',
    dependencies: ['ui'],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      ctx.emitEvent({ id: 'ux-1', agent: 'ux', action: 'improving UX flows', timestamp: new Date().toISOString(), status: 'running' })
      const system = uxSystemPrompt(ctx.files)
      try {
        const text = await aiGenerate(ctx.modelId as ModelId, system, `Improve UX:\n${filesContext(ctx.files)}`)
        const result = parseFilesJson(text)
        return { files: result.files, description: result.description }
      } catch {
        return { files: {}, description: 'UX skipped', skipped: true }
      }
    },
  }
}

export function makeSEONode(): BuildNode {
  return {
    id: 'seo',
    type: 'seo',
    label: 'SEOAgent: adding SEO',
    dependencies: ['builder'],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      ctx.emitEvent({ id: 'seo-1', agent: 'seo', action: 'adding SEO metadata', timestamp: new Date().toISOString(), status: 'running' })
      const staticSEO = generateStaticSEO(ctx.prompt.slice(0, 40), 'https://yourdomain.com', ctx.prompt)
      const system = seoSystemPrompt(ctx.files)
      try {
        const text = await aiGenerate(ctx.modelId as ModelId, system, `Add SEO:\n${filesContext(ctx.files)}`)
        const result = parseFilesJson(text)
        return { files: { ...staticSEO, ...result.files }, description: result.description }
      } catch {
        return { files: staticSEO, description: 'Static SEO added' }
      }
    },
  }
}

export function makeSecurityNode(): BuildNode {
  return {
    id: 'security',
    type: 'security',
    label: 'SecurityAgent: auditing security',
    dependencies: ['builder'],
    status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const issues = staticSecurityScan(ctx.files)
      if (issues.length === 0) {
        return { files: {}, description: 'No security issues', skipped: true }
      }
      ctx.emitEvent({ id: 'sec-1', agent: 'security', action: `fixing ${issues.length} security issues`, timestamp: new Date().toISOString(), status: 'running' })
      const system = securitySystemPrompt(ctx.files)
      try {
        const text = await aiGenerate(ctx.modelId as ModelId, system, `Fix security issues: ${issues.join(', ')}\n\n${filesContext(ctx.files)}`)
        const result = parseFilesJson(text)
        return { files: result.files, description: result.description }
      } catch {
        return { files: {}, description: 'Security skipped', skipped: true }
      }
    },
  }
}

// ── Preset graph configurations ───────────────────────────────────────────────

/** Full autonomous pipeline: planner → architect → builder → debugger → optimizer + ui + seo + security → ux → tester */
export function createFullPipeline(): BuildNode[] {
  return [
    makePlannerNode(),
    makeArchitectNode(),
    makeBuilderNode(),
    makeDebuggerNode(),
    makeOptimizerNode(),
    makeUINode(),
    makeUXNode(),
    makeSEONode(),
    makeSecurityNode(),
    makeTesterNode(),
  ]
}

/** Fast pipeline: planner → builder → debugger → ui */
export function createFastPipeline(): BuildNode[] {
  return [
    makePlannerNode(),
    makeBuilderNode(),
    makeDebuggerNode(),
    makeUINode(),
  ]
}

/** Maintenance pipeline: debugger → optimizer → security → seo */
export function createMaintenancePipeline(): BuildNode[] {
  const nodes = [
    makeDebuggerNode(),
    makeOptimizerNode(),
    makeSecurityNode(),
    makeSEONode(),
  ]
  // Remove dependencies on 'builder' since we're starting from existing files
  for (const node of nodes) {
    node.dependencies = node.dependencies.filter(d => d !== 'builder' && d !== 'architect' && d !== 'planner')
  }
  // Chain them sequentially
  nodes[1].dependencies = ['debugger']
  nodes[2].dependencies = []
  nodes[3].dependencies = []
  return nodes
}

// ── SaaS-specific node helpers ────────────────────────────────────────────────

function requireArch(ctx: BuildContext): SaaSArchitectureSpec {
  if (!ctx.architecture) throw new Error('Architecture spec missing — run templateSelection node first')
  return ctx.architecture
}

function archContext(arch: SaaSArchitectureSpec): string {
  return JSON.stringify({
    project: arch.project,
    stack: arch.stack,
    modules: arch.modules,
    roles: arch.roles,
    permissions: arch.permissions,
  }, null, 2)
}

async function saasGenerate(
  ctx: BuildContext,
  nodeId: string,
  system: string,
  userMsg: string
): Promise<BuildNodeResult> {
  try {
    const text = await aiGenerate(ctx.modelId as ModelId, system, userMsg)
    const result = parseFilesJson(text)
    ctx.emitEvent({ id: `${nodeId}-done`, agent: nodeId, action: `generated ${Object.keys(result.files).length} files`, timestamp: new Date().toISOString(), status: 'success' })
    return { files: result.files, description: result.description }
  } catch {
    ctx.emitEvent({ id: `${nodeId}-skip`, agent: nodeId, action: 'skipped', timestamp: new Date().toISOString(), status: 'info' })
    return { files: {}, description: `${nodeId} skipped`, skipped: true }
  }
}

export function makeTemplateSelectionNode(): BuildNode {
  return {
    id: 'templateSelection', type: 'templateSelection',
    label: 'TemplateAgent: selecting architecture template',
    dependencies: ['planner'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      ctx.emitEvent({ id: 'tmpl-1', agent: 'templateSelection', action: 'selecting template', timestamp: new Date().toISOString(), status: 'running' })
      // Architecture is set by the API route before graph execution; just validate
      if (!ctx.architecture) return { files: {}, description: 'No architecture — using default', skipped: true }
      ctx.emitEvent({ id: 'tmpl-2', agent: 'templateSelection', action: `template: ${ctx.architecture.project.type}`, timestamp: new Date().toISOString(), status: 'success' })
      return { files: {}, description: `Template selected: ${ctx.architecture.project.name}` }
    },
  }
}

export function makeDomainModelsNode(): BuildNode {
  return {
    id: 'domainModels', type: 'domainModels',
    label: 'ArchitectAgent: defining domain models',
    dependencies: ['templateSelection'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'dm-1', agent: 'domainModels', action: 'defining domain models', timestamp: new Date().toISOString(), status: 'running' })
      const tables = arch.database.tables.map(t => `${t.name}: ${t.columns.map(c => c.name).join(', ')}`).join('\n')
      const system = `You are ArchitectAgent. Generate TypeScript domain model types for a ${arch.project.type} application.
Return ONLY JSON: { "files": { "src/types/models.ts": "..." }, "entrypoint": "src/types/models.ts", "description": "Domain models" }`
      return saasGenerate(ctx, 'domainModels', system, `Project: ${arch.project.name}\nTables:\n${tables}\n\nGenerate TypeScript interfaces for all domain models.`)
    },
  }
}

export function makeDatabaseNode(): BuildNode {
  return {
    id: 'database', type: 'database',
    label: 'DatabaseAgent: generating Prisma schema',
    dependencies: ['domainModels'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'db-1', agent: 'database', action: 'generating Prisma schema', timestamp: new Date().toISOString(), status: 'running' })
      const tables = arch.database.tables
      const system = `You are DatabaseAgent. Generate a complete Prisma schema for a ${arch.project.type} SaaS application.
Return ONLY JSON: { "files": { "prisma/schema.prisma": "..." }, "entrypoint": "prisma/schema.prisma", "description": "Prisma schema" }`
      const tableDesc = tables.map(t =>
        `model ${t.name} {\n${t.columns.map(c => `  ${c.name} ${c.type}${c.required ? '' : '?'}${c.unique ? ' @unique' : ''}${c.relation ? ` // relation: ${c.relation}` : ''}`).join('\n')}\n}`
      ).join('\n\n')
      return saasGenerate(ctx, 'database', system, `Generate Prisma schema for:\n${tableDesc}\n\nStack: ${arch.stack.database}, ORM: ${arch.stack.orm}`)
    },
  }
}

export function makeAuthNode(): BuildNode {
  return {
    id: 'auth', type: 'auth',
    label: 'AuthAgent: setting up authentication',
    dependencies: ['domainModels'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'auth-1', agent: 'auth', action: 'setting up auth', timestamp: new Date().toISOString(), status: 'running' })
      const system = `You are AuthAgent. Generate authentication setup for a ${arch.project.type} app using ${arch.stack.auth}.
Return ONLY JSON: { "files": { "middleware.ts": "...", "lib/auth.ts": "..." }, "entrypoint": "middleware.ts", "description": "Auth setup" }`
      return saasGenerate(ctx, 'auth', system, `Auth provider: ${arch.stack.auth}\nRoles: ${arch.roles.join(', ')}\nPermissions: ${JSON.stringify(arch.permissions)}`)
    },
  }
}

export function makeDesignSystemNode(): BuildNode {
  return {
    id: 'designSystem', type: 'designSystem',
    label: 'DesignAgent: creating design system',
    dependencies: ['templateSelection'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'ds-1', agent: 'designSystem', action: 'creating design system', timestamp: new Date().toISOString(), status: 'running' })
      const ds = arch.frontend.designSystem
      const system = `You are DesignAgent. Generate a design system config for a ${arch.project.type} app.
Return ONLY JSON: { "files": { "tailwind.config.ts": "...", "src/styles/globals.css": "..." }, "entrypoint": "tailwind.config.ts", "description": "Design system" }`
      return saasGenerate(ctx, 'designSystem', system, `Style: ${ds.style}, Color: ${ds.primaryColor}, Fonts: ${ds.fonts.join(', ')}\nStyling: ${arch.stack.styling}`)
    },
  }
}

export function makeApiNode(): BuildNode {
  return {
    id: 'api', type: 'api',
    label: 'APIAgent: generating API routes',
    dependencies: ['database', 'auth'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'api-1', agent: 'api', action: 'generating API routes', timestamp: new Date().toISOString(), status: 'running' })
      const routes = arch.api.routes.map(r => `${r.method} ${r.path} — ${r.description}${r.auth ? ' [auth]' : ''}${r.roles ? ` [${r.roles.join(',')}]` : ''}`).join('\n')
      const system = `You are APIAgent. Generate Next.js API route handlers for a ${arch.project.type} SaaS app.
Return ONLY JSON: { "files": { "app/api/[route]/route.ts": "..." }, "entrypoint": "app/api", "description": "API routes" }`
      return saasGenerate(ctx, 'api', system, `Routes:\n${routes}\n\nStack: ${arch.stack.backend}, Auth: ${arch.stack.auth}\n\nContext:\n${archContext(arch)}`)
    },
  }
}

export function makeServicesNode(): BuildNode {
  return {
    id: 'services', type: 'services',
    label: 'ServicesAgent: generating service layer',
    dependencies: ['database'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'svc-1', agent: 'services', action: 'generating services', timestamp: new Date().toISOString(), status: 'running' })
      const svcList = arch.services.map(s => `${s.name}: ${s.methods.join(', ')}`).join('\n')
      const system = `You are ServicesAgent. Generate TypeScript service classes for a ${arch.project.type} SaaS app.
Return ONLY JSON: { "files": { "lib/services/[name].ts": "..." }, "entrypoint": "lib/services", "description": "Service layer" }`
      return saasGenerate(ctx, 'services', system, `Services:\n${svcList}\n\nORM: ${arch.stack.orm}`)
    },
  }
}

export function makePermissionsNode(): BuildNode {
  return {
    id: 'permissions', type: 'permissions',
    label: 'PermissionsAgent: generating RBAC',
    dependencies: ['auth'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'perm-1', agent: 'permissions', action: 'generating RBAC', timestamp: new Date().toISOString(), status: 'running' })
      const system = `You are PermissionsAgent. Generate a role-based access control (RBAC) system.
Return ONLY JSON: { "files": { "lib/permissions.ts": "...", "lib/rbac.ts": "..." }, "entrypoint": "lib/permissions.ts", "description": "RBAC system" }`
      return saasGenerate(ctx, 'permissions', system, `Roles: ${arch.roles.join(', ')}\nPermissions: ${JSON.stringify(arch.permissions, null, 2)}`)
    },
  }
}

export function makeComponentsNode(): BuildNode {
  return {
    id: 'components', type: 'components',
    label: 'UIAgent: generating React components',
    dependencies: ['designSystem', 'api'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'comp-1', agent: 'components', action: 'generating components', timestamp: new Date().toISOString(), status: 'running' })
      const compList = arch.frontend.components.map(c => `${c.name} (${c.type}): ${c.description}`).join('\n')
      const system = `You are UIAgent. Generate React/TypeScript components for a ${arch.project.type} SaaS app using ${arch.stack.styling}.
Return ONLY JSON: { "files": { "components/[name].tsx": "..." }, "entrypoint": "components", "description": "React components" }`
      return saasGenerate(ctx, 'components', system, `Components:\n${compList}\n\nDesign: ${arch.frontend.designSystem.style}, Color: ${arch.frontend.designSystem.primaryColor}`)
    },
  }
}

export function makePagesNode(): BuildNode {
  return {
    id: 'pages', type: 'pages',
    label: 'BuilderAgent: generating Next.js pages',
    dependencies: ['components', 'permissions'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'pages-1', agent: 'pages', action: 'generating pages', timestamp: new Date().toISOString(), status: 'running' })
      const pageList = arch.frontend.pages.map(p => `${p.name} (${p.path})${p.auth ? ' [auth]' : ''}${p.roles ? ` [${p.roles.join(',')}]` : ''}: ${p.components.join(', ')}`).join('\n')
      const system = `You are BuilderAgent. Generate Next.js App Router pages for a ${arch.project.type} SaaS app.
Return ONLY JSON: { "files": { "app/[path]/page.tsx": "..." }, "entrypoint": "app", "description": "Next.js pages" }`
      return saasGenerate(ctx, 'pages', system, `Pages:\n${pageList}\n\nFramework: ${arch.stack.frontend}`)
    },
  }
}

export function makeIntegrationsNode(): BuildNode {
  return {
    id: 'integrations', type: 'integrations',
    label: 'IntegrationsAgent: wiring integrations',
    dependencies: ['services'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      if (arch.integrations.length === 0) return { files: {}, description: 'No integrations needed', skipped: true }
      ctx.emitEvent({ id: 'int-1', agent: 'integrations', action: `wiring ${arch.integrations.join(', ')}`, timestamp: new Date().toISOString(), status: 'running' })
      const system = `You are IntegrationsAgent. Generate integration setup files for a ${arch.project.type} SaaS app.
Return ONLY JSON: { "files": { "lib/integrations/[name].ts": "..." }, "entrypoint": "lib/integrations", "description": "Integrations" }`
      return saasGenerate(ctx, 'integrations', system, `Integrations: ${arch.integrations.join(', ')}\nStack: ${JSON.stringify(arch.stack)}`)
    },
  }
}

export function makeTestingNode(): BuildNode {
  return {
    id: 'testing', type: 'testing',
    label: 'TesterAgent: generating test suite',
    dependencies: ['pages', 'api'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      if (!arch.testing.unit && !arch.testing.integration && !arch.testing.e2e) {
        return { files: {}, description: 'Testing disabled', skipped: true }
      }
      ctx.emitEvent({ id: 'test-1', agent: 'testing', action: 'generating tests', timestamp: new Date().toISOString(), status: 'running' })
      const system = `You are TesterAgent. Generate a test suite using ${arch.testing.framework}.
Return ONLY JSON: { "files": { "tests/[name].test.ts": "..." }, "entrypoint": "tests", "description": "Test suite" }`
      return saasGenerate(ctx, 'testing', system, `Framework: ${arch.testing.framework}\nUnit: ${arch.testing.unit}, Integration: ${arch.testing.integration}, E2E: ${arch.testing.e2e}\nFiles: ${Object.keys(ctx.files).slice(0, 10).join(', ')}`)
    },
  }
}

export function makeOptimizationNode(): BuildNode {
  return {
    id: 'optimization', type: 'optimization',
    label: 'OptimizerAgent: optimizing SaaS code',
    dependencies: ['pages', 'api'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const issues = staticPerformanceScan(ctx.files)
      if (issues.length === 0) return { files: {}, description: 'No optimization needed', skipped: true }
      ctx.emitEvent({ id: 'opt-1', agent: 'optimization', action: `fixing ${issues.length} issues`, timestamp: new Date().toISOString(), status: 'running' })
      const system = performanceSystemPrompt(ctx.files)
      return saasGenerate(ctx, 'optimization', system, `Fix: ${issues.join(', ')}\n\n${filesContext(ctx.files)}`)
    },
  }
}

export function makeSecuritySaaSNode(): BuildNode {
  return {
    id: 'security', type: 'security',
    label: 'SecurityAgent: auditing SaaS security',
    dependencies: ['api', 'auth'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const issues = staticSecurityScan(ctx.files)
      if (issues.length === 0) return { files: {}, description: 'No security issues', skipped: true }
      ctx.emitEvent({ id: 'sec-1', agent: 'security', action: `fixing ${issues.length} issues`, timestamp: new Date().toISOString(), status: 'running' })
      const system = securitySystemPrompt(ctx.files)
      return saasGenerate(ctx, 'security', system, `Fix: ${issues.join(', ')}\n\n${filesContext(ctx.files)}`)
    },
  }
}

export function makePreviewNode(): BuildNode {
  return {
    id: 'preview', type: 'preview',
    label: 'PreviewAgent: generating preview',
    dependencies: ['pages', 'components'], status: 'pending',
    run: async (ctx: BuildContext): Promise<BuildNodeResult> => {
      const arch = requireArch(ctx)
      ctx.emitEvent({ id: 'prev-1', agent: 'preview', action: 'generating preview', timestamp: new Date().toISOString(), status: 'running' })
      const system = `You are PreviewAgent. Generate a single-file HTML preview of the ${arch.project.type} app landing page.
Return ONLY JSON: { "files": { "preview.html": "..." }, "entrypoint": "preview.html", "description": "Preview" }`
      return saasGenerate(ctx, 'preview', system, `Project: ${arch.project.name}\nDescription: ${arch.project.description}\nStyle: ${arch.frontend.designSystem.style}, Color: ${arch.frontend.designSystem.primaryColor}`)
    },
  }
}

/** SaaS pipeline: template → domain models → [database + auth + designSystem] → [api + services + permissions] → [components + pages] → [integrations + testing + optimization + security] → preview */
export function createSaaSPipeline(): BuildNode[] {
  return [
    makePlannerNode(),
    makeTemplateSelectionNode(),
    makeDomainModelsNode(),
    makeDatabaseNode(),
    makeAuthNode(),
    makeDesignSystemNode(),
    makeApiNode(),
    makeServicesNode(),
    makePermissionsNode(),
    makeComponentsNode(),
    makePagesNode(),
    makeIntegrationsNode(),
    makeTestingNode(),
    makeOptimizationNode(),
    makeSecuritySaaSNode(),
    makePreviewNode(),
  ]
}
