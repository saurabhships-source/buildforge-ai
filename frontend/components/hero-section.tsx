'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Sparkles, Zap, CheckCircle2, Play } from 'lucide-react'

const DEMO_STEPS = [
  { label: 'Analyzing idea...', color: 'text-violet-400', done: true },
  { label: 'Designing product...', color: 'text-indigo-400', done: true },
  { label: 'Generating code...', color: 'text-cyan-400', done: true },
  { label: 'Fixing errors...', color: 'text-amber-400', done: false },
  { label: 'Deploying app...', color: 'text-emerald-400', done: false },
]

const PROMPT = 'Build a SaaS CRM with analytics dashboard'

export function HeroSection() {
  const [typed, setTyped] = useState('')
  const [stepIdx, setStepIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Typewriter for prompt
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      setTyped(PROMPT.slice(0, ++i))
      if (i >= PROMPT.length) clearInterval(t)
    }, 38)
    return () => clearInterval(t)
  }, [])

  // Animate pipeline steps
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStepIdx(s => (s + 1) % (DEMO_STEPS.length + 2))
    }, 900)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return (
    <section className="relative overflow-hidden px-4 pb-0 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-36">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[800px] w-[1100px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/10 blur-[160px] dark:bg-violet-600/20" />
        <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-indigo-600/6 blur-[120px] dark:bg-indigo-600/14" />
        <div className="absolute right-1/4 top-1/3 h-[350px] w-[350px] rounded-full bg-cyan-500/5 blur-[100px] dark:bg-cyan-500/12" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-0 dark:opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-50 px-4 py-1.5 text-sm backdrop-blur-sm dark:border-violet-500/20 dark:bg-violet-500/10">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
          </span>
          <span className="font-medium text-violet-700 dark:text-violet-300">AI SaaS Builder · Startup Generator · Growth Engine</span>
          <ArrowRight className="h-3 w-3 text-violet-500" />
        </div>

        {/* Headline */}
        <h1 className="text-balance text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl md:text-7xl lg:text-[82px] lg:leading-[1.04]">
          Build and Launch
          <br />
          <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-indigo-400 dark:to-cyan-400">
            AI Startups in Minutes
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl">
          Generate full-stack SaaS products, deploy instantly, and grow your startup with AI.
          From idea to live product — no code required.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base font-semibold text-white shadow-xl shadow-violet-500/30 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/50 hover:-translate-y-0.5"
          >
            <Zap className="h-4 w-4" />
            Start Building
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/apps"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-8 text-base font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400 hover:-translate-y-0.5 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-white/25 dark:hover:bg-white/10"
          >
            <Play className="h-4 w-4" />
            View Examples
          </Link>
        </div>

        {/* Trust */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500 dark:text-slate-400">
          {['No credit card required', 'Free tier available', '14-day free trial'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {t}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-6">
          {[
            { value: '10k+', label: 'Developers' },
            { value: '50k+', label: 'Apps Built' },
            { value: '< 3min', label: 'Avg Build Time' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/3 sm:p-6"
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live demo mockup */}
      <div className="relative mx-auto mt-20 max-w-6xl px-4">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white dark:from-[#080810] to-transparent" />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-300/40 dark:border-white/8 dark:bg-[#0d0d18] dark:shadow-[0_0_120px_rgba(120,80,255,0.18)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-white/6 dark:bg-[#0a0a14]">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 rounded-md bg-slate-100 px-3 py-1 text-center text-xs text-slate-400 dark:bg-white/5 dark:text-white/30">
              buildforge.ai/dashboard/builder
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </div>
          </div>

          <div className="flex h-[460px] sm:h-[560px]">
            {/* Left: prompt + pipeline */}
            <div className="flex w-full flex-col sm:w-80 shrink-0 border-r border-slate-200 bg-white dark:border-white/6 dark:bg-[#0a0a14]">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-white/6">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30">AI Builder</div>
              </div>
              {/* Prompt */}
              <div className="p-4">
                <div className="rounded-xl border border-violet-300/50 bg-violet-50 p-3 dark:border-violet-500/20 dark:bg-violet-500/8">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span className="text-xs text-slate-700 dark:text-white/70">
                      {typed}
                      <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-violet-500" />
                    </span>
                  </div>
                </div>
              </div>
              {/* Pipeline steps */}
              <div className="flex-1 space-y-2 px-4 pb-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-3">AI Pipeline</div>
                {DEMO_STEPS.map((step, i) => {
                  const isDone = i < stepIdx
                  const isActive = i === stepIdx
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all ${
                        isDone
                          ? 'bg-emerald-50 dark:bg-emerald-500/8'
                          : isActive
                          ? 'bg-violet-50 dark:bg-violet-500/10'
                          : 'opacity-30'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : isActive ? (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300 dark:border-white/20" />
                      )}
                      <span className={isDone ? 'text-emerald-700 dark:text-emerald-300' : isActive ? step.color : 'text-slate-400 dark:text-white/30'}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: code preview */}
            <div className="hidden flex-1 flex-col sm:flex bg-white dark:bg-[#0d0d18]">
              <div className="border-b border-slate-200 px-4 py-2.5 dark:border-white/6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-slate-400 dark:text-white/30">Generated Code</span>
              </div>
              <div className="flex-1 overflow-hidden p-5 font-mono text-[11px] leading-relaxed">
                <div className="space-y-1.5">
                  {[
                    ['text-slate-400', "// CRM Dashboard — generated by BuildForge AI"],
                    ['text-violet-500', "import", 'text-slate-300', " { useState } ", 'text-violet-500', "from", 'text-emerald-400', " 'react'"],
                    ['text-violet-500', "import", 'text-slate-300', " { db } ", 'text-violet-500', "from", 'text-emerald-400', " '@/lib/db'"],
                    [''],
                    ['text-violet-500', "export default function", 'text-cyan-400', " Dashboard", 'text-slate-300', "() {"],
                    ['text-slate-300', "  const [contacts, setContacts] = useState([])"],
                    ['text-slate-300', "  const [deals, setDeals] = useState([])"],
                    [''],
                    ['text-slate-300', "  return ("],
                    ['text-slate-300', "    <main className=", 'text-emerald-400', '"dashboard"', 'text-slate-300', ">"],
                    ['text-slate-300', "      <KPICards contacts={contacts} />"],
                    ['text-slate-300', "      <DealPipeline deals={deals} />"],
                    ['text-slate-300', "      <AnalyticsChart />"],
                    ['text-slate-300', "    </main>"],
                    ['text-slate-300', "  )"],
                    ['text-slate-300', "}"],
                  ].map((line, i) => (
                    <div key={i} className="flex flex-wrap gap-0">
                      {line.length === 1
                        ? <span className="h-4 block" />
                        : line.reduce<React.ReactNode[]>((acc, part, j) => {
                            if (j % 2 === 0) acc.push(<span key={j} className={part}>{line[j + 1]}</span>)
                            return acc
                          }, [])}
                    </div>
                  ))}
                </div>
              </div>
              {/* Preview strip */}
              <div className="border-t border-slate-200 bg-slate-50 p-3 dark:border-white/6 dark:bg-[#0a0a14]">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-white/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Preview ready · 47 files generated · 0 errors
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
