import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Product Factory — Automated Full-Stack Product Generation | BuildForge',
  description: 'The BuildForge AI Product Factory generates complete full-stack products automatically. From intent to deployed application using a coordinated multi-agent pipeline.',
  keywords: ['AI product factory', 'automated product generation', 'AI full-stack generator', 'AI product builder'],
  alternates: { canonical: 'https://buildforge.ai/platform/ai-product-factory' },
}

export default function AIProductFactoryPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">AI Product Factory</h1>
      <p className="text-xl text-muted-foreground mb-10">
        The core of BuildForge — an automated pipeline that takes a product idea and produces a
        complete, deployed application. No manual steps required.
      </p>

      <h2 className="text-2xl font-semibold mb-4">The Factory Pipeline</h2>
      <ol className="space-y-3 text-muted-foreground mb-8 list-decimal list-inside">
        <li>Intent analysis — understand what you want to build</li>
        <li>Architecture planning — design the system structure</li>
        <li>Frontend generation — React/Next.js UI components</li>
        <li>Backend generation — API routes and business logic</li>
        <li>Database generation — Prisma schema and migrations</li>
        <li>Integration wiring — auth, billing, third-party APIs</li>
        <li>QA validation — automated testing and error checking</li>
        <li>Deployment — live URL in seconds</li>
      </ol>

      <h2 className="text-2xl font-semibold mb-4">Consistent, High-Quality Output</h2>
      <p className="text-muted-foreground mb-8">
        The AI Product Factory produces consistent, production-quality code on every run. Each stage
        is handled by a specialized agent that understands its domain deeply — resulting in better
        output than a single generalist model.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Try the Product Factory
      </Link>
    </main>
  )
}
