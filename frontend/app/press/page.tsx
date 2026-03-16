import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Press — BuildForge AI Media Resources',
  description: 'Press resources, media kit, and contact information for BuildForge AI. Download logos, brand assets, and company information.',
  alternates: { canonical: 'https://buildforge.ai/press' },
}

export default function PressPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Press</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Media resources and press contact for BuildForge AI.
      </p>

      <h2 className="text-2xl font-semibold mb-4">About BuildForge AI</h2>
      <p className="text-muted-foreground mb-8">
        BuildForge AI is an AI-powered platform that enables developers, founders, and businesses to
        build complete software products from natural language descriptions. The platform uses a
        multi-agent AI system to generate full-stack applications, deploy them instantly, and grow
        them with AI-powered marketing tools.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Key Facts</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Founded: 2025</li>
        <li>Platform: AI SaaS builder, AI website builder, AI startup generator</li>
        <li>Technology: Next.js, TypeScript, multi-agent AI pipeline</li>
        <li>Deployment: Vercel, Netlify, Railway</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Press Contact</h2>
      <p className="text-muted-foreground">
        For press inquiries, contact press@buildforge.ai
      </p>
    </main>
  )
}
