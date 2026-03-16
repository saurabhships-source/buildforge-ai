import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Multi-Agent AI System — Coordinated AI Agents for Better Software | BuildForge',
  description: 'BuildForge uses a multi-agent AI system where specialized agents collaborate to build better software. Architect, builder, QA, and deploy agents work in coordination.',
  keywords: ['multi-agent AI', 'AI agent system', 'coordinated AI agents', 'AI software development agents'],
  alternates: { canonical: 'https://buildforge.ai/platform/multi-agent-ai' },
}

export default function MultiAgentAIPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Multi-Agent AI System</h1>
      <p className="text-xl text-muted-foreground mb-10">
        BuildForge uses a coordinated system of specialized AI agents that work together to produce
        better software than any single model could generate alone.
      </p>

      <h2 className="text-2xl font-semibold mb-4">The Agent Team</h2>
      <ul className="space-y-3 text-muted-foreground mb-8">
        <li><span className="font-medium text-foreground">Product Brain Agent</span> — interprets your idea and defines the product spec</li>
        <li><span className="font-medium text-foreground">Architect Agent</span> — designs the system architecture and data models</li>
        <li><span className="font-medium text-foreground">Builder Agent</span> — generates frontend, backend, and database code</li>
        <li><span className="font-medium text-foreground">Repair Agent</span> — detects and fixes errors automatically</li>
        <li><span className="font-medium text-foreground">Deploy Agent</span> — handles deployment configuration and shipping</li>
        <li><span className="font-medium text-foreground">SEO Agent</span> — optimizes content for search engines</li>
        <li><span className="font-medium text-foreground">Growth Agent</span> — generates marketing and growth strategies</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Why Multi-Agent Produces Better Results</h2>
      <p className="text-muted-foreground mb-8">
        Each agent specializes in its domain and receives focused context. The architect doesn't need
        to know about deployment; the deploy agent doesn't need to know about UI design. This
        specialization produces higher quality output at every stage.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        See It in Action
      </Link>
    </main>
  )
}
