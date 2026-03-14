import { Navbar } from '@/components/navbar'
import { PricingSection } from '@/components/pricing-section'
import { Footer } from '@/components/footer'

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Choose your plan
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start building AI-powered tools today. Upgrade or downgrade anytime.
          </p>
        </div>
        <PricingSection />
      </main>
      <Footer />
    </div>
  )
}
