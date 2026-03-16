import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference — BuildForge AI REST API',
  description: 'Complete API reference for the BuildForge AI generation API. Generate websites, SaaS apps, and tools programmatically.',
  alternates: { canonical: 'https://buildforge.ai/docs/api' },
}

const endpoints = [
  { method: 'POST', path: '/api/generate', desc: 'Generate a project from a prompt' },
  { method: 'POST', path: '/api/agents/run', desc: 'Run the multi-agent AI pipeline' },
  { method: 'POST', path: '/api/startup/generate', desc: 'Generate a complete startup package' },
  { method: 'GET',  path: '/api/projects', desc: 'List all projects for the authenticated user' },
  { method: 'GET',  path: '/api/projects/[id]', desc: 'Get a specific project by ID' },
  { method: 'POST', path: '/api/deploy/vercel', desc: 'Deploy a project to Vercel' },
  { method: 'POST', path: '/api/github/export', desc: 'Export a project to GitHub' },
]

export default function APIReferencePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">API Reference</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Programmatic access to the BuildForge AI generation engine.
      </p>

      <h2 className="text-2xl font-semibold mb-6">Authentication</h2>
      <p className="text-muted-foreground mb-4">
        All API requests require a valid session token. Pass your API key in the Authorization header:
      </p>
      <pre className="bg-muted rounded-lg p-4 text-sm font-mono mb-10 overflow-x-auto">
        Authorization: Bearer YOUR_API_KEY
      </pre>

      <h2 className="text-2xl font-semibold mb-6">Endpoints</h2>
      <div className="space-y-4">
        {endpoints.map(e => (
          <div key={e.path} className="flex items-start gap-4 p-4 border border-border rounded-lg">
            <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${e.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
              {e.method}
            </span>
            <div>
              <code className="text-sm font-mono">{e.path}</code>
              <p className="text-sm text-muted-foreground mt-1">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
