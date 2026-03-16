// Backend Generator — Stage 3 of the multi-stage AI pipeline
// Generates API route files based on the blueprint

import { generateCode } from '../router'
import { parseAIOutput } from '../file-parser'
import type { AppBlueprint } from './blueprint'
import type { DatabaseSchema } from './database'

const BACKEND_SYSTEM = `You are a senior backend developer.
Generate clean, well-commented API route files for a web application.

Output format — use exactly this structure for each file:

FILE: api/auth.js
// complete file content

FILE: api/users.js
// complete file content

Output ONLY the FILE blocks. No explanations, no markdown fences.`

export async function generateBackend(
  prompt: string,
  blueprint: AppBlueprint,
  database: DatabaseSchema
): Promise<Record<string, string>> {
  // Skip if no API routes needed
  if (!blueprint.apiRoutes || blueprint.apiRoutes.length === 0) {
    return {}
  }

  const userMsg = `Generate backend API route files for this application:

App: ${blueprint.appName}
Type: ${blueprint.appType}
Description: ${blueprint.description}

API Routes needed:
${blueprint.apiRoutes.map(r => `- ${r}`).join('\n')}

Database tables: ${blueprint.databaseTables.join(', ')}
Features: ${blueprint.features.join(', ')}

Requirements:
- Each file should handle related routes (group auth routes in api/auth.js, etc.)
- Include proper error handling and response formatting
- Add JSDoc comments explaining each endpoint
- Use fetch-compatible response format (JSON)
- Include mock data where appropriate for frontend demo

Output FILE: blocks for each API file.`

  try {
    const result = await generateCode(userMsg, {
      system: BACKEND_SYSTEM,
      maxTokens: 6000,
    })

    const files = parseAIOutput(result.text)
    if (files && Object.keys(files).length > 0) {
      return files
    }
  } catch (err) {
    console.warn('[backend-generator] AI failed, using fallback:', err)
  }

  return buildFallbackBackend(blueprint)
}

function buildFallbackBackend(blueprint: AppBlueprint): Record<string, string> {
  const files: Record<string, string> = {}

  // Group routes by resource
  const hasAuth = blueprint.apiRoutes.some(r => r.includes('auth'))
  const resources = new Set<string>()

  for (const route of blueprint.apiRoutes) {
    const match = route.match(/\/api\/([a-z-]+)/)
    if (match && match[1] !== 'auth') resources.add(match[1])
  }

  if (hasAuth) {
    files['api/auth.js'] = `/**
 * Authentication API Routes
 * Handles login, signup, and session management
 */

// POST /api/auth/login
async function login(email, password) {
  // Validate credentials
  if (!email || !password) {
    return { error: 'Email and password are required', status: 400 }
  }
  // Mock successful login
  return {
    user: { id: '1', email, name: 'User', role: 'user' },
    token: 'mock-jwt-token-' + Date.now(),
    status: 200
  }
}

// POST /api/auth/signup
async function signup(email, password, name) {
  if (!email || !password || !name) {
    return { error: 'All fields are required', status: 400 }
  }
  return {
    user: { id: Date.now().toString(), email, name, role: 'user' },
    token: 'mock-jwt-token-' + Date.now(),
    status: 201
  }
}

// POST /api/auth/logout
function logout() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  return { success: true }
}

// Auth state helpers
const auth = {
  login, signup, logout,
  getUser: () => JSON.parse(localStorage.getItem('auth_user') || 'null'),
  getToken: () => localStorage.getItem('auth_token'),
  isLoggedIn: () => !!localStorage.getItem('auth_token'),
}

export default auth
`
  }

  for (const resource of resources) {
    files[`api/${resource}.js`] = `/**
 * ${resource.charAt(0).toUpperCase() + resource.slice(1)} API Routes
 */

// Mock data store
let ${resource} = []
let nextId = 1

// GET /api/${resource}
function getAll(filters = {}) {
  let results = [...${resource}]
  if (filters.search) {
    results = results.filter(item =>
      JSON.stringify(item).toLowerCase().includes(filters.search.toLowerCase())
    )
  }
  return { data: results, total: results.length, status: 200 }
}

// GET /api/${resource}/:id
function getById(id) {
  const item = ${resource}.find(i => i.id === id)
  if (!item) return { error: 'Not found', status: 404 }
  return { data: item, status: 200 }
}

// POST /api/${resource}
function create(data) {
  const item = { id: String(nextId++), ...data, createdAt: new Date().toISOString() }
  ${resource}.push(item)
  return { data: item, status: 201 }
}

// PUT /api/${resource}/:id
function update(id, data) {
  const idx = ${resource}.findIndex(i => i.id === id)
  if (idx === -1) return { error: 'Not found', status: 404 }
  ${resource}[idx] = { ...${resource}[idx], ...data, updatedAt: new Date().toISOString() }
  return { data: ${resource}[idx], status: 200 }
}

// DELETE /api/${resource}/:id
function remove(id) {
  const idx = ${resource}.findIndex(i => i.id === id)
  if (idx === -1) return { error: 'Not found', status: 404 }
  ${resource}.splice(idx, 1)
  return { success: true, status: 200 }
}

export default { getAll, getById, create, update, remove }
`
  }

  return files
}
