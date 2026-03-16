import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Developer Platform — Build Faster with AI-Powered Development | BuildForge',
  description: 'BuildForge is an AI developer platform that accelerates full-stack development. Multi-agent AI, code generation, repair, and deployment in one platform.',
  keywords: ['AI developer platform', 'AI coding platform', 'AI development tools', 'AI code generation platform'],
  alternates: { canonical: 'https://buildforge.ai/solutions/ai-developer-platform' },
}

export default function AIDeveloperPlatformPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">AI Developer Platform</h1>
      <p className="text-xl text-muted-foreground mb-10">
        BuildForge is the AI developer platform built for speed. Generate, edit, repair, and deploy
        full-stack applications with a coordinated system of AI agents — all in one workspace.
      </p>

      <h2 className="text-2xl font-semibold mb-4">A Platform Built for Developers</h2>
      <p className="text-muted-foreground mb-6">
        Unlike no-code tools, BuildForge generates real, production-quality code that developers can
        own, modify, and extend. It's AI-assisted development — not a black box.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Platform Capabilities</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Multi-agent AI pipeline for complex application generation</li>
        <li>Semantic code understanding and codebase analysis</li>
        <li>Self-healing repair agent for runtime error resolution</li>
        <li>Version control with full history and rollback</li>
        <li>GitHub integration for import and export</li>
        <li>Vercel, Netlify, and Railway deployment</li>
        <li>REST API for programmatic access</li>
        <li>Template library and component registry</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Integrate with Your Stack</h2>
      <p className="text-muted-foreground mb-8">
        BuildForge works with the tools you already use. Export to GitHub, deploy to your preferred
        cloud, and integrate with Stripe, Supabase, OpenAI, and more — all from the platform.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Start Building
      </Link>
    </main>
  )
}
