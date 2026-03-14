'use client'

import Link from 'next/link'
import { ArrowRight, Play, Sparkles, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Main gradient orbs */}
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/4 animate-pulse rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-transparent blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] translate-x-1/2 animate-pulse rounded-full bg-gradient-to-bl from-accent/30 via-accent/20 to-transparent blur-3xl [animation-delay:1s]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-t from-primary/20 to-transparent blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/10">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text font-medium text-transparent">
            Now in public beta - Try it free
          </span>
          <ArrowRight className="h-3 w-3 text-primary" />
        </div>

        {/* Headline */}
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Build AI-powered tools
          <br />
          <span className="relative mt-2 inline-block">
            <span className="relative z-10 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient_3s_linear_infinite]">
              in seconds
            </span>
            <span className="absolute -inset-1 -z-10 block rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 blur-xl" />
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl leading-relaxed">
          Create websites, tools, and software with AI. No coding required. 
          Launch faster than ever before with our intelligent builder.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="group relative h-12 gap-2 overflow-hidden px-8 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30">
            <Link href="/signup">
              <span className="relative z-10 flex items-center gap-2">
                Start Building Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="group h-12 gap-2 border-border/60 bg-background/50 text-base backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5">
            <Link href="/dashboard/builder">
              <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
              Watch Demo
            </Link>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground sm:gap-10">
          <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 backdrop-blur-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8">
          <div className="group rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/50 sm:p-6">
            <div className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">10k+</div>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">Active Users</div>
          </div>
          <div className="group rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/50 sm:p-6">
            <div className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">50k+</div>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">Tools Created</div>
          </div>
          <div className="group rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/50 sm:p-6">
            <div className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">99.9%</div>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">Uptime SLA</div>
          </div>
        </div>
      </div>
    </section>
  )
}
