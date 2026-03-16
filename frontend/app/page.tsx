import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { HowItWorks } from '@/components/how-it-works'
import { FeaturesSection } from '@/components/features-section'
import { ProductDemo } from '@/components/product-demo'
import { UseCases } from '@/components/use-cases'
import { TemplateShowcase } from '@/components/template-showcase'
import { TrustSection } from '@/components/trust-section'
import { PricingSection } from '@/components/pricing-section'
import { FinalCTA } from '@/components/final-cta'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'BuildForge — AI SaaS Builder and Startup Generator',
  description: 'BuildForge is an AI platform that generates full SaaS products, landing pages, and marketing systems automatically. Build and launch AI startups in minutes.',
  alternates: { canonical: 'https://buildforge.ai' },
}

export default function LandingPage() {
  // BuildForge Landing v2 loaded — workspace: Buildforge AI/buildforge-ai
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <FeaturesSection />
        <ProductDemo />
        <UseCases />
        <TemplateShowcase />
        <TrustSection />
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
