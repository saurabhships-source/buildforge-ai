import Link from 'next/link'
import { ArrowRight, Zap, LayoutTemplate } from 'lucide-react'

export function FinalCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-8 py-16 text-center shadow-2xl shadow-violet-500/30">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-0 h-64 w-64 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-64 w-64 translate-y-1/2 rounded-full bg-purple-400/20 blur-3xl" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              Join 10,000+ builders already using BuildForge
            </div>

            <h2 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl mb-5 tracking-tight">
              Start Building Your
              <br />
              AI Startup Today
            </h2>

            <p className="text-xl text-violet-200 mb-10 max-w-2xl mx-auto">
              Generate a full SaaS product, landing page, and marketing strategy from a single prompt. No code required.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex h-13 items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-violet-700 shadow-xl transition-all hover:bg-violet-50 hover:-translate-y-0.5 hover:shadow-2xl"
              >
                <Zap className="h-4 w-4" />
                Start Building
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/templates"
                className="inline-flex h-13 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/20 hover:-translate-y-0.5"
              >
                <LayoutTemplate className="h-4 w-4" />
                Explore Templates
              </Link>
            </div>

            <p className="mt-6 text-sm text-violet-300">
              Free tier available · No credit card required · 14-day free trial on Pro
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
