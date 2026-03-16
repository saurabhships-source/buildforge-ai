const COMPARISON = [
  { aspect: 'Time to MVP', traditional: '3–6 months', buildforge: '< 3 minutes', win: true },
  { aspect: 'Code quality', traditional: 'Depends on developer', buildforge: 'Production-grade TypeScript', win: true },
  { aspect: 'Error fixing', traditional: 'Manual debugging', buildforge: 'AI auto-repair', win: true },
  { aspect: 'Deployment', traditional: 'DevOps setup required', buildforge: 'One-click deploy', win: true },
  { aspect: 'Marketing', traditional: 'Hire a marketer', buildforge: 'AI Growth Engine', win: true },
  { aspect: 'Cost', traditional: '$50k–$200k dev cost', buildforge: 'From $0/month', win: true },
  { aspect: 'Iterations', traditional: 'Days per change', buildforge: 'Seconds per change', win: true },
  { aspect: 'SEO & content', traditional: 'Separate agency', buildforge: 'Built-in AI generator', win: true },
]

export function UseCases() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 mb-4">
            BuildForge vs Traditional Development
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Why founders choose BuildForge
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            Stop spending months and thousands of dollars on development. BuildForge gives you a production-ready SaaS in minutes.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/8">
          {/* Header */}
          <div className="grid grid-cols-3 bg-slate-50 dark:bg-white/3 border-b border-slate-200 dark:border-white/8">
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Aspect</div>
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-white/8">Traditional Dev</div>
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 border-l border-slate-200 dark:border-white/8 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              BuildForge
            </div>
          </div>

          {COMPARISON.map((row, i) => (
            <div
              key={row.aspect}
              className={`grid grid-cols-3 border-b border-slate-100 dark:border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-white/[0.01]'}`}
            >
              <div className="px-5 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-300">{row.aspect}</div>
              <div className="px-5 py-3.5 text-sm text-slate-400 dark:text-slate-500 border-l border-slate-100 dark:border-white/5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                {row.traditional}
              </div>
              <div className="px-5 py-3.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 border-l border-slate-100 dark:border-white/5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                {row.buildforge}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
