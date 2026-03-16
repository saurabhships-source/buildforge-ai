import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI SaaS Builder — Generate Full SaaS Products with AI | BuildForge',
  description: 'BuildForge AI SaaS Builder generates complete SaaS applications including backend, database, auth, billing, and frontend — from a single prompt.',
  keywords: ['AI SaaS builder', 'build SaaS with AI', 'generate SaaS app', 'AI app generator'],
  alternates: { canonical: 'https://buildforge.ai/product/ai-saas-builder' },
}

export default function AISaaSBuilderPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">AI SaaS Builder</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Generate complete SaaS products — frontend, backend, database, auth, and billing — from a single
        prompt. BuildForge is the fastest way to go from idea to deployed SaaS.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Build a Full SaaS in Minutes</h2>
      <p className="text-muted-foreground mb-6">
        Traditional SaaS development takes months. BuildForge AI compresses that to minutes. Describe your
        product idea and the multi-agent AI pipeline generates a complete, production-ready SaaS application
        with all the infrastructure you need.
      </p>

      <h2 className="text-2xl font-semibold mb-4">What Gets Generated</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Next.js frontend with dashboard, auth pages, and settings</li>
        <li>Prisma database schema with migrations</li>
        <li>REST API routes with validation</li>
        <li>Stripe billing integration</li>
        <li>User authentication with Clerk</li>
        <li>Deployment configuration for Vercel or Railway</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Powered by Multi-Agent AI</h2>
      <p className="text-muted-foreground mb-8">
        BuildForge uses a coordinated system of AI agents — architect, builder, database designer, and
        deploy agent — that work together to produce a complete, coherent SaaS product. Each agent
        specializes in its domain, resulting in higher quality output than a single AI model.
      </p>

      <Link
        href="/signup"
        className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Build Your SaaS Now
      </Link>
    </main>
  )
}
