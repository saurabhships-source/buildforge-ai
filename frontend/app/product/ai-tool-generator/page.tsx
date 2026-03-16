import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Tool Generator — Create AI-Powered Tools Instantly | BuildForge',
  description: 'Generate AI-powered tools, calculators, dashboards, and utilities from a prompt. BuildForge AI Tool Generator ships production-ready tools in minutes.',
  keywords: ['AI tool generator', 'create AI tools', 'build tools with AI', 'AI utility builder'],
  alternates: { canonical: 'https://buildforge.ai/product/ai-tool-generator' },
}

export default function AIToolGeneratorPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">AI Tool Generator</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Build calculators, converters, dashboards, and AI-powered utilities from a single description.
        No code required — just describe the tool and BuildForge builds it.
      </p>

      <h2 className="text-2xl font-semibold mb-4">What Kind of Tools Can You Build?</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>AI writing assistants and content generators</li>
        <li>Data analysis and visualization dashboards</li>
        <li>Business calculators and ROI estimators</li>
        <li>Form builders and lead capture tools</li>
        <li>API testing and developer utilities</li>
        <li>Internal operations tools and admin panels</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">From Prompt to Deployed Tool</h2>
      <p className="text-muted-foreground mb-6">
        Describe your tool in plain English. BuildForge generates the full application — UI, logic, and
        API integrations — and deploys it to a live URL. Share it with your team or customers immediately.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Built for Productivity</h2>
      <p className="text-muted-foreground mb-8">
        Stop spending weeks building internal tools. BuildForge AI Tool Generator lets you ship useful
        tools in minutes, so your team can focus on what matters.
      </p>

      <Link
        href="/signup"
        className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Generate Your First Tool
      </Link>
    </main>
  )
}
