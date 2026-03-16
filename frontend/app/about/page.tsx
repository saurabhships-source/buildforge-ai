import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About BuildForge AI — The AI Platform for Building Software',
  description: 'BuildForge AI is an AI-powered platform for building websites, SaaS products, and software tools. Learn about our mission and technology.',
  alternates: { canonical: 'https://buildforge.ai/about' },
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">About BuildForge AI</h1>
      <p className="text-xl text-muted-foreground mb-10">
        We're building the platform that lets anyone create and launch software products using AI —
        without needing a team of engineers.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
      <p className="text-muted-foreground mb-8">
        Software development has always been the bottleneck between ideas and products. BuildForge
        exists to remove that bottleneck. We believe that anyone with a good idea should be able to
        build and launch a software product — regardless of their technical background.
      </p>

      <h2 className="text-2xl font-semibold mb-4">What We Build</h2>
      <p className="text-muted-foreground mb-8">
        BuildForge is an AI-powered development platform that generates complete, production-ready
        applications from natural language descriptions. Our multi-agent AI system handles
        architecture, code generation, error repair, and deployment — so you can focus on your product.
      </p>

      <h2 className="text-2xl font-semibold mb-4">The Technology</h2>
      <p className="text-muted-foreground mb-8">
        BuildForge is built on Next.js, TypeScript, and a coordinated system of specialized AI agents.
        We use the latest large language models from OpenAI and Google, combined with our own
        proprietary pipeline for generating consistent, high-quality software.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Start Building
      </Link>
    </main>
  )
}
