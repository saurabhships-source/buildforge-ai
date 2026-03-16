import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Generate Landing Pages with AI — High-Converting Pages Instantly | BuildForge',
  description: 'Generate high-converting landing pages with AI. BuildForge creates SEO-optimized, conversion-focused landing pages from a product description in minutes.',
  keywords: ['generate landing pages with AI', 'AI landing page generator', 'create landing page automatically', 'AI marketing pages'],
  alternates: { canonical: 'https://buildforge.ai/use-cases/generate-landing-pages' },
}

export default function GenerateLandingPagesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Generate Landing Pages with AI</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Create high-converting, SEO-optimized landing pages in minutes. Describe your product and
        BuildForge generates a complete landing page with hero, features, pricing, and CTA sections.
      </p>

      <h2 className="text-2xl font-semibold mb-4">What's Included in Every Landing Page</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Hero section with headline, subheadline, and CTA</li>
        <li>Features and benefits section</li>
        <li>Social proof and testimonials</li>
        <li>Pricing section with comparison table</li>
        <li>FAQ section</li>
        <li>Final CTA and email capture</li>
        <li>Full SEO metadata and structured data</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Optimized for Conversions and SEO</h2>
      <p className="text-muted-foreground mb-8">
        BuildForge landing pages are built with conversion best practices — clear value propositions,
        strong CTAs, and fast load times. Every page includes proper SEO structure so it ranks from
        day one.
      </p>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Generate Your Landing Page
      </Link>
    </main>
  )
}
