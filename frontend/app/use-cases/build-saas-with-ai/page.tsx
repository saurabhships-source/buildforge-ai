import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Build SaaS with AI — Launch Your SaaS Product in Minutes | BuildForge',
  description: 'Learn how to build a complete SaaS product with AI using BuildForge. Generate backend, frontend, database, auth, and billing automatically.',
  keywords: ['build SaaS with AI', 'AI SaaS generator', 'create SaaS automatically', 'SaaS builder AI'],
  alternates: { canonical: 'https://buildforge.ai/use-cases/build-saas-with-ai' },
}

export default function BuildSaaSPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Build SaaS with AI</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Stop spending months on SaaS infrastructure. BuildForge generates your entire SaaS product
        — from database schema to deployed application — in minutes.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Why Build SaaS with AI?</h2>
      <p className="text-muted-foreground mb-6">
        Traditional SaaS development requires expertise across frontend, backend, databases, auth,
        billing, and DevOps. AI changes this entirely. Describe your product and BuildForge handles
        every layer of the stack.
      </p>

      <h2 className="text-2xl font-semibold mb-4">What Gets Generated</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Next.js frontend with dashboard, auth pages, and settings</li>
        <li>Prisma database schema with migrations</li>
        <li>REST API routes with validation</li>
        <li>Stripe billing with subscription tiers</li>
        <li>Clerk authentication</li>
        <li>Deployment config for Vercel or Railway</li>
      </ul>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Build Your SaaS Now
      </Link>
    </main>
  )
}
