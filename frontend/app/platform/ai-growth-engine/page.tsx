import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Growth Engine — Automated Marketing and SEO for Your Startup | BuildForge',
  description: 'The BuildForge AI Growth Engine generates SEO strategies, content, social media campaigns, and email sequences to grow your startup automatically.',
  keywords: ['AI growth engine', 'AI marketing automation', 'AI SEO generator', 'automated startup growth'],
  alternates: { canonical: 'https://buildforge.ai/platform/ai-growth-engine' },
}

export default function AIGrowthEnginePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">AI Growth Engine</h1>
      <p className="text-xl text-muted-foreground mb-10">
        BuildForge doesn't just build your product — it builds the marketing system to grow it.
        The AI Growth Engine generates SEO, content, social media, and email campaigns automatically.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Growth Engine Components</h2>
      <ul className="space-y-3 text-muted-foreground mb-8">
        <li><span className="font-medium text-foreground">SEO Generator</span> — keyword research, SEO landing pages, and blog topics</li>
        <li><span className="font-medium text-foreground">Content Engine</span> — blog posts, tutorials, and feature pages</li>
        <li><span className="font-medium text-foreground">Social Engine</span> — Twitter threads, LinkedIn posts, Reddit content</li>
        <li><span className="font-medium text-foreground">Lead Generator</span> — lead capture forms and CRM integration</li>
        <li><span className="font-medium text-foreground">Email Engine</span> — welcome sequences, product tips, upgrade offers</li>
        <li><span className="font-medium text-foreground">Analytics Engine</span> — conversion tracking and growth feedback</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">From Product to Traction</h2>
      <p className="text-muted-foreground mb-8">
        Most startups fail not because of bad products but because of poor distribution. The AI
        Growth Engine gives every BuildForge startup a complete marketing system from day one.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Activate Growth Engine
      </Link>
    </main>
  )
}
