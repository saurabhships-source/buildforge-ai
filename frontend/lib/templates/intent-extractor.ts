// Intent Extractor — parses a user prompt into structured intent
// Used by the planner to select the right template and modules

import type { ExtractedIntent, SaaSProductType, TemplateMatch } from './types'
import { listTemplates } from './template-registry'

// ── Keyword maps ──────────────────────────────────────────────────────────────

const PRODUCT_TYPE_KEYWORDS: Record<SaaSProductType, string[]> = {
  saas: ['saas', 'subscription', 'platform', 'service', 'software'],
  ai_tool: ['ai', 'llm', 'gpt', 'generate', 'artificial intelligence', 'machine learning', 'chatbot', 'assistant'],
  marketplace: ['marketplace', 'buy', 'sell', 'listing', 'vendor', 'seller', 'buyer', 'shop', 'store', 'ecommerce'],
  crm: ['crm', 'customer', 'contact', 'lead', 'deal', 'pipeline', 'sales', 'relationship'],
  dashboard: ['dashboard', 'analytics', 'metrics', 'reporting', 'admin', 'panel', 'monitor'],
  agency: ['agency', 'client', 'project management', 'freelance', 'studio', 'creative'],
  ecommerce: ['ecommerce', 'e-commerce', 'shop', 'product', 'cart', 'checkout', 'order'],
  course: ['course', 'learning', 'education', 'lesson', 'student', 'instructor', 'lms', 'tutorial'],
  booking: ['booking', 'appointment', 'schedule', 'calendar', 'reservation', 'slot', 'availability'],
  tool: ['tool', 'utility', 'converter', 'calculator', 'generator', 'editor'],
}

const FEATURE_KEYWORDS: Record<string, string[]> = {
  auth: ['login', 'signup', 'auth', 'authentication', 'user account', 'sign in', 'register'],
  billing: ['billing', 'payment', 'stripe', 'subscription', 'plan', 'pricing', 'invoice', 'charge'],
  dashboard: ['dashboard', 'overview', 'stats', 'metrics', 'kpi'],
  analytics: ['analytics', 'tracking', 'report', 'insight', 'data', 'chart', 'graph'],
  notifications: ['notification', 'alert', 'email', 'reminder', 'message'],
  bookings: ['booking', 'appointment', 'schedule', 'calendar', 'reservation'],
  'ai-generator': ['ai', 'generate', 'llm', 'gpt', 'openai', 'gemini', 'claude'],
  users: ['user', 'profile', 'account', 'member', 'team'],
  search: ['search', 'filter', 'find', 'discover'],
  reviews: ['review', 'rating', 'feedback', 'testimonial'],
  messaging: ['message', 'chat', 'inbox', 'conversation'],
}

const INTEGRATION_KEYWORDS: Record<string, string[]> = {
  stripe: ['stripe', 'payment', 'billing', 'subscription', 'checkout'],
  sendgrid: ['email', 'sendgrid', 'smtp', 'newsletter'],
  twilio: ['sms', 'twilio', 'text message', 'phone'],
  openai: ['openai', 'gpt', 'chatgpt', 'ai generation'],
  gemini: ['gemini', 'google ai', 'bard'],
  github: ['github', 'git', 'repository', 'code'],
  slack: ['slack', 'notification', 'webhook'],
  google: ['google', 'oauth', 'maps', 'calendar'],
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  fitness: ['fitness', 'gym', 'workout', 'exercise', 'health', 'trainer', 'yoga', 'pilates'],
  finance: ['finance', 'fintech', 'banking', 'investment', 'budget', 'accounting', 'tax'],
  healthcare: ['healthcare', 'medical', 'doctor', 'patient', 'clinic', 'hospital', 'health'],
  education: ['education', 'school', 'university', 'learning', 'student', 'teacher', 'course'],
  real_estate: ['real estate', 'property', 'house', 'apartment', 'rent', 'mortgage'],
  food: ['food', 'restaurant', 'delivery', 'recipe', 'meal', 'catering'],
  travel: ['travel', 'hotel', 'flight', 'booking', 'trip', 'vacation', 'tourism'],
  retail: ['retail', 'store', 'shop', 'product', 'inventory', 'ecommerce'],
  hr: ['hr', 'human resources', 'employee', 'payroll', 'recruitment', 'onboarding'],
  legal: ['legal', 'law', 'contract', 'compliance', 'attorney', 'document'],
}

// ── Extraction logic ──────────────────────────────────────────────────────────

