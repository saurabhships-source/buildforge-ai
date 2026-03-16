/**
 * Frontend Generator — generates Next.js App Router pages and components
 * for a SaaS product using Tailwind CSS.
 */

import { aiRequest, stripFences } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { ProductIntent } from './product-intent'
import type { ProductBlueprint, PageSpec } from './product-planner'

const FRONTEND_SYSTEM = `You are an expert Next.js and Tailwind CSS developer.
Generate complete, production-ready TypeScript React components.
Rules:
- Use Next.js 14 App Router conventions
- Use Tailwind CSS for all styling — no inline styles
- Use named exports: export function ComponentName()
- Include 'use client' directive only when needed (event handlers, hooks)
- No placeholder text — use realistic content for the product domain
- Return ONLY the file content — no markdown fences, no explanation`

async function generateFile(
  filePath: string,
  prompt: string,
  modelId: ModelId,
): Promise<string> {
  try {
    const text = await aiRequest({
      system: FRONTEND_SYSTEM,
      prompt,
      modelId,
      maxOutputTokens: 6000,
      timeoutMs: 30_000,
    })
    return stripFences(text)
  } catch (err) {
    logger.warn('ai-pipeline', `Frontend gen fallback for ${filePath}`, err instanceof Error ? err.message : String(err))
    return fallbackComponent(filePath)
  }
}

// ── Landing page ──────────────────────────────────────────────────────────────

export async function generateLandingPage(
  intent: ProductIntent,
  blueprint: ProductBlueprint,
  modelId: ModelId = 'gemini_flash',
): Promise<string> {
  return generateFile('app/page.tsx', `Generate a complete Next.js landing page for:
Product: ${intent.name}
Description: ${intent.description}
Domain: ${intent.domain}
Features: ${intent.features.join(', ')}

Include: hero section, features grid, pricing section (if SaaS), CTA, footer.
Use Tailwind. Named export: export default function HomePage()`, modelId)
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function generateDashboardPage(
  intent: ProductIntent,
  blueprint: ProductBlueprint,
  modelId: ModelId = 'gemini_flash',
): Promise<string> {
  const entityNames = intent.entities.map(e => e.name)
  return generateFile('app/dashboard/page.tsx', `Generate a Next.js dashboard page for:
Product: ${intent.name}
Entities: ${entityNames.join(', ')}

Include: stats cards (total counts), recent activity table, quick action buttons.
Add 'use client' at top. Named export: export default function DashboardPage()
Use realistic mock data for the ${intent.domain} domain.`, modelId)
}

// ── Dashboard layout ──────────────────────────────────────────────────────────

export async function generateDashboardLayout(
  intent: ProductIntent,
  blueprint: ProductBlueprint,
  modelId: ModelId = 'gemini_flash',
): Promise<string> {
  const navItems = intent.entities.map(e => ({
    label: e.name + 's',
    href: `/dashboard/${e.name.toLowerCase()}s`,
  }))

  return generateFile('app/dashboard/layout.tsx', `Generate a Next.js dashboard layout with sidebar for:
Product: ${intent.name}
Nav items: ${navItems.map(n => `${n.label} → ${n.href}`).join(', ')}

Include: sidebar with nav links, top bar with user menu, main content area.
Export: export default function DashboardLayout({ children }: { children: React.ReactNode })`, modelId)
}

// ── Entity list page ──────────────────────────────────────────────────────────

export async function generateEntityPage(
  entity: ProductIntent['entities'][0],
  intent: ProductIntent,
  modelId: ModelId = 'gemini_flash',
): Promise<string> {
  const slug = entity.name.toLowerCase() + 's'
  return generateFile(`app/dashboard/${slug}/page.tsx`, `Generate a Next.js page to list and manage ${entity.name}s for ${intent.name}.
Fields: ${entity.fields.join(', ')}

Include:
- Page header with "Add ${entity.name}" button
- Data table with columns for each field + actions (edit, delete)
- Search input
- Fetch data from /api/${slug}
Add 'use client'. Export: export default function ${entity.name}sPage()`, modelId)
}

// ── Form component ────────────────────────────────────────────────────────────

export async function generateEntityForm(
  entity: ProductIntent['entities'][0],
  intent: ProductIntent,
  modelId: ModelId = 'gemini_flash',
): Promise<string> {
  return generateFile(`components/${entity.name.toLowerCase()}-form.tsx`, `Generate a React form component for creating/editing a ${entity.name}.
Fields: ${entity.fields.join(', ')}
Product: ${intent.name}

Include: controlled inputs, validation, submit handler that calls /api/${entity.name.toLowerCase()}s.
Add 'use client'. Export: export function ${entity.name}Form({ onSuccess }: { onSuccess?: () => void })`, modelId)
}

// ── Batch generator ───────────────────────────────────────────────────────────

export async function generateAllFrontendFiles(
  intent: ProductIntent,
  blueprint: ProductBlueprint,
  modelId: ModelId = 'gemini_flash',
  onProgress?: (file: string) => void,
): Promise<Record<string, string>> {
  const files: Record<string, string> = {}

  const tasks: Array<{ path: string; fn: () => Promise<string> }> = [
    { path: 'app/page.tsx', fn: () => generateLandingPage(intent, blueprint, modelId) },
    { path: 'app/dashboard/page.tsx', fn: () => generateDashboardPage(intent, blueprint, modelId) },
    { path: 'app/dashboard/layout.tsx', fn: () => generateDashboardLayout(intent, blueprint, modelId) },
    ...intent.entities.flatMap(entity => [
      { path: `app/dashboard/${entity.name.toLowerCase()}s/page.tsx`, fn: () => generateEntityPage(entity, intent, modelId) },
      { path: `components/${entity.name.toLowerCase()}-form.tsx`, fn: () => generateEntityForm(entity, intent, modelId) },
    ]),
  ]

  for (const task of tasks) {
    onProgress?.(task.path)
    files[task.path] = await task.fn()
    logger.info('ai-pipeline', `Frontend: generated ${task.path}`)
  }

  // Static files that don't need AI
  files['app/layout.tsx'] = generateRootLayout(intent)
  files['app/(auth)/sign-in/[[...sign-in]]/page.tsx'] = generateAuthPage('sign-in')
  files['app/(auth)/sign-up/[[...sign-up]]/page.tsx'] = generateAuthPage('sign-up')

  return files
}

// ── Static templates ──────────────────────────────────────────────────────────

function generateRootLayout(intent: ProductIntent): string {
  return `import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: '${intent.name}',
  description: '${intent.description}',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-950 text-white antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
`
}

function generateAuthPage(type: 'sign-in' | 'sign-up'): string {
  const Component = type === 'sign-in' ? 'SignIn' : 'SignUp'
  return `import { ${Component} } from '@clerk/nextjs'

export default function ${Component}Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <${Component} />
    </div>
  )
}
`
}

function fallbackComponent(filePath: string): string {
  const name = filePath.split('/').pop()?.replace(/\.(tsx|ts)$/, '') ?? 'Component'
  const pascal = name.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join('')
  return `export default function ${pascal}() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">${pascal}</h1>
    </div>
  )
}
`
}
