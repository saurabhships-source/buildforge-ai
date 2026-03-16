/**
 * Integration Agent — connects frontend → APIs → database and configures auth.
 * Generates glue code: API client, auth config, env template, globals.css.
 */

import { logger } from '@/lib/core/logger'
import type { ProductIntent } from './product-intent'
import type { ProductArchitecture } from './product-architecture'

export interface IntegrationResult {
  files: Record<string, string>
  envTemplate: string
  integrationNotes: string[]
}

export function runIntegrationAgent(
  intent: ProductIntent,
  architecture: ProductArchitecture,
): IntegrationResult {
  logger.info('ai-pipeline', 'Running integration agent', intent.name)

  const files: Record<string, string> = {}
  const notes: string[] = []

  // ── API client (typed fetch wrapper) ─────────────────────────────────────
  files['lib/api-client.ts'] = generateApiClient(intent)
  notes.push('Generated typed API client for all entities')

  // ── Global CSS ────────────────────────────────────────────────────────────
  files['app/globals.css'] = generateGlobalCss()
  notes.push('Generated globals.css with Tailwind directives')

  // ── next.config.ts ────────────────────────────────────────────────────────
  files['next.config.ts'] = generateNextConfig()
  notes.push('Generated next.config.ts')

  // ── package.json ──────────────────────────────────────────────────────────
  files['package.json'] = generatePackageJson(intent)
  notes.push('Generated package.json with all dependencies')

  // ── tsconfig ──────────────────────────────────────────────────────────────
  files['tsconfig.json'] = generateTsConfig()
  notes.push('Generated tsconfig.json')

  // ── .env.example ─────────────────────────────────────────────────────────
  const envTemplate = generateEnvTemplate(intent, architecture)
  files['.env.example'] = envTemplate
  notes.push('Generated .env.example with all required variables')

  // ── README ────────────────────────────────────────────────────────────────
  files['README.md'] = generateReadme(intent, architecture)
  notes.push('Generated README.md with setup instructions')

  logger.info('ai-pipeline', `Integration agent: ${Object.keys(files).length} files generated`)

  return { files, envTemplate, integrationNotes: notes }
}

// ── Generators ────────────────────────────────────────────────────────────────

function generateApiClient(intent: ProductIntent): string {
  const entityMethods = intent.entities.map(e => {
    const slug = e.name.toLowerCase() + 's'
    const type = e.name
    return `
  // ${type} API
  async list${type}s(search?: string): Promise<${type}[]> {
    const url = search ? \`/api/${slug}?search=\${encodeURIComponent(search)}\` : '/api/${slug}'
    return this.get(url)
  },
  async create${type}(data: Partial<${type}>): Promise<${type}> {
    return this.post('/api/${slug}', data)
  },
  async update${type}(id: string, data: Partial<${type}>): Promise<${type}> {
    return this.put(\`/api/${slug}/\${id}\`, data)
  },
  async delete${type}(id: string): Promise<void> {
    return this.delete(\`/api/${slug}/\${id}\`)
  },`
  }).join('')

  const typeInterfaces = intent.entities.map(e => `
export interface ${e.name} {
  id: string
  userId: string
  ${e.fields.filter(f => f !== 'id').map(f => `${f}: string`).join('\n  ')}
  createdAt: string
  updatedAt: string
}`).join('\n')

  return `// Auto-generated API client — BuildForge AI
${typeInterfaces}

const apiClient = {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(\`API error: \${res.status}\`)
    const json = await res.json()
    return json.data
  },
  async post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error(\`API error: \${res.status}\`)
    const json = await res.json()
    return json.data
  },
  async put<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error(\`API error: \${res.status}\`)
    const json = await res.json()
    return json.data
  },
  async delete(url: string): Promise<void> {
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error(\`API error: \${res.status}\`)
  },
${entityMethods}
}

export default apiClient
`
}

function generateGlobalCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
`
}

function generateNextConfig(): string {
  return `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
}

export default nextConfig
`
}

function generatePackageJson(intent: ProductIntent): string {
  const deps: Record<string, string> = {
    next: '^14.2.0',
    react: '^18.3.0',
    'react-dom': '^18.3.0',
    '@clerk/nextjs': '^5.0.0',
    '@prisma/client': '^5.0.0',
    zod: '^3.22.0',
    'lucide-react': '^0.400.0',
    clsx: '^2.1.0',
    'tailwind-merge': '^2.3.0',
  }
  if (intent.hasPayments) deps['stripe'] = '^15.0.0'

  const devDeps: Record<string, string> = {
    typescript: '^5.4.0',
    '@types/node': '^20.0.0',
    '@types/react': '^18.3.0',
    '@types/react-dom': '^18.3.0',
    tailwindcss: '^3.4.0',
    autoprefixer: '^10.4.0',
    postcss: '^8.4.0',
    prisma: '^5.0.0',
  }

  return JSON.stringify({
    name: intent.name.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'db:generate': 'prisma generate',
      'db:push': 'prisma db push',
      'db:migrate': 'prisma migrate dev',
    },
    dependencies: deps,
    devDependencies: devDeps,
  }, null, 2)
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2)
}

function generateEnvTemplate(intent: ProductIntent, arch: ProductArchitecture): string {
  const lines = Object.entries(arch.envTemplate).map(([k, v]) => `${k}=${v}`)
  return `# ${intent.name} — Environment Variables
# Copy this file to .env.local and fill in your values

${lines.join('\n')}
`
}

function generateReadme(intent: ProductIntent, arch: ProductArchitecture): string {
  return `# ${intent.name}

${intent.description}

## Tech Stack

- **Frontend**: ${arch.frontend.technology}
- **Backend**: ${arch.backend.technology}
- **Database**: ${arch.database.technology}
- **Auth**: ${arch.auth.technology}

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Set up database
npx prisma db push

# Run development server
npm run dev
\`\`\`

## Project Structure

\`\`\`
app/           # Next.js App Router pages
app/api/       # REST API routes
components/    # React components
lib/           # Utilities and DB client
prisma/        # Database schema
\`\`\`

## Generated by BuildForge AI
`
}
