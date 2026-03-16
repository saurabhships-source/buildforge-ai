import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Documentation — BuildForge AI Developer Docs',
  description: 'Complete documentation for BuildForge AI. Learn how to build websites, SaaS apps, and AI tools using the BuildForge platform.',
  alternates: { canonical: 'https://buildforge.ai/docs' },
}

const sections = [
  { title: 'Getting Started', href: '/docs/getting-started', desc: 'Set up your account and build your first project in 5 minutes.' },
  { title: 'AI Website Builder', href: '/docs/website-builder', desc: 'Generate complete websites from a text prompt.' },
  { title: 'AI SaaS Builder', href: '/docs/saas-builder', desc: 'Build full-stack SaaS applications with multi-agent AI.' },
  { title: 'Startup Generator', href: '/docs/startup-generator', desc: 'Generate a complete startup from a single idea.' },
  { title: 'Deployment Guide', href: '/docs/deployment', desc: 'Deploy to Vercel, Netlify, or Railway with one click.' },
  { title: 'API Reference', href: '/docs/api', desc: 'Programmatic access to the BuildForge generation API.' },
]

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Everything you need to build with BuildForge AI.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(s => (
          <Link key={s.href} href={s.href} className="block p-6 border border-border rounded-xl hover:border-primary/50 transition-colors">
            <h2 className="font-semibold mb-1">{s.title}</h2>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
