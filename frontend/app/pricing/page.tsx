import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { PricingSection } from '@/components/pricing-section'
import { FinalCTA } from '@/components/final-cta'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Pricing – BuildForge AI',
  description: 'Simple, transparent pricing for AI app builders. Start free, upgrade when you need more power.',
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="px-4 pt-24 pb-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Simple pricing for builders
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/40">
            Start free. Upgrade when you need more power. Cancel anytime.
          </p>
        </div>
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
