import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'One-Click Deployment — Deploy AI-Generated Apps Instantly | BuildForge',
  description: 'Deploy your AI-generated application to Vercel, Netlify, or Railway with one click. BuildForge handles all deployment configuration automatically.',
  keywords: ['one-click deployment', 'AI app deployment', 'deploy to Vercel automatically', 'instant app deployment'],
  alternates: { canonical: 'https://buildforge.ai/platform/one-click-deployment' },
}

export default function OneClickDeploymentPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">One-Click Deployment</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Go from generated code to live URL in seconds. BuildForge handles all deployment
        configuration automatically — no DevOps knowledge required.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Supported Platforms</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Vercel — ideal for Next.js applications</li>
        <li>Netlify — static sites and serverless functions</li>
        <li>Railway — full-stack apps with databases</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">What Gets Configured Automatically</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Build commands and output directories</li>
        <li>Environment variables and secrets</li>
        <li>Database connection strings</li>
        <li>Custom domain configuration</li>
        <li>CI/CD pipeline setup</li>
        <li>SSL certificates</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Deploy in Seconds, Not Hours</h2>
      <p className="text-muted-foreground mb-8">
        Traditional deployment requires configuring build pipelines, environment variables, and
        infrastructure. BuildForge eliminates all of that — connect your account and click deploy.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Deploy Your First App
      </Link>
    </main>
  )
}
