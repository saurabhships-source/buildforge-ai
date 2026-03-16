// Feature 11 — AI Database Generator
// Generates Supabase schema, API routes, and CRUD UI from a prompt

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface TableColumn {
  name: string
  type: 'text' | 'integer' | 'boolean' | 'timestamp' | 'uuid' | 'jsonb' | 'numeric'
  nullable: boolean
  default?: string
  primaryKey?: boolean
  references?: string
}

export interface DatabaseTable {
  name: string
  columns: TableColumn[]
  description: string
}

export interface DatabaseSchema {
  tables: DatabaseTable[]
  sql: string
  description: string
}

export interface DatabaseGenResult {
  schema: DatabaseSchema
  files: Record<string, string>
  summary: string
}

const DB_SYSTEM = `You are a database architect. Generate a Supabase PostgreSQL schema and CRUD API routes.

Return JSON:
{
  "schema": {
    "tables": [
      {
        "name": "table_name",
        "description": "what this table stores",
        "columns": [
          { "name": "id", "type": "uuid", "nullable": false, "primaryKey": true, "default": "gen_random_uuid()" },
          { "name": "created_at", "type": "timestamp", "nullable": false, "default": "now()" }
        ]
      }
    ],
    "sql": "CREATE TABLE ... complete SQL",
    "description": "schema overview"
  },
  "files": {
    "api/[table]/route.ts": "complete Next.js API route with GET/POST/PUT/DELETE",
    "components/[Table]Table.tsx": "complete CRUD UI component with Tailwind"
  },
  "summary": "what was generated"
}

Rules:
- Always include id (uuid) and created_at (timestamp) columns
- Generate proper foreign keys for relationships
- API routes use Next.js App Router format
- CRUD UI uses Tailwind CSS, no external UI libraries
- No markdown fences in response`

export async function generateDatabase(
  prompt: string,
  projectName: string,
  modelId: ModelId = 'gemini_flash',
): Promise<DatabaseGenResult> {
  try {
    const { text } = await generateText({
      model: getModel(modelId),
      system: DB_SYSTEM,
      prompt: `Generate a database schema for: "${prompt}"\nProject: ${projectName}`,
      maxOutputTokens: 8000,
    })

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned) as DatabaseGenResult
    return result
  } catch (err) {
    console.warn('[database] AI failed:', err)
    // Heuristic fallback
    return buildHeuristicDatabase(prompt, projectName)
  }
}

function buildHeuristicDatabase(prompt: string, projectName: string): DatabaseGenResult {
  const tableName = prompt.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 30) || 'items'
  const singular = tableName.replace(/s$/, '')

  const sql = `-- ${projectName} Database Schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE ${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_${tableName}_status ON ${tableName}(status);
CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ${tableName}_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();`

  const apiRoute = `import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const from = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('${tableName}')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, limit })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('${tableName}').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await supabase.from('${tableName}').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase.from('${tableName}').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}`

  const crudUI = `'use client'
import { useState, useEffect } from 'react'

interface ${singular.charAt(0).toUpperCase() + singular.slice(1)} {
  id: string
  name: string
  description?: string
  status: string
  created_at: string
}

export function ${singular.charAt(0).toUpperCase() + singular.slice(1)}Table() {
  const [items, setItems] = useState<${singular.charAt(0).toUpperCase() + singular.slice(1)}[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/${tableName}')
    const json = await res.json()
    setItems(json.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/${tableName}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ name: '', description: '' })
    setSubmitting(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await fetch(\`/api/${tableName}?id=\${id}\`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold capitalize">${tableName}</h2>
      <form onSubmit={handleCreate} className="flex gap-3">
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="Name" required className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Description" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </form>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No items yet. Add one above.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="px-4 py-3" />
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.description ?? '—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">{item.status}</span></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}`

  return {
    schema: {
      tables: [{
        name: tableName,
        description: `Stores ${prompt} data`,
        columns: [
          { name: 'id', type: 'uuid', nullable: false, primaryKey: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'text', nullable: false },
          { name: 'description', type: 'text', nullable: true },
          { name: 'status', type: 'text', nullable: false, default: "'active'" },
          { name: 'metadata', type: 'jsonb', nullable: false, default: "'{}'" },
          { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' },
        ],
      }],
      sql,
      description: `Schema for ${prompt}`,
    },
    files: {
      [`app/api/${tableName}/route.ts`]: apiRoute,
      [`components/${singular.charAt(0).toUpperCase() + singular.slice(1)}Table.tsx`]: crudUI,
    },
    summary: `Generated ${tableName} table with CRUD API and UI`,
  }
}
