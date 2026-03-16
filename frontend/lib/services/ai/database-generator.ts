/**
 * Database Generator — generates Prisma schema and migration SQL
 * for a SaaS product based on its entities.
 */

import { aiRequest, stripFences } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { ProductIntent, ProductEntity } from './product-intent'

const DB_SYSTEM = `You are an expert database architect using Prisma ORM.
Generate a complete Prisma schema file.
Rules:
- Use PostgreSQL provider
- Include User model with Clerk integration (clerkId String @unique)
- Add proper relations between models
- Use @id @default(cuid()) for primary keys
- Add createdAt DateTime @default(now()) and updatedAt DateTime @updatedAt
- Return ONLY the schema content — no markdown, no explanation`

export async function generatePrismaSchema(
  intent: ProductIntent,
  modelId: ModelId = 'gemini_flash',
): Promise<string> {
  const entityDescriptions = intent.entities.map(e =>
    `${e.name}: fields=[${e.fields.join(', ')}], relations=[${e.relations.join(', ')}]`
  ).join('\n')

  try {
    const text = await aiRequest({
      system: DB_SYSTEM,
      prompt: `Generate a Prisma schema for:
Product: ${intent.name}
Entities:
${entityDescriptions}
Has payments: ${intent.hasPayments}

Include User model and all entity models with proper relations.`,
      modelId,
      maxOutputTokens: 3000,
      timeoutMs: 20_000,
    })
    return stripFences(text)
  } catch (err) {
    logger.warn('ai-pipeline', 'DB schema gen fallback', err instanceof Error ? err.message : String(err))
    return generateFallbackSchema(intent)
  }
}

export async function generateMigrationSQL(
  intent: ProductIntent,
  modelId: ModelId = 'gemini_flash',
): Promise<string> {
  try {
    const text = await aiRequest({
      system: `You are a PostgreSQL expert. Generate CREATE TABLE SQL migration statements.
Return ONLY valid SQL — no markdown, no explanation.`,
      prompt: `Generate PostgreSQL migration SQL for:
${intent.entities.map(e => `Table: ${e.name.toLowerCase()}s, columns: id, user_id, ${e.fields.join(', ')}, created_at, updated_at`).join('\n')}`,
      modelId,
      maxOutputTokens: 2000,
      timeoutMs: 15_000,
    })
    return stripFences(text)
  } catch {
    return generateFallbackSQL(intent)
  }
}

export async function generateAllDatabaseFiles(
  intent: ProductIntent,
  modelId: ModelId = 'gemini_flash',
): Promise<Record<string, string>> {
  const files: Record<string, string> = {}

  logger.info('ai-pipeline', 'Generating database schema')
  files['prisma/schema.prisma'] = await generatePrismaSchema(intent, modelId)
  files['lib/db.ts'] = generateDbClient()
  files['prisma/migrations/001_init.sql'] = await generateMigrationSQL(intent, modelId)

  // Server actions for each entity
  for (const entity of intent.entities) {
    const slug = entity.name.toLowerCase() + 's'
    files[`lib/actions/${slug}.ts`] = generateServerActions(entity)
    logger.info('ai-pipeline', `DB: generated actions for ${entity.name}`)
  }

  return files
}

// ── Fallback generators ───────────────────────────────────────────────────────

function generateFallbackSchema(intent: ProductIntent): string {
  const models = intent.entities.map(e => generateModel(e)).join('\n\n')

  return `// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
${intent.entities.map(e => `  ${e.name.toLowerCase()}s ${e.name}[]`).join('\n')}
${intent.hasPayments ? `  stripeCustomerId String?
  subscriptionId   String?
  plan             String   @default("free")` : ''}
}

${models}
`
}

function generateModel(entity: ProductEntity): string {
  const fieldLines = entity.fields
    .filter(f => f !== 'id' && f !== 'createdAt' && f !== 'updatedAt')
    .map(f => {
      if (f === 'email') return `  ${f}     String`
      if (f === 'price' || f === 'amount') return `  ${f}     Float?`
      if (f === 'status') return `  ${f}     String  @default("active")`
      if (f === 'description' || f === 'notes') return `  ${f}     String?`
      return `  ${f}     String`
    })
    .join('\n')

  return `model ${entity.name} {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
${fieldLines}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}`
}

function generateDbClient(): string {
  return `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
`
}

function generateServerActions(entity: ProductEntity): string {
  const model = entity.name.toLowerCase()
  const slug = model + 's'

  return `'use server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function get${entity.name}s() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw new Error('User not found')
  return (db as any).${model}.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
}

export async function create${entity.name}(data: Record<string, string>) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw new Error('User not found')
  const item = await (db as any).${model}.create({ data: { ...data, userId: user.id } })
  revalidatePath('/dashboard/${slug}')
  return item
}

export async function delete${entity.name}(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw new Error('User not found')
  await (db as any).${model}.deleteMany({ where: { id, userId: user.id } })
  revalidatePath('/dashboard/${slug}')
}
`
}

function generateFallbackSQL(intent: ProductIntent): string {
  const tables = intent.entities.map(e => {
    const cols = e.fields
      .filter(f => f !== 'id' && f !== 'createdAt' && f !== 'updatedAt')
      .map(f => `  ${f} TEXT`)
      .join(',\n')
    return `CREATE TABLE IF NOT EXISTS ${e.name.toLowerCase()}s (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
${cols},
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`
  }).join('\n\n')

  return `-- Migration: 001_init
-- Generated by BuildForge AI

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

${tables}
`
}
