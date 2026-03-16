import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Build Internal Tools with AI — Ship Ops Tools in Minutes | BuildForge',
  description: 'Build internal tools, admin panels, and operations dashboards with AI. BuildForge generates custom internal tools from a description — no engineering backlog needed.',
  keywords: ['build internal tools with AI', 'AI internal tool builder', 'generate admin panel AI', 'AI ops tools'],
  alternates: { canonical: 'https://buildforge.ai/use-cases/build-internal-tools' },
}

export default function BuildInternalToolsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Build Internal Tools with AI</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Stop waiting on engineering to build internal tools. BuildForge generates custom admin panels,
        operations dashboards, and internal apps from a description — in minutes.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Internal Tools You Can Build</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Customer support admin panels</li>
        <li>Order management and fulfillment dashboards</li>
        <li>Employee onboarding and HR tools</li>
        <li>Inventory and supply chain trackers</li>
        <li>Finance and expense reporting tools</li>
        <li>Data import and ETL pipelines</li>
        <li>Approval workflows and request systems</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">No Engineering Backlog</h2>
      <p className="text-muted-foreground mb-8">
        Internal tools are always deprioritized. With BuildForge, any team member can describe the
        tool they need and have it running the same day — without touching the engineering backlog.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Build Your Internal Tool
      </Link>
    </main>
  )
}
