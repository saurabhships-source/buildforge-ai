// Database Schema Generator — Stage 2 of the multi-stage AI pipeline
// Takes the blueprint and generates a database schema

import { generateCode } from '../router'
import type { AppBlueprint } from './blueprint'

export interface DatabaseSchema {
  sql: string
  prisma: string
  tables: string[]
}

const DATABASE_SYSTEM = `You are a senior database architect.
Given an application blueprint, generate a clean database schema.

Return ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "sql": "Complete SQL CREATE TABLE statements",
  "prisma": "Complete Prisma schema model definitions",
  "tables": ["list of table names"]
}`

export async function generateDatabaseSchema(
  prompt: string,
  blueprint: AppBlueprint
): Promise<DatabaseSchema> {
  // Skip DB generation if no tables needed
  if (!blueprint.databaseTables || blueprint.databaseTables.length === 0) {
    return { sql: '', prisma: '', tables: [] }
  }

  const userMsg = `Generate a database schema for this application:

App: ${blueprint.appName}
Type: ${blueprint.appType}
Description: ${blueprint.description}
Required tables: ${blueprint.databaseTables.join(', ')}
Features: ${blueprint.features.join(', ')}

Return the schema JSON.`

  try {
    const result = await generateCode(userMsg, {
      system: DATABASE_SYSTEM,
      maxTokens: 3000,
    })

    const text = result.text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return buildFallbackSchema(blueprint)

    const parsed = JSON.parse(jsonMatch[0]) as Partial<DatabaseSchema>
    return {
      sql: parsed.sql ?? buildFallbackSQL(blueprint),
      prisma: parsed.prisma ?? '',
      tables: parsed.tables ?? blueprint.databaseTables,
    }
  } catch {
    return buildFallbackSchema(blueprint)
  }
}

function buildFallbackSQL(blueprint: AppBlueprint): string {
  const tables = blueprint.databaseTables
  const lines: string[] = []

  for (const table of tables) {
    lines.push(`CREATE TABLE ${table} (`)
    lines.push(`  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),`)
    lines.push(`  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,`)
    lines.push(`  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
    if (table === 'users') {
      lines.push(`,  email VARCHAR(255) UNIQUE NOT NULL,`)
      lines.push(`  name VARCHAR(255),`)
      lines.push(`  password_hash VARCHAR(255),`)
      lines.push(`  role VARCHAR(50) DEFAULT 'user'`)
    }
    lines.push(`);\n`)
  }

  return lines.join('\n')
}

function buildFallbackSchema(blueprint: AppBlueprint): DatabaseSchema {
  return {
    sql: buildFallbackSQL(blueprint),
    prisma: '',
    tables: blueprint.databaseTables,
  }
}
