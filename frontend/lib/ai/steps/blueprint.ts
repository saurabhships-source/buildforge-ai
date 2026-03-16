// Blueprint Planner — Stage 1 of the multi-stage AI pipeline
// Analyzes the user's prompt and produces a structured application plan

import { generateCode } from '../router'

export interface AppBlueprint {
  appType: string
  appName: string
  description: string
  pages: string[]
  databaseTables: string[]
  apiRoutes: string[]
  features: string[]
  colorScheme: string
  techStack: string[]
}

const BLUEPRINT_SYSTEM = `You are a senior software architect at a top-tier product studio.
Your job is to analyze a user's app idea and produce a precise, structured application blueprint.

Return ONLY valid JSON — no markdown, no code fences, no extra text.
The JSON must match this exact shape:
{
  "appType": "saas|dashboard|ecommerce|crm|booking|tool|ai_app|website|portfolio|blog",
  "appName": "Short brand name for the app",
  "description": "One sentence describing what the app does",
  "pages": ["page names the app needs, e.g. index.html, pages/dashboard.html"],
  "databaseTables": ["table names needed, e.g. users, products, orders"],
  "apiRoutes": ["REST routes needed, e.g. GET /api/users, POST /api/auth/login"],
  "features": ["key features the app must have"],
  "colorScheme": "primary color direction, e.g. indigo/violet dark theme",
  "techStack": ["HTML5", "Tailwind CSS", "Vanilla JS"]
}`

export async function generateBlueprint(prompt: string): Promise<AppBlueprint> {
  const userMsg = `Analyze this app idea and return the blueprint JSON:\n\n"${prompt}"`

  const result = await generateCode(userMsg, {
    system: BLUEPRINT_SYSTEM,
    maxTokens: 2000,
  })

  // Try to extract JSON from the response
  const text = result.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.warn('[blueprint] No JSON found in response, using fallback')
    return buildFallbackBlueprint(prompt)
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<AppBlueprint>
    return {
      appType: parsed.appType ?? 'website',
      appName: parsed.appName ?? 'MyApp',
      description: parsed.description ?? prompt.slice(0, 100),
      pages: parsed.pages ?? ['index.html'],
      databaseTables: parsed.databaseTables ?? [],
      apiRoutes: parsed.apiRoutes ?? [],
      features: parsed.features ?? [],
      colorScheme: parsed.colorScheme ?? 'indigo/violet dark theme',
      techStack: parsed.techStack ?? ['HTML5', 'Tailwind CSS', 'Vanilla JS'],
    }
  } catch {
    console.warn('[blueprint] JSON parse failed, using fallback')
    return buildFallbackBlueprint(prompt)
  }
}

function buildFallbackBlueprint(prompt: string): AppBlueprint {
  const p = prompt.toLowerCase()
  const isSaaS = /saas|platform|subscription/.test(p)
  const isDashboard = /dashboard|admin|analytics/.test(p)
  const isEcommerce = /shop|store|ecommerce|product/.test(p)

  if (isSaaS) {
    return {
      appType: 'saas',
      appName: 'AppForge',
      description: prompt.slice(0, 100),
      pages: ['index.html', 'pages/login.html', 'pages/signup.html', 'pages/dashboard.html', 'pages/settings.html'],
      databaseTables: ['users', 'subscriptions', 'projects'],
      apiRoutes: ['POST /api/auth/login', 'POST /api/auth/signup', 'GET /api/projects', 'POST /api/projects'],
      features: ['Authentication', 'Dashboard', 'Settings', 'Billing'],
      colorScheme: 'indigo/violet dark theme',
      techStack: ['HTML5', 'Tailwind CSS', 'Vanilla JS'],
    }
  }
  if (isDashboard) {
    return {
      appType: 'dashboard',
      appName: 'AdminPanel',
      description: prompt.slice(0, 100),
      pages: ['pages/dashboard.html', 'pages/analytics.html', 'pages/users.html', 'pages/settings.html'],
      databaseTables: ['users', 'events', 'reports'],
      apiRoutes: ['GET /api/users', 'GET /api/analytics', 'GET /api/reports'],
      features: ['KPI cards', 'Charts', 'Data tables', 'User management'],
      colorScheme: 'slate dark theme with blue accents',
      techStack: ['HTML5', 'Tailwind CSS', 'Vanilla JS'],
    }
  }
  if (isEcommerce) {
    return {
      appType: 'ecommerce',
      appName: 'ShopForge',
      description: prompt.slice(0, 100),
      pages: ['index.html', 'pages/products.html', 'pages/cart.html', 'pages/checkout.html'],
      databaseTables: ['products', 'orders', 'users', 'cart_items'],
      apiRoutes: ['GET /api/products', 'POST /api/cart', 'POST /api/orders'],
      features: ['Product listing', 'Cart', 'Checkout', 'Order history'],
      colorScheme: 'emerald/teal light theme',
      techStack: ['HTML5', 'Tailwind CSS', 'Vanilla JS'],
    }
  }
  return {
    appType: 'website',
    appName: 'WebForge',
    description: prompt.slice(0, 100),
    pages: ['index.html'],
    databaseTables: [],
    apiRoutes: [],
    features: ['Hero section', 'Features', 'Pricing', 'Contact'],
    colorScheme: 'indigo/violet dark theme',
    techStack: ['HTML5', 'Tailwind CSS', 'Vanilla JS'],
  }
}
