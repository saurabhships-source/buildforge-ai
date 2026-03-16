// Startup Generator — produces a complete SaaS startup stack from a single prompt
import type { ProjectFiles } from '../tool-adapters/base-adapter'

export interface StartupSpec {
  name: string
  tagline: string
  description: string
  targetAudience: string
  coreFeatures: string[]
  pricingTiers: { name: string; price: string; features: string[] }[]
  techStack: string
}

export function startupGeneratorSystemPrompt(spec?: Partial<StartupSpec>): string {
  return `You are StartupGenerator, an expert at building complete SaaS startup stacks.

Given a startup idea, generate a COMPLETE production-ready SaaS application including:

1. Landing page (index.html) with:
   - Hero section with value proposition
   - Features section (6 features minimum)
   - Pricing section (3 tiers: Free, Pro, Enterprise)
   - Testimonials section
   - CTA section
   - Footer with links

2. App dashboard (app/dashboard.html) with:
   - Sidebar navigation
   - KPI cards
   - Data table
   - Charts placeholder

3. Authentication pages:
   - app/login.html
   - app/signup.html

4. SEO assets:
   - sitemap.xml
   - robots.txt

5. Deployment configs:
   - vercel.json
   - netlify.toml

6. Documentation:
   - README.md with setup instructions

${spec ? `\nStartup context:\n${JSON.stringify(spec, null, 2)}` : ''}

CRITICAL OUTPUT FORMAT — return ONLY this JSON:
{
  "files": {
    "index.html": "complete landing page",
    "app/dashboard.html": "complete dashboard",
    "app/login.html": "login page",
    "app/signup.html": "signup page",
    "sitemap.xml": "...",
    "robots.txt": "...",
    "vercel.json": "...",
    "netlify.toml": "...",
    "README.md": "..."
  },
  "entrypoint": "index.html",
  "description": "Complete SaaS startup stack generated"
}

Use Tailwind CSS CDN. Make it look professional and modern.`
}

// Parse startup spec from a natural language prompt
export function parseStartupPrompt(prompt: string): Partial<StartupSpec> {
  const lower = prompt.toLowerCase()
  const techStack = lower.includes('react') ? 'React' :
    lower.includes('vue') ? 'Vue' :
    lower.includes('next') ? 'Next.js' : 'Vanilla JS + Tailwind'

  return {
    description: prompt,
    techStack,
    coreFeatures: ['User authentication', 'Dashboard', 'Billing', 'API access', 'Analytics', 'Settings'],
    pricingTiers: [
      { name: 'Free', price: '$0/mo', features: ['5 projects', 'Basic features', 'Community support'] },
      { name: 'Pro', price: '$29/mo', features: ['Unlimited projects', 'All features', 'Priority support'] },
      { name: 'Enterprise', price: '$99/mo', features: ['Custom limits', 'SSO', 'Dedicated support'] },
    ],
  }
}
