import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Create AI Tools — Build and Deploy AI-Powered Tools | BuildForge',
  description: 'Create AI-powered tools, calculators, and utilities with BuildForge. Describe the tool you need and AI builds and deploys it instantly.',
  keywords: ['create AI tools', 'build AI utilities', 'AI tool builder', 'generate AI app'],
  alternates: { canonical: 'https://buildforge.ai/use-cases/create-ai-tools' },
}

export default function CreateAIToolsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Create AI Tools</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Build AI-powered tools and utilities without writing code. Describe what you need and
        BuildForge generates a fully functional, deployable tool in minutes.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Popular AI Tools to Build</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>AI content writer and blog post generator</li>
        <li>SEO keyword research and analysis tool</li>
        <li>Business name and brand generator</li>
        <li>Invoice and proposal generator</li>
        <li>Code review and documentation tool</li>
        <li>Customer support chatbot</li>
        <li>Data extraction and summarization tool</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Ship Tools That Generate Revenue</h2>
      <p className="text-muted-foreground mb-8">
        AI tools are one of the fastest-growing SaaS categories. BuildForge lets you create and
        monetize AI tools quickly — add Stripe billing, user accounts, and usage limits with a
        single prompt.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Create Your AI Tool
      </Link>
    </main>
  )
}
