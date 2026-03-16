import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SDK — BuildForge AI JavaScript & TypeScript SDK',
  description: 'The BuildForge SDK lets you integrate AI generation capabilities into your own applications. Available for JavaScript and TypeScript.',
  alternates: { canonical: 'https://buildforge.ai/docs/sdk' },
}

export default function SDKPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">BuildForge SDK</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Integrate BuildForge AI generation into your own applications using the official SDK.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Installation</h2>
      <pre className="bg-muted rounded-lg p-4 text-sm font-mono mb-8 overflow-x-auto">
        npm install @buildforge/sdk
      </pre>

      <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
      <pre className="bg-muted rounded-lg p-4 text-sm font-mono mb-8 overflow-x-auto">{`import { BuildForge } from '@buildforge/sdk'

const client = new BuildForge({ apiKey: process.env.BUILDFORGE_API_KEY })

const result = await client.generate({
  prompt: 'Build a SaaS CRM with analytics dashboard',
  appType: 'saas',
})

console.log(result.files) // Generated file tree
console.log(result.deployUrl) // Live URL`}</pre>

      <h2 className="text-2xl font-semibold mb-4">SDK Features</h2>
      <ul className="space-y-2 text-muted-foreground list-disc list-inside">
        <li>Full TypeScript support with type definitions</li>
        <li>Streaming generation responses</li>
        <li>Project management (create, update, delete)</li>
        <li>Deployment triggers</li>
        <li>Webhook support for async generation</li>
      </ul>
    </main>
  )
}
