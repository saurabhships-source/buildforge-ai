// AI Project Planner
import { aiJsonRequest } from '@/lib/core/ai-request'
import type { ModelId } from '@/lib/ai-engine/model-router'

export type AppType = 'saas' | 'website' | 'dashboard' | 'tool' | 'ai-app' | 'ecommerce' | 'booking' | 'restaurant' | 'portfolio' | 'blog'

export interface ProjectPage {
  name: string
  route: string
  description: string
}

export interface ProjectPlan {
  name: string
  description: string
  appType: AppType
  techStack: string[]
  pages: ProjectPage[]
  components: string[]
  features: string[]
  colorScheme: string
  targetAudience: string
}

const PLANNER_SYSTEM = `You are an expert software architect. Convert user prompts into structured project plans.
Always return valid JSON matching the ProjectPlan schema exactly. No markdown, no fences, no extra text.

Schema:
{
  "name": "Brand name for the project",
  "description": "One sentence description",
  "appType": "saas|website|dashboard|tool|ai-app|ecommerce|booking|restaurant|portfolio|blog",
  "techStack": ["html", "tailwind", "javascript"],
  "pages": [{ "name": "string", "route": "/", "description": "string" }],
  "components": ["Navbar", "Hero", "Footer"],
  "features": ["feature1", "feature2"],
  "colorScheme": "dark|light|colorful",
  "targetAudience": "who this is for"
}`

export async function generateProjectPlan(
  prompt: string,
  modelId: ModelId = 'gemini_flash',
): Promise<ProjectPlan> {
  return aiJsonRequest<ProjectPlan>(
    {
      system: PLANNER_SYSTEM,
      prompt: `Create a project plan for: "${prompt}"`,
      modelId,
      maxOutputTokens: 2000,
      timeoutMs: 20_000,
    },
    () => buildHeuristicPlan(prompt),
  )
}

function buildHeuristicPlan(prompt: string): ProjectPlan {
  const p = prompt.toLowerCase()
  const appType: AppType =
    /restaurant|cafe|food|menu/.test(p) ? 'restaurant' :
    /portfolio|personal|showcase/.test(p) ? 'portfolio' :
    /shop|store|ecommerce|cart/.test(p) ? 'ecommerce' :
    /blog|article|post/.test(p) ? 'blog' :
    /booking|appointment|schedule/.test(p) ? 'booking' :
    /dashboard|admin|analytics/.test(p) ? 'dashboard' :
    /saas|platform|app/.test(p) ? 'saas' :
    /tool|calculator|generator/.test(p) ? 'tool' :
    /ai|chat|assistant/.test(p) ? 'ai-app' :
    'website'

  const pageMap: Record<AppType, ProjectPage[]> = {
    website: [{ name: 'Home', route: '/', description: 'Landing page with hero and features' }],
    saas: [
      { name: 'Home', route: '/', description: 'Marketing landing page' },
      { name: 'Dashboard', route: '/dashboard', description: 'Main app dashboard' },
      { name: 'Pricing', route: '/pricing', description: 'Pricing plans' },
    ],
    dashboard: [
      { name: 'Dashboard', route: '/', description: 'Main analytics dashboard' },
      { name: 'Reports', route: '/reports', description: 'Detailed reports' },
    ],
    tool: [{ name: 'Tool', route: '/', description: 'Main tool interface' }],
    'ai-app': [
      { name: 'Chat', route: '/', description: 'AI chat interface' },
      { name: 'History', route: '/history', description: 'Conversation history' },
    ],
    ecommerce: [
      { name: 'Home', route: '/', description: 'Store homepage' },
      { name: 'Products', route: '/products', description: 'Product catalog' },
      { name: 'Cart', route: '/cart', description: 'Shopping cart' },
    ],
    booking: [
      { name: 'Home', route: '/', description: 'Service overview' },
      { name: 'Book', route: '/book', description: 'Booking form' },
    ],
    restaurant: [
      { name: 'Home', route: '/', description: 'Restaurant homepage' },
      { name: 'Menu', route: '/menu', description: 'Full menu' },
      { name: 'Reserve', route: '/reserve', description: 'Table reservation' },
    ],
    portfolio: [
      { name: 'Home', route: '/', description: 'Portfolio homepage' },
      { name: 'Projects', route: '/projects', description: 'Project showcase' },
      { name: 'Contact', route: '/contact', description: 'Contact form' },
    ],
    blog: [
      { name: 'Home', route: '/', description: 'Blog homepage' },
      { name: 'Post', route: '/post/[slug]', description: 'Article page' },
    ],
  }

  const words = prompt.split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1))
  const name = words.join(' ')

  return {
    name,
    description: prompt.slice(0, 120),
    appType,
    techStack: ['html', 'tailwind', 'javascript'],
    pages: pageMap[appType] ?? pageMap.website,
    components: ['Navbar', 'Hero', 'Footer'],
    features: ['responsive design', 'smooth animations', 'mobile menu'],
    colorScheme: 'dark',
    targetAudience: 'general users',
  }
}
