import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Launch AI Startups — Generate a Complete Startup with AI | BuildForge',
  description: 'BuildForge generates complete AI startups — product, landing page, pricing, and marketing strategy — from a single idea. Launch your startup in hours, not months.',
  keywords: ['launch AI startup', 'AI startup generator', 'build startup with AI', 'AI founder tools'],
  alternates: { canonical: 'https://buildforge.ai/solutions/launch-ai-startups' },
}

export default function LaunchAIStartupsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Launch AI Startups</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Go from idea to launched startup in hours. BuildForge generates your product, landing page,
        pricing model, and go-to-market strategy — all powered by AI.
      </p>

      <h2 className="text-2xl font-semibold mb-4">The Complete Startup Generator</h2>
      <p className="text-muted-foreground mb-6">
        BuildForge's Autonomous Startup Generator doesn't just build your product — it builds your
        entire startup. Market analysis, competitive positioning, pricing tiers, landing page copy,
        and marketing strategy are all generated automatically.
      </p>

      <h2 className="text-2xl font-semibold mb-4">What Gets Generated</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Startup name, tagline, and brand identity</li>
        <li>Market analysis and competitive landscape</li>
        <li>Full SaaS product with all features</li>
        <li>Marketing landing page with conversion copy</li>
        <li>Pricing tiers (Free, Pro, Enterprise)</li>
        <li>Go-to-market strategy and launch plan</li>
        <li>SEO strategy and content calendar</li>
        <li>Email sequences and social media content</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Built for Solo Founders</h2>
      <p className="text-muted-foreground mb-8">
        You don't need a team of 10 to launch a startup anymore. BuildForge gives solo founders the
        leverage of an entire product and marketing team — powered by AI.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Launch Your Startup
      </Link>
    </main>
  )
}
