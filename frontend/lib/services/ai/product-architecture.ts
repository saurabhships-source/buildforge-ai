/**
 * Product Architecture — defines the technical architecture for a SaaS product.
 * Determines tech choices, folder layout, and integration points.
 */

import type { ProductIntent } from './product-intent'
import type { ProductBlueprint } from './product-planner'

export interface ArchLayer {
  name: string
  technology: string
  description: string
  files: string[]
}

export interface ProductArchitecture {
  frontend: ArchLayer
  backend: ArchLayer
  database: ArchLayer
  auth: ArchLayer
  integrations: string[]
  deployTarget: 'vercel' | 'netlify' | 'railway'
  envTemplate: Record<string, string>
}

export function buildProductArchitecture(
  intent: ProductIntent,
  blueprint: ProductBlueprint,
): ProductArchitecture {
  const entityNames = intent.entities.map(e => e.name.toLowerCase() + 's')

  const frontendFiles = [
    'app/layout.tsx',
    'app/page.tsx',
    'app/dashboard/page.tsx',
    'app/dashboard/layout.tsx',
    ...blueprint.pages
      .filter(p => p.route !== '/' && p.route !== '/dashboard')
      .map(p => `app${p.route}/page.tsx`),
    ...blueprint.components.map(c => `components/${toKebab(c.name)}.tsx`),
    'components/ui/button.tsx',
    'components/ui/input.tsx',
    'components/ui/table.tsx',
    'components/ui/card.tsx',
  ]

  const backendFiles = [
    ...entityNames.map(e => `app/api/${e}/route.ts`),
    'app/api/user/me/route.ts',
    'middleware.ts',
  ]

  const dbFiles = [
    'prisma/schema.prisma',
    'lib/db.ts',
    ...entityNames.map(e => `lib/actions/${e}.ts`),
  ]

  const authFiles = [
    'middleware.ts',
    'app/(auth)/sign-in/[[...sign-in]]/page.tsx',
    'app/(auth)/sign-up/[[...sign-up]]/page.tsx',
  ]

  const envTemplate: Record<string, string> = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/dbname',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_...',
    CLERK_SECRET_KEY: 'sk_test_...',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  }
  if (intent.hasPayments) {
    envTemplate.STRIPE_SECRET_KEY = 'sk_test_...'
    envTemplate.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_...'
    envTemplate.STRIPE_WEBHOOK_SECRET = 'whsec_...'
  }

  return {
    frontend: {
      name: 'Frontend',
      technology: 'Next.js 14 App Router + Tailwind CSS',
      description: 'React server components with Tailwind styling',
      files: frontendFiles,
    },
    backend: {
      name: 'Backend',
      technology: 'Next.js API Routes',
      description: 'REST API routes with Clerk auth middleware',
      files: backendFiles,
    },
    database: {
      name: 'Database',
      technology: intent.database === 'supabase' ? 'Supabase (PostgreSQL)' : 'PostgreSQL via Prisma',
      description: 'Relational database with Prisma ORM',
      files: dbFiles,
    },
    auth: {
      name: 'Authentication',
      technology: intent.authStrategy === 'clerk' ? 'Clerk' : 'NextAuth.js',
      description: 'Managed auth with JWT sessions',
      files: authFiles,
    },
    integrations: [
      'Frontend → Backend: fetch() API calls with auth headers',
      'Backend → Database: Prisma Client queries',
      'Auth → Middleware: Clerk middleware on protected routes',
      ...(intent.hasPayments ? ['Payments: Stripe Checkout + webhooks'] : []),
    ],
    deployTarget: 'vercel',
    envTemplate,
  }
}

function toKebab(name: string): string {
  return name.replace(/([A-Z])/g, (m, l, i) => (i === 0 ? l.toLowerCase() : `-${l.toLowerCase()}`))
}
