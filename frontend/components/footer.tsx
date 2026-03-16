import Link from 'next/link'
import { Sparkles } from 'lucide-react'

const NAV = [
  {
    heading: 'Product',
    links: [
      { label: 'AI Website Builder',    href: '/product/ai-website-builder' },
      { label: 'AI SaaS Builder',       href: '/product/ai-saas-builder' },
      { label: 'AI App Generator',      href: '/product/ai-app-generator' },
      { label: 'AI Tool Generator',     href: '/product/ai-tool-generator' },
      { label: 'AI Software Studio',    href: '/product/ai-software-studio' },
      { label: 'AI Startup Generator',  href: '/product/ai-startup-generator' },
      { label: 'Pricing',               href: '/pricing' },
      { label: 'Templates',             href: '/templates' },
    ],
  },
  {
    heading: 'Use Cases',
    links: [
      { label: 'Build SaaS with AI',        href: '/use-cases/build-saas-with-ai' },
      { label: 'Create AI Tools',           href: '/use-cases/create-ai-tools' },
      { label: 'Launch Startups with AI',   href: '/use-cases/launch-startups-with-ai' },
      { label: 'Build Internal Tools',      href: '/use-cases/build-internal-tools' },
      { label: 'Build Dashboards',          href: '/use-cases/build-dashboards' },
      { label: 'Generate Landing Pages',    href: '/use-cases/generate-landing-pages' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'AI Product Factory',       href: '/platform/ai-product-factory' },
      { label: 'Multi-Agent AI System',    href: '/platform/multi-agent-ai' },
      { label: 'Self-Healing Code Repair', href: '/platform/self-healing-repair' },
      { label: 'AI Growth Engine',         href: '/platform/ai-growth-engine' },
      { label: 'One-Click Deployment',     href: '/platform/one-click-deployment' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'API Documentation',  href: '/docs/api' },
      { label: 'SDK',                href: '/docs/sdk' },
      { label: 'Integration Guides', href: '/docs/integrations' },
      { label: 'CLI',                href: '/docs/cli' },
      { label: 'Developer Platform', href: '/solutions/ai-developer-platform' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'AI Builder Blog',    href: '/blog' },
      { label: 'Templates Library',  href: '/templates' },
      { label: 'Help Center',        href: '/help' },
      { label: 'Tutorials',          href: '/docs/tutorials' },
      { label: 'Case Studies',       href: '/case-studies' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About BuildForge', href: '/about' },
      { label: 'Careers',          href: '/careers' },
      { label: 'Press',            href: '/press' },
      { label: 'Contact',          href: '/contact' },
      { label: 'Partners',         href: '/partners' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',   href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Cookie Policy',    href: '/legal/cookies' },
      { label: 'Security',         href: '/legal/security' },
      { label: 'Compliance',       href: '/legal/compliance' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-white/8 dark:bg-[#060609]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

        {/* Brand row */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-bold text-slate-900 dark:text-white">
                Build<span className="text-violet-600 dark:text-violet-400">Forge</span> AI
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              The AI platform for building websites, SaaS products, and software tools.
              Generate full-stack applications and launch your startup — from a single prompt.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/signup"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              Start Building Free
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-slate-200 dark:border-white/10 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Nav grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-7">
          {NAV.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row dark:border-white/8">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            © 2026 BuildForge AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
