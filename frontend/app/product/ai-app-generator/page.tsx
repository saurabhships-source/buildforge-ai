import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI App Generator — Generate Full-Stack Apps from a Prompt | BuildForge',
  description: 'BuildForge AI App Generator creates complete, production-ready applications from a text description. Frontend, backend, database, and deployment — all generated automatically.',
  keywords: ['AI app generator', 'generate app with AI', 'AI application builder', 'build app from prompt'],
  alternates: { canonical: 'https://buildforge.ai/product/ai-app-generator' },
}

export default function AIAppGeneratorPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">AI App Generator</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Describe any application and BuildForge generates it — complete with frontend, backend, database,
        and deployment config. The fastest way to go from idea to working app.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Generate Any Type of App</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>SaaS platforms with user accounts and billing</li>
        <li>CRM and customer management systems</li>
        <li>Analytics dashboards and reporting tools</li>
        <li>Booking and scheduling applications</li>
        <li>E-commerce and marketplace platforms</li>
        <li>Internal tools and admin panels</li>
        <li>AI-powered productivity apps</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">How the AI App Generator Works</h2>
      <p className="text-muted-foreground mb-6">
        BuildForge uses a multi-agent AI pipeline to generate your application. The architect agent
        designs the system, the builder agent writes the code, the QA agent validates it, and the
        deploy agent ships it — all automatically.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Production-Ready Output</h2>
      <p className="text-muted-foreground mb-8">
        Every generated app uses Next.js App Router, TypeScript, Tailwind CSS, and Prisma — the same
        stack used by top SaaS companies. The code is clean, maintainable, and ready to extend.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Generate Your App
      </Link>
    </main>
  )
}
