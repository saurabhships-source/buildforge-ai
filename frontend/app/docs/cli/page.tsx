import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CLI — BuildForge Command Line Interface',
  description: 'The BuildForge CLI lets you generate, manage, and deploy projects from your terminal. Full documentation and command reference.',
  alternates: { canonical: 'https://buildforge.ai/docs/cli' },
}

export default function CLIPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">BuildForge CLI</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Generate, manage, and deploy projects from your terminal.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Installation</h2>
      <pre className="bg-muted rounded-lg p-4 text-sm font-mono mb-8 overflow-x-auto">
        npm install -g @buildforge/cli
      </pre>

      <h2 className="text-2xl font-semibold mb-4">Commands</h2>
      <div className="space-y-4 mb-8">
        {[
          { cmd: 'buildforge generate "Build a SaaS CRM"', desc: 'Generate a new project from a prompt' },
          { cmd: 'buildforge deploy --platform vercel', desc: 'Deploy the current project to Vercel' },
          { cmd: 'buildforge projects list', desc: 'List all your projects' },
          { cmd: 'buildforge export --github', desc: 'Export project to a new GitHub repository' },
          { cmd: 'buildforge repair', desc: 'Run the repair agent on the current project' },
        ].map(c => (
          <div key={c.cmd} className="p-4 border border-border rounded-lg">
            <pre className="text-sm font-mono text-primary mb-1">{c.cmd}</pre>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
