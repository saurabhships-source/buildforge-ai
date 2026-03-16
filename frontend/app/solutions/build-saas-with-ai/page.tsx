import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Build SaaS with AI — Launch Your SaaS Product in Minutes | BuildForge',
  description: 'Learn how to build a SaaS product with AI using BuildForge. Generate backend, frontend, database, auth, and billing automatically from a single prompt.',
  keywords: ['build SaaS with AI', 'AI SaaS generator', 'create SaaS app automatically', 'SaaS builder AI'],
  alternates: { canonical: 'https://buildforge.ai/solutions/build-saas-with-ai' },
}

export default function BuildSaaSWithAIPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Build SaaS with AI</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Stop spending months building SaaS infrastructure. BuildForge generates your entire SaaS product
        — from database schema to deployed application — in minutes using AI.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Why Build SaaS with AI?</h2>
      <p className="text-muted-foreground mb-6">
        Traditional SaaS development requires expertise in frontend, backend, databases, auth, billing,
        and DevOps. AI changes this equation entirely. With BuildForge, you describe your product and
        the AI handles every layer of the stack.
      </p>

      <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
      <ol className="space-y-3 text-muted-foreground mb-8 list-decimal list-inside">
        <li>Describe your SaaS idea in plain English</li>
        <li>BuildForge AI interprets your intent and plans the architecture</li>
        <li>Multi-agent pipeline generates frontend, backend, and database</li>
        <li>Auth and billing are wired up automatically</li>
        <li>Deploy to Vercel or Railway with one click</li>
      </ol>

      <h2 className="text-2xl font-semibold mb-4">What You Get</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Complete Next.js SaaS application</li>
        <li>Prisma database with schema and migrations</li>
        <li>Clerk authentication (sign up, login, user management)</li>
        <li>Stripe billing with subscription tiers</li>
        <li>Admin dashboard and analytics</li>
        <li>Production deployment configuration</li>
      </ul>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Build Your SaaS Now
      </Link>
    </main>
  )
}
