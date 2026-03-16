/**
 * Landing Page Generator — generates a complete marketing landing page as a Next.js file set.
 * Includes hero, features, pricing, FAQ, and CTA sections.
 */

import { aiRequest, stripFences } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { StartupConcept } from './startup-brain'
import type { PricingModel } from './pricing-generator'
import type { MarketAnalysis } from './market-analyzer'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface LandingPageFiles {
  'app/page.tsx': string
  'app/layout.tsx': string
  'components/landing/Hero.tsx': string
  'components/landing/Features.tsx': string
  'components/landing/Pricing.tsx': string
  'components/landing/FAQ.tsx': string
  'components/landing/CTA.tsx': string
  'components/landing/Navbar.tsx': string
  'components/landing/Footer.tsx': string
}

const HERO_SYSTEM = `You are a senior React/Tailwind developer.
Generate a production-ready Hero section component for a SaaS landing page.
Return ONLY the complete TypeScript React component — no markdown, no fences, no explanation.
Use Tailwind CSS classes. Include a headline, subheadline, CTA button, and a subtle gradient background.
Export as default function Hero().`

const FEATURES_SYSTEM = `You are a senior React/Tailwind developer.
Generate a Features section component for a SaaS landing page.
Return ONLY the complete TypeScript React component — no markdown, no fences.
Use Tailwind CSS. Show 6 features in a 3-column grid with icons (use emoji as icons).
Export as default function Features().`

export async function generateLandingPage(
  concept: StartupConcept,
  pricing: PricingModel,
  market: MarketAnalysis,
  modelId: ModelId = 'gemini_flash',
): Promise<LandingPageFiles> {
  logger.info('ai-pipeline', '[LandingGenerator] Generating landing page', concept.name)

  const [heroCode, featuresCode] = await Promise.all([
    generateHero(concept, modelId),
    generateFeatures(concept, modelId),
  ])

  return {
    'app/page.tsx': buildPageTsx(concept),
    'app/layout.tsx': buildLayoutTsx(concept),
    'components/landing/Hero.tsx': heroCode,
    'components/landing/Features.tsx': featuresCode,
    'components/landing/Pricing.tsx': buildPricingComponent(concept, pricing),
    'components/landing/FAQ.tsx': buildFAQComponent(concept),
    'components/landing/CTA.tsx': buildCTAComponent(concept),
    'components/landing/Navbar.tsx': buildNavbarComponent(concept),
    'components/landing/Footer.tsx': buildFooterComponent(concept),
  }
}

async function generateHero(concept: StartupConcept, modelId: ModelId): Promise<string> {
  try {
    const result = await aiRequest({
      system: HERO_SYSTEM,
      prompt: `Create a Hero section for:
Name: ${concept.name}
Tagline: ${concept.tagline}
Value proposition: ${concept.valueProposition}
Target users: ${concept.targetUsers.join(', ')}`,
      modelId,
      maxOutputTokens: 1500,
      timeoutMs: 20_000,
    })
    const code = stripFences(result)
    if (code.includes('export default')) return code
  } catch {
    // fall through to static
  }
  return buildStaticHero(concept)
}

async function generateFeatures(concept: StartupConcept, modelId: ModelId): Promise<string> {
  try {
    const result = await aiRequest({
      system: FEATURES_SYSTEM,
      prompt: `Create a Features section for ${concept.name}.
Features: ${concept.keyFeatures.join(', ')}`,
      modelId,
      maxOutputTokens: 1500,
      timeoutMs: 20_000,
    })
    const code = stripFences(result)
    if (code.includes('export default')) return code
  } catch {
    // fall through to static
  }
  return buildStaticFeatures(concept)
}

// ── Static builders ────────────────────────────────────────────────────────────

function buildStaticHero(concept: StartupConcept): string {
  return `export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Now in public beta
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          ${concept.tagline}
        </h1>
        <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
          ${concept.valueProposition}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/signup" className="bg-white text-indigo-900 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition">
            Start for free
          </a>
          <a href="#features" className="border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition">
            See how it works
          </a>
        </div>
        <p className="mt-6 text-sm text-indigo-300">No credit card required · 14-day free trial</p>
      </div>
    </section>
  )
}`
}

function buildStaticFeatures(concept: StartupConcept): string {
  const icons = ['⚡', '🎯', '📊', '🔒', '🤝', '🚀']
  const features = concept.keyFeatures.slice(0, 6)
  const featureItems = features.map((f, i) => `
    { icon: '${icons[i] ?? '✨'}', title: '${f}', description: 'Powerful ${f.toLowerCase()} built for ${concept.targetUsers[0] ?? 'modern teams'}.' },`).join('')

  return `const features = [${featureItems}
]

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            ${concept.name} gives ${concept.targetUsers[0] ?? 'teams'} the tools to ${concept.domain} smarter.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`
}

