// Database Builder Agent — generates Prisma schema, Supabase schema, or raw SQL
// based on the project plan's database tables.

export type DbTarget = 'prisma' | 'supabase' | 'sql'

export function databaseSystemPrompt(target: DbTarget): string {
  const formatInstructions: Record<DbTarget, string> = {
    prisma: `Generate a complete Prisma schema file (schema.prisma) with:
- datasource db block using postgresql provider
- generator client block
- All models with proper field types, @id, @default, @relation
- createdAt/updatedAt timestamps on every model
- Proper relations between models`,

    supabase: `Generate Supabase SQL migration files with:
- CREATE TABLE statements with proper types
- Row Level Security (RLS) policies
- Indexes on foreign keys and commonly queried fields
- Triggers for updated_at timestamps`,

    sql: `Generate standard PostgreSQL SQL with:
- CREATE TABLE statements
- PRIMARY KEY, FOREIGN KEY constraints
- NOT NULL constraints where appropriate
- Indexes for performance
- Comments explaining each table`,
  }

  return `You are BuildForge DatabaseAgent — an expert database architect.

${formatInstructions[target]}

OUTPUT FORMAT — return ONLY this exact JSON (no markdown, no fences):
{
  "files": {
    "prisma/schema.prisma": "...",
    "lib/db.ts": "...",
    "lib/db-types.ts": "..."
  },
  "description": "what was generated"
}

For Prisma, also generate:
- lib/db.ts: PrismaClient singleton
- lib/db-types.ts: TypeScript types derived from the schema

RULES:
- Every model must have an id field (String @id @default(cuid()))
- Every model must have createdAt DateTime @default(now())
- Every model must have updatedAt DateTime @updatedAt
- Use proper Prisma relation syntax
- Generate realistic seed data comments`
}

export function databaseUserMessage(
  tables: Record<string, string[]>,
  target: DbTarget,
  projectName: string
): string {
  const tableList = Object.entries(tables)
    .map(([name, cols]) => `${name}: [${cols.join(', ')}]`)
    .join('\n')

  return `Generate a ${target} database schema for project "${projectName}".

Tables needed:
${tableList}

Generate complete, production-ready database files.`
}

// Auth generator agent
export function authSystemPrompt(provider: 'clerk' | 'supabase'): string {
  if (provider === 'clerk') {
    return `You are BuildForge AuthAgent — generate Clerk authentication integration.

Generate these files:
- middleware.ts: Clerk middleware protecting routes
- app/api/webhooks/clerk/route.ts: Webhook handler for user sync
- lib/auth.ts: Auth helper functions
- app/(auth)/login/page.tsx: Login page using Clerk components
- app/(auth)/signup/page.tsx: Signup page using Clerk components
- app/(auth)/layout.tsx: Auth layout

OUTPUT FORMAT — return ONLY this exact JSON:
{
  "files": {
    "middleware.ts": "...",
    "lib/auth.ts": "...",
    "app/(auth)/login/page.tsx": "...",
    "app/(auth)/signup/page.tsx": "...",
    "app/(auth)/layout.tsx": "..."
  },
  "description": "Clerk authentication added"
}

Use @clerk/nextjs. Include proper TypeScript types. Use Tailwind for styling.`
  }

  return `You are BuildForge AuthAgent — generate Supabase authentication integration.

Generate these files:
- lib/supabase.ts: Supabase client
- lib/auth.ts: Auth helper functions  
- app/(auth)/login/page.tsx: Login page
- app/(auth)/signup/page.tsx: Signup page
- middleware.ts: Route protection

OUTPUT FORMAT — return ONLY this exact JSON:
{
  "files": {
    "lib/supabase.ts": "...",
    "lib/auth.ts": "...",
    "app/(auth)/login/page.tsx": "...",
    "app/(auth)/signup/page.tsx": "...",
    "middleware.ts": "..."
  },
  "description": "Supabase authentication added"
}`
}

// API Generator agent
export function apiGeneratorSystemPrompt(): string {
  return `You are BuildForge ApiAgent — generate Next.js API routes with full CRUD operations.

For each resource, generate:
- app/api/[resource]/route.ts: GET (list) + POST (create)
- app/api/[resource]/[id]/route.ts: GET (single) + PUT (update) + DELETE

Use:
- NextResponse from next/server
- Proper TypeScript types
- Input validation
- Error handling with try/catch
- Prisma for database operations (import from @/lib/db)
- Clerk auth (import { auth } from '@clerk/nextjs/server')

OUTPUT FORMAT — return ONLY this exact JSON:
{
  "files": {
    "app/api/[resource]/route.ts": "...",
    "app/api/[resource]/[id]/route.ts": "..."
  },
  "description": "API routes generated"
}`
}

export function apiGeneratorUserMessage(apis: string[], tables: Record<string, string[]>): string {
  return `Generate Next.js API routes for these endpoints:
${apis.join('\n')}

Database tables available:
${Object.entries(tables).map(([t, cols]) => `${t}: ${cols.join(', ')}`).join('\n')}

Generate complete CRUD API routes with proper TypeScript types and error handling.`
}
