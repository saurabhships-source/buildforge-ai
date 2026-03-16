import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const TEMPLATES = [
  { name: 'SaaS Starter',  desc: 'Auth, billing, dashboard, and API — production-ready.',              tag: 'SaaS',      from: 'from-violet-400', to: 'to-indigo-500' },
  { name: 'AI Tool',       desc: 'LLM-powered tool with streaming, history, and credits.',             tag: 'AI',        from: 'from-cyan-400',   to: 'to-blue-500' },
  { name: 'E-Commerce',    desc: 'Product catalog, cart, checkout, and order management.',             tag: 'Commerce',  from: 'from-emerald-400',to: 'to-teal-500' },
  { name: 'Restaurant',    desc: 'Menu, gallery, reservations, and Google Maps integration.',          tag: 'Business',  from: 'from-orange-400', to: 'to-red-500' },
  { name: 'Portfolio',     desc: 'Personal site with projects, blog, and contact form.',               tag: 'Personal',  from: 'from-pink-400',   to: 'to-rose-500' },
  { name: 'Dashboard',     desc: 'Analytics dashboard with charts, tables, and filters.',              tag: 'Analytics', from: 'from-yellow-400', to: 'to-amber-500' },
]

export function TemplateShowcase() {
  return (
    <section id="templates" className="px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
            Templates
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Start from a template,
            <br />
            <span className="text-slate-400 dark:text-white/40">ship faster</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <div
              key={t.name}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg hover:border-slate-300 dark:border-white/8 dark:bg-[#111118] dark:hover:border-white/15 cursor-pointer"
            >
              <div className={`mb-4 h-24 rounded-xl bg-gradient-to-br ${t.from} ${t.to} flex items-center justify-center`}>
                <span className="text-sm font-bold text-white/90">{t.name}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{t.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.desc}</p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
                  {t.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/dashboard/builder"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Browse all templates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
