// Stage 1 — Intent Analyzer
import { aiJsonRequest } from '@/lib/core/ai-request'
import type { ModelId } from '@/lib/ai-engine/model-router'

export type IntentCategory =
  | 'saas' | 'website' | 'dashboard' | 'tool' | 'ai-app'
  | 'ecommerce' | 'booking' | 'restaurant' | 'portfolio' | 'blog'

export type UIStyle = 'modern' | 'minimal' | 'corporate' | 'bold' | 'elegant' | 'playful'
export type Complexity = 'simple' | 'medium' | 'advanced'

export interface AnalyzedIntent {
  category: IntentCategory
  domain: string
  uiStyle: UIStyle
  features: string[]
  complexity: Complexity
  hasAuth: boolean
  hasPayments: boolean
  hasDatabase: boolean
  targetAudience: string
  colorHint: string
}

const INTENT_SYSTEM = `You are an intent analyzer for an AI app builder. Convert user prompts into structured JSON.

Return ONLY valid JSON matching this schema exactly:
{
  "category": "saas|website|dashboard|tool|ai-app|ecommerce|booking|restaurant|portfolio|blog",
  "domain": "fitness|finance|healthcare|education|food|travel|retail|general|...",
  "uiStyle": "modern|minimal|corporate|bold|elegant|playful",
  "features": ["auth", "payments", "dashboard", "analytics", "search", "notifications"],
  "complexity": "simple|medium|advanced",
  "hasAuth": true,
  "hasPayments": false,
  "hasDatabase": true,
  "targetAudience": "who this is for",
  "colorHint": "dark|light|colorful|neutral"
}

No markdown, no explanation, just JSON.`

export async function analyzeIntent(
  prompt: string,
  modelId: ModelId = 'gemini_flash',
): Promise<AnalyzedIntent> {
  return aiJsonRequest<AnalyzedIntent>(
    {
      system: INTENT_SYSTEM,
      prompt: `Analyze this prompt: "${prompt}"`,
      modelId,
      maxOutputTokens: 500,
      timeoutMs: 10_000,
    },
    () => inferIntentHeuristically(prompt),
  )
}

function inferIntentHeuristically(prompt: string): AnalyzedIntent {
  const p = prompt.toLowerCase()

  const category: IntentCategory =
    /restaurant|cafe|food|menu/.test(p) ? 'restaurant' :
    /portfolio|personal|showcase/.test(p) ? 'portfolio' :
    /shop|store|ecommerce|cart/.test(p) ? 'ecommerce' :
    /blog|article|post/.test(p) ? 'blog' :
    /booking|appointment|schedule/.test(p) ? 'booking' :
    /dashboard|admin|analytics/.test(p) ? 'dashboard' :
    /saas|platform|subscription/.test(p) ? 'saas' :
    /tool|calculator|generator/.test(p) ? 'tool' :
    /ai|chat|assistant|llm/.test(p) ? 'ai-app' :
    'website'

  const domain =
    /fitness|gym|workout/.test(p) ? 'fitness' :
    /finance|bank|invest/.test(p) ? 'finance' :
    /health|medical|doctor/.test(p) ? 'healthcare' :
    /education|school|course/.test(p) ? 'education' :
    /food|restaurant|recipe/.test(p) ? 'food' :
    /travel|hotel|flight/.test(p) ? 'travel' :
    'general'

  const uiStyle: UIStyle =
    /minimal|clean|simple/.test(p) ? 'minimal' :
    /corporate|professional|business/.test(p) ? 'corporate' :
    /bold|strong|vivid/.test(p) ? 'bold' :
    /elegant|luxury|premium/.test(p) ? 'elegant' :
    /playful|fun|colorful/.test(p) ? 'playful' :
    'modern'

  const features: string[] = []
  if (/login|auth|signup|user/.test(p)) features.push('auth')
  if (/payment|stripe|billing|subscription/.test(p)) features.push('payments')
  if (/dashboard|analytics|chart/.test(p)) features.push('dashboard')
  if (/search|filter/.test(p)) features.push('search')
  if (/notification|email|alert/.test(p)) features.push('notifications')
  if (/api|endpoint|route/.test(p)) features.push('api')

  const hasAuth = features.includes('auth') || /user|account|member/.test(p)
  const hasPayments = features.includes('payments')
  const hasDatabase = hasAuth || hasPayments || /database|store|save/.test(p)

  const complexity: Complexity =
    features.length >= 4 ? 'advanced' :
    features.length >= 2 ? 'medium' :
    'simple'

  return {
    category,
    domain,
    uiStyle,
    features,
    complexity,
    hasAuth,
    hasPayments,
    hasDatabase,
    targetAudience: 'general users',
    colorHint: /dark|night|black/.test(p) ? 'dark' : 'light',
  }
}
