'use client'

import { Wand2, Bot, Sparkles, Building2, Plug, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Wand2,
    title: 'AI Website Builder',
    description: 'Generate complete, responsive websites from simple text descriptions. Landing pages, portfolios, and more.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'group-hover:border-blue-500/30',
  },
  {
    icon: Bot,
    title: 'Smart Tool Generator',
    description: 'Create calculators, converters, and interactive tools instantly. Perfect for any use case.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'group-hover:border-amber-500/30',
  },
  {
    icon: Globe,
    title: 'Software Builder',
    description: 'Build full-featured web applications with dashboards, forms, and complex functionality.',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'group-hover:border-violet-500/30',
  },
  {
    icon: Sparkles,
    title: 'Smart AI Prompts',
    description: 'Optimized templates and suggestions to help you create better outputs faster.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'group-hover:border-rose-500/30',
  },
  {
    icon: Building2,
    title: 'Enterprise Ready',
    description: 'Built for scale with SSO, team management, and enterprise-grade security.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'group-hover:border-emerald-500/30',
  },
  {
    icon: Plug,
    title: 'API Integration',
    description: 'Connect your AI creations to any app or workflow with our powerful REST API.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'group-hover:border-cyan-500/30',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-muted/50 to-transparent" />
      
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent">
            Powerful Features
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Build anything with AI
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            From simple tools to complex applications, create anything you can imagine.
          </p>
        </div>

        {/* Features grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5",
                feature.borderColor
              )}
            >
              {/* Gradient line at top */}
              <div className={cn(
                "absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100",
                feature.color === 'text-blue-500' && "from-blue-500 to-cyan-500",
                feature.color === 'text-amber-500' && "from-amber-500 to-orange-500",
                feature.color === 'text-violet-500' && "from-violet-500 to-purple-500",
                feature.color === 'text-rose-500' && "from-rose-500 to-pink-500",
                feature.color === 'text-emerald-500' && "from-emerald-500 to-teal-500",
                feature.color === 'text-cyan-500' && "from-cyan-500 to-blue-500",
              )} />
              
              {/* Icon */}
              <div className={cn(
                "mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                feature.bgColor,
                feature.color
              )}>
                <feature.icon className="h-7 w-7" />
              </div>
              
              {/* Content */}
              <h3 className="mb-3 text-xl font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            And many more features being added every week.{' '}
            <a href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              Get started for free
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
