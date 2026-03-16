import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Software Studio — Full-Stack Software Development with AI | BuildForge',
  description: 'BuildForge AI Software Studio is a complete AI-powered development environment. Build, test, repair, and deploy full-stack software with multi-agent AI.',
  keywords: ['AI software studio', 'AI development environment', 'AI code generator', 'full-stack AI builder'],
  alternates: { canonical: 'https://buildforge.ai/product/ai-software-studio' },
}

export default function AISoftwareStudioPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">AI Software Studio</h1>
      <p className="text-xl text-muted-foreground mb-10">
        A complete AI-powered development environment. Write, generate, repair, and deploy full-stack
        software — all from one unified workspace powered by multi-agent AI.
      </p>

      <h2 className="text-2xl font-semibold mb-4">The Complete AI Development Workspace</h2>
      <p className="text-muted-foreground mb-6">
        BuildForge AI Software Studio combines a code editor, AI generation pipeline, live preview,
        version control, and one-click deployment into a single platform. It's the IDE reimagined for
        the AI era.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Studio Features</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Multi-agent AI pipeline: architect → builder → QA → deploy</li>
        <li>Built-in code editor with syntax highlighting</li>
        <li>Live preview with hot reload</li>
        <li>Self-healing repair agent fixes runtime errors automatically</li>
        <li>Version history and rollback</li>
        <li>GitHub export and CI/CD integration</li>
        <li>Template library with 50+ starting points</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Built for Serious Developers</h2>
      <p className="text-muted-foreground mb-8">
        BuildForge AI Software Studio isn't a toy — it generates production-quality TypeScript, React,
        and Next.js code that you can ship to real users. The AI handles the boilerplate so you can
        focus on the product.
      </p>

      <Link
        href="/signup"
        className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Open the Studio
      </Link>
    </main>
  )
}
