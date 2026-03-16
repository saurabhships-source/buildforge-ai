// Project Planner Agent — analyzes a prompt and returns a structured project plan
// Also extracts intent and selects a SaaS template when in saas mode.

import { extractIntent, selectBestTemplate, customizeModules } from '@/lib/templates/intent-extractor'
import { buildArchitectureFromTemplate } from '@/lib/templates/architecture-builder'
import type { SaaSArchitectureSpec } from '@/lib/templates/types'

export interface ProjectPlan {
  projectName: string
  description: string
  appType: string
  pages: string[]
  components: string[]
  database: { tables: Record<string, string[]> } | null
  apis: string[]
  authentication: { provider: string; methods: string[] } | null
  integrations: string[]
  designSystem: {
    primaryColor: string
    style: string
    fonts: string[]
  }
  estimatedFiles: number
  complexity: 'simple' | 'medium' | 'complex'
  // SaaS extras
  templateId?: string
  templateConfidence?: number
  architecture?: SaaSArchitectureSpec
}

export function plannerSystemPrompt(): string {
  return `You are BuildForge ProjectPlanner — an expert software architect.

Your job is to analyze a user's app idea and produce a structured project plan BEFORE any code is written.

OUTPUT FORMAT — return ONLY this exact JSON (no markdown, no fences, no extra text):
{
  "projectName": "short name for the project",
  "description": "one sentence description",
  "appType": "website|tool|saas|dashboard|ai_app|crm|internal_tool",
  "pages": ["list of page names"],
  "components": ["list of reusable component names"],
  "database": {
    "tables": {
      "tableName": ["column1", "column2", "column3"]
    }
  },
  "apis": ["list of API route names like /api/users, /api/posts"],
  "authentication": {
    "provider": "clerk|supabase|none",
    "methods": ["email", "google", "github"]
  },
  "integrations": ["stripe", "sendgrid", "etc — only if needed"],
  "designSystem": {
    "primaryColor": "purple|blue|green|red|orange|indigo",
    "style": "modern|minimal|corporate|playful|dark",
    "fonts": ["Inter", "Geist"]
  },
  "estimatedFiles": 12,
  "complexity": "simple|medium|complex"
}

RULES:
- Only include database if the app needs data persistence
- Only include authentication if the app needs user accounts
- Only include integrations that are explicitly needed
- Be specific with component names (e.g. "PricingCard" not "Card")
- Pages should be route names (e.g. "Landing", "Dashboard", "Settings")
- APIs should be REST-style paths
- estimatedFiles should be realistic (simple: 5-10, medium: 10-20, complex: 20+)`
}

export function plannerUserMessage(prompt: string): string {
  return `Analyze this app idea and create a project plan:\n\n${prompt}\n\nReturn the structured JSON plan.`
}

export function parsePlan(text: string): ProjectPlan {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned) as ProjectPlan
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as ProjectPlan } catch { /* fall through */ }
    }
    return {
      projectName: 'My Project',
      description: text.slice(0, 80),
      appType: 'website',
      pages: ['Landing', 'About', 'Contact'],
      components: ['Navbar', 'Hero', 'Footer'],
      database: null,
      apis: [],
      authentication: null,
      integrations: [],
      designSystem: { primaryColor: 'purple', style: 'modern', fonts: ['Inter'] },
      estimatedFiles: 5,
      complexity: 'simple',
    }
  }
}

/** Extract intent + select template + build architecture spec from a prompt */
export function planSaaSArchitecture(prompt: string): {
  intent: ReturnType<typeof extractIntent>
  match: ReturnType<typeof selectBestTemplate>
  modules: string[]
  architecture: SaaSArchitectureSpec | null
} {
  const intent = extractIntent(prompt)
  const match = selectBestTemplate(intent)
  const modules = customizeModules(
    match.suggestedModules,
    intent
  )
  const architecture = buildArchitectureFromTemplate(match.templateId, intent, modules)
  return { intent, match, modules, architecture }
}
