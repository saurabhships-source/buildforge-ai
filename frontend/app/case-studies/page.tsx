import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Case Studies — How Founders Build with BuildForge AI',
  description: 'Real case studies of founders and developers who used BuildForge AI to build and launch SaaS products, tools, and startups.',
  alternates: { canonical: 'https://buildforge.ai/case-studies' },
}

const cases = [
  {
    company: 'TaskFlow',
    desc: 'Solo founder built a project management SaaS in 2 days using BuildForge. Launched on Product Hunt and reached $2k MRR in the first month.',
    result: '$2k MRR in 30 days',
    type: 'SaaS',
  },
  {
    company: 'ContentAI',
    desc: 'Marketing agency used BuildForge to generate an AI content writing tool for their clients. Deployed 12 custom tools in one week.',
    result: '12 tools in 1 week',
    type: 'AI Tool',
  },
  {
    company: 'ShipFast Analytics',
    desc: 'Developer built a SaaS analytics dashboard for e-commerce stores. Used the multi-agent pipeline to generate the full product in 4 hours.',
    result: 'Full product in 4 hours',
    type: 'Dashboard',
  },
]

export default function CaseStudiesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Case Studies</h1>
      <p className="text-xl text-muted-foreground mb-12">
        How founders and developers use BuildForge AI to ship faster.
      </p>

      <div className="space-y-6">
        {cases.map(c => (
          <div key={c.company} className="p-6 border border-border rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold">{c.company}</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{c.type}</span>
            </div>
            <p className="text-muted-foreground text-sm mb-3">{c.desc}</p>
            <p className="text-sm font-medium text-green-400">Result: {c.result}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
