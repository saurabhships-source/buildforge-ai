const STEPS = [
  {
    n: '01',
    title: 'Describe Your Idea',
    desc: 'Type a plain-English prompt. BuildForge understands your vision and extracts product type, entities, features, and architecture automatically.',
    color: 'from-violet-500 to-violet-600',
    glow: 'shadow-violet-500/20',
  },
  {
    n: '02',
    title: 'AI Designs the Product',
    desc: 'The Product Brain maps your idea to the best SaaS pattern — CRM, marketplace, analytics, booking — and generates a complete product spec.',
    color: 'from-indigo-500 to-indigo-600',
    glow: 'shadow-indigo-500/20',
  },
  {
    n: '03',
    title: 'Code Generated',
    desc: 'Multi-agent AI generates Next.js App Router frontend, API routes, Prisma schema, and database models — all production-ready TypeScript.',
    color: 'from-cyan-500 to-cyan-600',
    glow: 'shadow-cyan-500/20',
  },
  {
    n: '04',
    title: 'Errors Auto-Fixed',
    desc: 'The self-healing repair agent detects build errors, generates fixes, applies patches, and rebuilds — automatically, with no manual intervention.',
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
  },
  {
    n: '05',
    title: 'App Deployed',
    desc: 'One-click deployment to Vercel or Netlify. Your app gets a live URL, custom domain support, and automatic CI/CD pipeline.',
    color: 'from-emerald-500 to-green-500',
    glow: 'shadow-emerald-500/20',
  },
  {
    n: '06',
    title: 'Growth Engine Starts',
    desc: 'BuildForge generates SEO strategy, blog content, social campaigns, email sequences, and lead capture — your marketing runs on autopilot.',
    color: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/20',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 mb-4">
            How It Works
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            From idea to live startup
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
              in under 3 minutes
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            BuildForge orchestrates a pipeline of specialized AI agents that handle every step — from product design to deployment to marketing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/8 dark:bg-white/3 dark:hover:bg-white/5"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg ${step.glow} mb-4`}>
                <span className="text-xs font-bold text-white">{step.n}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Pipeline connector */}
        <div className="mt-12 flex items-center justify-center gap-0 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center">
              <div className={`flex h-8 items-center rounded-full bg-gradient-to-r ${step.color} px-3 text-[10px] font-bold text-white whitespace-nowrap shadow-sm`}>
                {step.title.split(' ').slice(0, 2).join(' ')}
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-px w-4 bg-gradient-to-r from-slate-300 to-slate-200 dark:from-white/20 dark:to-white/10 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
