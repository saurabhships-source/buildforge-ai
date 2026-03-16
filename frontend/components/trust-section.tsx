const STARTUP_FEATURES = [
  { emoji: '🧠', title: 'Startup Brain', desc: 'Interprets your idea and generates a complete startup concept — name, tagline, problem, solution, and business model.' },
  { emoji: '📊', title: 'Market Analysis', desc: 'Analyzes TAM/SAM/SOM, identifies competitors, and finds your unique market opportunity automatically.' },
  { emoji: '🎨', title: 'Landing Page', desc: 'Generates a conversion-optimized landing page with hero, features, pricing, FAQ, and CTA sections.' },
  { emoji: '💰', title: 'Pricing Model', desc: 'Creates Free, Pro, and Team pricing tiers tailored to your product category and target users.' },
  { emoji: '📣', title: 'Marketing Strategy', desc: 'Full GTM: Product Hunt launch, SEO keywords, Twitter threads, LinkedIn posts, Reddit campaigns.' },
  { emoji: '📧', title: 'Email Sequences', desc: 'Automated onboarding, upgrade, and re-engagement email sequences ready to deploy.' },
]

const GROWTH_FEATURES = [
  { emoji: '🔍', title: 'SEO Strategy', desc: 'Keyword clusters, SEO landing pages, blog topics, technical checklist, and backlink targets.' },
  { emoji: '✍️', title: 'Content Engine', desc: 'AI-generated blog posts, tutorials, and feature pages with a full 8-week content calendar.' },
  { emoji: '📱', title: 'Social Campaigns', desc: 'Twitter launch threads, LinkedIn posts, Reddit posts, and Product Hunt campaign copy.' },
  { emoji: '🎯', title: 'Lead Capture', desc: 'Lead forms with automatic capture, deduplication, status tracking, and conversion analytics.' },
  { emoji: '📈', title: 'Analytics Engine', desc: 'Tracks visitors, signups, activation, and upgrades. Provides actionable recommendations.' },
  { emoji: '🚀', title: 'Launch Readiness', desc: 'Scores your launch readiness 0–100 and gives you a step-by-step launch checklist.' },
]

function FeatureGrid({ features }: { features: typeof STARTUP_FEATURES }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/8 dark:bg-white/3">
          <div className="text-2xl mb-2">{f.emoji}</div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{f.title}</h4>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
        </div>
      ))}
    </div>
  )
}

export function TrustSection() {
  return (
    <>
      {/* Startup Generator */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-white/[0.01]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400 mb-4">
              Autonomous Startup Generator
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              One prompt.
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-pink-400">
                Complete startup package.
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              BuildForge doesn&apos;t just build apps — it builds entire startups. From concept to deployed product with marketing strategy, all from a single idea.
            </p>
          </div>
          <FeatureGrid features={STARTUP_FEATURES} />
        </div>
      </section>

      {/* Growth Engine */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 mb-4">
              AI Growth Engine
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Marketing that runs
              <br />
              <span className="bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-emerald-400">
                on autopilot
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              BuildForge generates not just your product — but the entire marketing system to grow it. SEO, content, social, email, and analytics, all automated.
            </p>
          </div>
          <FeatureGrid features={GROWTH_FEATURES} />
        </div>
      </section>
    </>
  )
}
