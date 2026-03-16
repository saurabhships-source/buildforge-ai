import { Cpu, Bot, Wrench, Rocket, Store, Code2, TrendingUp, LayoutDashboard } from 'lucide-react'

const FEATURES = [
  {
    icon: Cpu,
    title: 'AI Product Factory',
    desc: 'Generates complete Next.js SaaS apps — frontend, backend, database, and auth — from a single prompt using a 10-stage AI pipeline.',
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-200 dark:border-violet-500/20',
    badge: 'Core',
  },
  {
    icon: Bot,
    title: 'Multi-Agent AI System',
    desc: 'Five specialized agents collaborate: Product Brain → Architect → Builder → Repair → Deploy. Each agent is an expert in its domain.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    border: 'border-indigo-200 dark:border-indigo-500/20',
    badge: 'New',
  },
  {
    icon: Wrench,
    title: 'Self-Healing Code Repair',
    desc: 'Automatically detects TypeScript errors, missing exports, and broken imports. Generates fixes, applies patches, and rebuilds — zero manual effort.',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20',
    badge: 'AI',
  },
  {
    icon: Rocket,
    title: 'One-Click Deployment',
    desc: 'Deploy to Vercel or Netlify instantly. Automatic CI/CD, custom domains, environment variables, and deployment queue with retry logic.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    badge: 'Fast',
  },
  {
    icon: Cpu,
    title: 'Autonomous Startup Generator',
    desc: 'From one idea, generates a complete startup: product concept, market analysis, landing page, pricing model, and go-to-market strategy.',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-500/10',
    border: 'border-pink-200 dark:border-pink-500/20',
    badge: 'New',
  },
  {
    icon: TrendingUp,
    title: 'AI Growth Engine',
    desc: 'Generates SEO strategy, blog content, Twitter threads, LinkedIn posts, Reddit campaigns, email sequences, and lead capture forms automatically.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    border: 'border-cyan-200 dark:border-cyan-500/20',
    badge: 'Growth',
  },
  {
    icon: Store,
    title: 'Template Marketplace',
    desc: 'Browse, clone, and remix 100+ production-ready SaaS templates. Publish your own templates and earn from the community.',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    border: 'border-orange-200 dark:border-orange-500/20',
    badge: 'Community',
  },
  {
    icon: Code2,
    title: 'Developer IDE',
    desc: 'Full Monaco editor with file explorer, AI chat, version history, and live preview. Edit generated code directly in the browser.',
    color: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-500/10',
    border: 'border-slate-200 dark:border-slate-500/20',
    badge: 'Pro',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-white/[0.01]">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 mb-4">
            Platform Features
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Everything you need to build
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-cyan-400">
              and grow a SaaS startup
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            BuildForge is the only platform that handles product generation, code repair, deployment, and marketing in one unified AI system.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group relative rounded-2xl border ${f.border} ${f.bg} p-5 transition-all hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/10`}>
                  <f.icon className={`h-4.5 w-4.5 ${f.color}`} />
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${f.color} bg-white/60 dark:bg-white/10`}>
                  {f.badge}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
