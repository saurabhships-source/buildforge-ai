import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Startup Generator — Launch a Complete Startup with AI | BuildForge',
  description: 'BuildForge AI Startup Generator creates your entire startup — product, landing page, pricing, and marketing strategy — from a single idea. Launch in hours, not months.',
  keywords: ['AI startup generator', 'generate startup with AI', 'AI founder tools', 'launch startup automatically'],
  alternates: { canonical: 'https://buildforge.ai/product/ai-startup-generator' },
}

export default function AIStartupGeneratorPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">AI Startup Generator</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Turn any idea into a complete, launched startup. BuildForge generates your product, landing page,
        pricing model, and go-to-market strategy — all powered by AI.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Everything a Startup Needs</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Startup name, tagline, and brand identity</li>
        <li>Market analysis and competitive positioning</li>
        <li>Full SaaS product with all core features</li>
        <li>Conversion-optimized marketing landing page</li>
        <li>Pricing tiers (Free, Pro, Enterprise)</li>
        <li>Go-to-market strategy and launch plan</li>
        <li>SEO strategy and content calendar</li>
        <li>Email sequences and social media content</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">The Autonomous Startup Pipeline</h2>
      <p className="text-muted-foreground mb-6">
        The AI Startup Generator runs a full pipeline: idea interpretation → market analysis →
        product design → code generation → landing page → pricing → marketing strategy → deployment.
        Each stage is handled by a specialized AI agent.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Built for Solo Founders</h2>
      <p className="text-muted-foreground mb-8">
        You no longer need a co-founder, designer, or developer to launch. BuildForge gives solo
        founders the leverage of an entire team — compressed into minutes.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Generate Your Startup
      </Link>
    </main>
  )
}