export function extractIntent(prompt: string): ExtractedIntent {
  const p = prompt.toLowerCase()

  // Detect product type
  let productType: SaaSProductType = 'saas'
  let maxScore = 0
  for (const [type, keywords] of Object.entries(PRODUCT_TYPE_KEYWORDS)) {
    const score = keywords.filter(k => p.includes(k)).length
    if (score > maxScore) { maxScore = score; productType = type as SaaSProductType }
  }

  // Detect domain
  let domain = 'general'
  let domainScore = 0
  for (const [d, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.filter(k => p.includes(k)).length
    if (score > domainScore) { domainScore = score; domain = d }
  }

  // Detect features
  const features: string[] = []
  for (const [feature, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    if (keywords.some(k => p.includes(k))) features.push(feature)
  }

  // Detect integrations
  const integrations: string[] = []
  for (const [integration, keywords] of Object.entries(INTEGRATION_KEYWORDS)) {
    if (keywords.some(k => p.includes(k))) integrations.push(integration)
  }

  // Detect roles
  const roles: string[] = ['user']
  if (/admin|administrator|superuser/.test(p)) roles.push('admin')
  if (/manager|supervisor|lead/.test(p)) roles.push('manager')
  if (/seller|vendor|provider|host/.test(p)) roles.push('seller')
  if (/buyer|customer|client/.test(p)) roles.push('buyer')
  if (/trainer|instructor|teacher|coach/.test(p)) roles.push('provider')

  const hasAuth = features.includes('auth') || /user|account|login|signup/.test(p)
  const hasPayments = features.includes('billing') || /payment|stripe|billing|subscription/.test(p)
  const hasDatabase = hasAuth || hasPayments || /database|store|save|persist/.test(p)
  const hasAI = features.includes('ai-generator') || /ai|llm|gpt|generate|openai/.test(p)

  // Complexity
  const featureCount = features.length + integrations.length
  const complexity = featureCount >= 6 ? 'complex' : featureCount >= 3 ? 'medium' : 'simple'

  return {
    productType,
    domain,
    features,
    roles,
    integrations,
    hasAuth,
    hasPayments,
    hasDatabase,
    hasAI,
    complexity,
  }
}

// ── Template scoring ──────────────────────────────────────────────────────────

export function scoreTemplates(intent: ExtractedIntent): TemplateMatch[] {
  const templates = listTemplates()

  return templates
    .map(template => {
      let score = 0
      const reasons: string[] = []

      // Product type match (highest weight)
      if (template.productTypes.includes(intent.productType)) {
        score += 40
        reasons.push(`product type "${intent.productType}" matches`)
      }

      // Tag matches
      const tagMatches = intent.features.filter(f => template.tags.includes(f)).length
        + intent.integrations.filter(i => template.tags.includes(i)).length
      score += tagMatches * 8
      if (tagMatches > 0) reasons.push(`${tagMatches} feature/tag matches`)

      // Module coverage
      const moduleMatches = intent.features.filter(f => template.modules.includes(f)).length
      score += moduleMatches * 10
      if (moduleMatches > 0) reasons.push(`${moduleMatches} module matches`)

      // Auth/billing alignment
      if (intent.hasAuth && template.modules.includes('auth')) { score += 5; reasons.push('auth module available') }
      if (intent.hasPayments && template.modules.includes('billing')) { score += 10; reasons.push('billing module available') }
      if (intent.hasAI && template.modules.includes('ai-generator')) { score += 15; reasons.push('AI module available') }

      // Complexity alignment
      const complexityMap = { simple: 'starter', medium: 'standard', complex: 'advanced' }
      if (complexityMap[intent.complexity] === template.complexity) { score += 5; reasons.push('complexity matches') }

      return {
        templateId: template.id,
        confidence: Math.min(score / 100, 1),
        reasoning: reasons.join('; ') || 'general match',
        suggestedModules: template.modules,
      }
    })
    .sort((a, b) => b.confidence - a.confidence)
}

export function selectBestTemplate(intent: ExtractedIntent): TemplateMatch {
  const ranked = scoreTemplates(intent)
  return ranked[0] ?? {
    templateId: 'saas-starter',
    confidence: 0.3,
    reasoning: 'default fallback',
    suggestedModules: ['auth', 'users', 'dashboard'],
  }
}

// ── Module customization ──────────────────────────────────────────────────────

/** Extend template modules with additional ones inferred from intent */
export function customizeModules(baseModules: string[], intent: ExtractedIntent): string[] {
  const extra: string[] = []

  // Add modules based on detected features not already in template
  for (const feature of intent.features) {
    if (!baseModules.includes(feature) && feature in { auth: 1, users: 1, billing: 1, dashboard: 1, analytics: 1, notifications: 1, bookings: 1, 'ai-generator': 1 }) {
      extra.push(feature)
    }
  }

  // Ensure auth is always first if present
  const all = [...new Set([...baseModules, ...extra])]
  const authIdx = all.indexOf('auth')
  if (authIdx > 0) { all.splice(authIdx, 1); all.unshift('auth') }

  return all
}