function buildPricingComponent(concept: StartupConcept, pricing: PricingModel): string {
  return `'use client'
import { useState } from 'react'

const tiers = ${JSON.stringify(pricing.tiers, null, 2)}

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  return (
    <section id="pricing" className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-500 mb-6">Start free. Upgrade when you're ready.</p>
          <div className="inline-flex items-center gap-3 bg-white border rounded-full px-4 py-2">
            <span className={!annual ? 'font-semibold text-gray-900' : 'text-gray-400'}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className={\`w-12 h-6 rounded-full transition \${annual ? 'bg-indigo-600' : 'bg-gray-200'}\`}>
              <span className={\`block w-5 h-5 bg-white rounded-full shadow transition-transform \${annual ? 'translate-x-6' : 'translate-x-0.5'}\`} />
            </button>
            <span className={annual ? 'font-semibold text-gray-900' : 'text-gray-400'}>Annual <span className="text-green-600 text-xs font-bold">-${pricing.annualDiscount}%</span></span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier: typeof tiers[0]) => (
            <div key={tier.name} className={\`rounded-2xl p-8 \${tier.highlighted ? 'bg-indigo-600 text-white shadow-2xl scale-105' : 'bg-white border border-gray-200'}\`}>
              <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
              <p className={\`text-sm mb-4 \${tier.highlighted ? 'text-indigo-200' : 'text-gray-500'}\`}>{tier.description}</p>
              <div className="text-4xl font-bold mb-6">
                {tier.price}<span className={\`text-base font-normal \${tier.highlighted ? 'text-indigo-200' : 'text-gray-400'}\`}>/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f: typeof tier.features[0]) => (
                  <li key={f.text} className={\`flex items-center gap-2 text-sm \${!f.included ? 'opacity-40' : ''}\`}>
                    <span>{f.included ? '✓' : '✗'}</span> {f.text}
                  </li>
                ))}
              </ul>
              <a href="/signup" className={\`block text-center py-3 rounded-xl font-semibold transition \${tier.highlighted ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}\`}>
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-8">{${pricing.moneyBackDays}}-day money-back guarantee · No credit card required for free plan</p>
      </div>
    </section>
  )
}`
}

function buildFAQComponent(concept: StartupConcept): string {
  return `'use client'
import { useState } from 'react'

const faqs = [
  { q: 'Is there a free plan?', a: 'Yes! Our free plan includes core features with no credit card required.' },
  { q: \`How does ${concept.name} work?\`, a: \`${concept.solutionDescription}\` },
  { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel anytime with no questions asked. We also offer a 30-day money-back guarantee.' },
  { q: 'Do you offer team plans?', a: 'Yes, our Team plan supports unlimited users with collaboration features and SSO.' },
  { q: 'Is my data secure?', a: 'We use enterprise-grade encryption and are SOC 2 compliant. Your data is never shared.' },
  { q: 'Do you offer annual billing?', a: 'Yes! Annual billing saves you 20% compared to monthly.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" className="py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-center px-6 py-4 text-left font-medium text-gray-900 hover:bg-gray-50">
                {faq.q}
                <span className="text-gray-400">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <div className="px-6 pb-4 text-gray-500 text-sm">{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`
}

function buildCTAComponent(concept: StartupConcept): string {
  return `export default function CTA() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-xl text-indigo-200 mb-10">${concept.valueProposition}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/signup" className="bg-white text-indigo-700 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition">
            Start for free
          </a>
          <a href="/demo" className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition">
            Book a demo
          </a>
        </div>
        <p className="mt-6 text-sm text-indigo-300">No credit card required · 14-day free trial · Cancel anytime</p>
      </div>
    </section>
  )
}`
}

function buildNavbarComponent(concept: StartupConcept): string {
  return `export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-indigo-600">${concept.name}</a>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#features" className="hover:text-gray-900">Features</a>
          <a href="#pricing" className="hover:text-gray-900">Pricing</a>
          <a href="#faq" className="hover:text-gray-900">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-600 hover:text-gray-900">Log in</a>
          <a href="/signup" className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            Get started
          </a>
        </div>
      </div>
    </nav>
  )
}`
}

function buildFooterComponent(concept: StartupConcept): string {
  return `export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-16 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="text-white font-bold text-lg mb-3">${concept.name}</div>
          <p className="text-sm">${concept.tagline}</p>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Product</div>
          <ul className="space-y-2 text-sm">
            <li><a href="#features" className="hover:text-white">Features</a></li>
            <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
            <li><a href="/changelog" className="hover:text-white">Changelog</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm">
            <li><a href="/about" className="hover:text-white">About</a></li>
            <li><a href="/blog" className="hover:text-white">Blog</a></li>
            <li><a href="/careers" className="hover:text-white">Careers</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Legal</div>
          <ul className="space-y-2 text-sm">
            <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
            <li><a href="/terms" className="hover:text-white">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 text-center text-sm">
        © 2026 ${concept.name}. All rights reserved.
      </div>
    </footer>
  )
}`
}

function buildPageTsx(concept: StartupConcept): string {
  return `import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

export const metadata = {
  title: '${concept.name} — ${concept.tagline}',
  description: '${concept.valueProposition}',
  openGraph: {
    title: '${concept.name} — ${concept.tagline}',
    description: '${concept.valueProposition}',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  )
}`
}

function buildLayoutTsx(concept: StartupConcept): string {
  return `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${concept.name} — ${concept.tagline}',
  description: '${concept.valueProposition}',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`
}
