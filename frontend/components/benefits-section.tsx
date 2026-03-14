'use client'

import { Code2, Zap, FileText, Rocket, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const benefits = [
  {
    icon: Code2,
    title: 'Build without coding',
    description: 'Create powerful AI applications using natural language prompts. No programming required.',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    icon: Zap,
    title: 'Automate workflows',
    description: 'Connect AI to your existing workflows and automate repetitive tasks effortlessly.',
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-500/10 to-orange-500/10',
  },
  {
    icon: FileText,
    title: 'Generate instantly',
    description: 'Create websites, tools, and apps in seconds with our advanced AI engine.',
    gradient: 'from-violet-500 to-purple-500',
    bgGradient: 'from-violet-500/10 to-purple-500/10',
  },
  {
    icon: Rocket,
    title: 'Launch faster',
    description: 'Go from idea to production in minutes instead of months with AI-powered development.',
    gradient: 'from-rose-500 to-pink-500',
    bgGradient: 'from-rose-500/10 to-pink-500/10',
  },
  {
    icon: Clock,
    title: 'Save hours daily',
    description: 'Let AI handle the heavy lifting while you focus on what matters most to your business.',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
  },
]

export function BenefitsSection() {
  return (
    <section id="benefits" className="relative px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[300px] w-[300px] translate-x-1/2 translate-y-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            Why BuildForge AI
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything you need to build with AI
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Powerful features that help you create, automate, and scale faster than ever.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card hover:shadow-xl lg:p-8",
                index === 0 && "sm:col-span-2 lg:col-span-1"
              )}
            >
              {/* Hover gradient effect */}
              <div className={cn(
                "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                benefit.bgGradient
              )} />
              
              {/* Icon */}
              <div className={cn(
                "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                benefit.gradient
              )}>
                <benefit.icon className="h-6 w-6" />
              </div>
              
              {/* Content */}
              <h3 className="mb-2 text-lg font-semibold tracking-tight lg:text-xl">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed lg:text-base">
                {benefit.description}
              </p>
              
              {/* Arrow indicator */}
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Learn more
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
