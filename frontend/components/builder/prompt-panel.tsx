'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send, Sparkles, Wand2, Bug, Palette, RefreshCw, Rocket,
  Globe, Shield, Search, Zap, Code2, BarChart3,
  ShoppingCart, Layers, ChevronDown, ChevronUp, MessageSquare, User, Bot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AgentType } from '@/lib/builder-types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  agent?: AgentType
  isPatch?: boolean
}

const QUICK_ACTIONS = [
  { label: 'Improve UI', agent: 'ui' as AgentType, icon: Palette, color: 'text-pink-500', prompt: 'Dramatically improve the visual design — add glassmorphism, gradients, animations, and micro-interactions. Make it look world-class.' },
  { label: 'Fix Bugs', agent: 'debug' as AgentType, icon: Bug, color: 'text-red-500', prompt: 'Find and fix all bugs, errors, and broken functionality. Test all interactive elements.' },
  { label: 'Add SEO', agent: 'seo' as AgentType, icon: Search, color: 'text-blue-500', prompt: 'Add complete SEO: meta tags, Open Graph, Twitter cards, JSON-LD schema, sitemap.xml, robots.txt' },
  { label: 'Security', agent: 'security' as AgentType, icon: Shield, color: 'text-orange-500', prompt: 'Audit and fix all security vulnerabilities. Add CSP headers, sanitize inputs, prevent XSS.' },
  { label: 'Refactor', agent: 'refactor' as AgentType, icon: RefreshCw, color: 'text-amber-500', prompt: 'Refactor code for maintainability, performance, and best practices. Add proper error handling.' },
  { label: 'Deploy', agent: 'deploy' as AgentType, icon: Rocket, color: 'text-green-500', prompt: 'Prepare for production: optimize assets, add caching headers, create deployment config.' },
  { label: 'Performance', agent: 'performance' as AgentType, icon: Zap, color: 'text-yellow-500', prompt: 'Optimize performance: lazy loading, code splitting, image optimization, reduce bundle size.' },
  { label: 'UX Polish', agent: 'ux' as AgentType, icon: Sparkles, color: 'text-purple-500', prompt: 'Improve UX: better user flows, accessibility, loading states, empty states, error states.' },
]

type TemplateCategory = 'websites' | 'tools' | 'saas' | 'dashboards' | 'ai' | 'ecommerce'

const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; icon: React.ElementType }[] = [
  { id: 'websites', label: 'Websites', icon: Globe },
  { id: 'tools', label: 'Tools', icon: Code2 },
  { id: 'saas', label: 'SaaS', icon: Layers },
  { id: 'dashboards', label: 'Dashboards', icon: BarChart3 },
  { id: 'ai', label: 'AI Apps', icon: Sparkles },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
]

const TEMPLATES: Record<TemplateCategory, { label: string; prompt: string }[]> = {
  websites: [
    { label: '🚀 SaaS Landing Page', prompt: 'Build a stunning SaaS landing page with animated hero, feature grid, social proof logos, pricing table with toggle (monthly/yearly), testimonials carousel, FAQ accordion, and email capture CTA. Use glassmorphism cards and gradient accents.' },
    { label: '🎨 Portfolio / Agency', prompt: 'Build a creative agency portfolio with full-screen hero, animated project grid with hover overlays, about section with team cards, services with icons, client logos, and contact form with map.' },
    { label: '📱 App Landing Page', prompt: 'Build a mobile app landing page with device mockup hero, feature showcase with screenshots, download buttons for iOS and Android, user reviews, and animated stats counter.' },
    { label: '🏢 Corporate Website', prompt: 'Build a professional corporate website with hero video background, services grid, about timeline, team section, case studies, and contact form.' },
  ],
  tools: [
    { label: '🧮 Calculator Suite', prompt: 'Build a multi-mode calculator with standard, scientific, programmer modes with hex/bin/oct, and unit converter. Include history panel, keyboard support, and copy results.' },
    { label: '📝 Text Transformer', prompt: 'Build a text transformation tool with modes: case converter, word counter, readability score, markdown preview, JSON formatter, base64 encoder/decoder, and URL encoder. Real-time processing.' },
    { label: '🎨 Color Palette Generator', prompt: 'Build a color palette generator with color picker, harmony modes (complementary, triadic, analogous), palette export (CSS vars, Tailwind, SCSS), contrast checker, and gradient builder.' },
    { label: '⏱️ Productivity Timer', prompt: 'Build a Pomodoro timer with custom work/break intervals, task list, session history chart, ambient sound selector, and desktop notifications.' },
  ],
  saas: [
    { label: '📊 Analytics SaaS', prompt: 'Build a complete analytics SaaS with marketing landing page, dashboard with charts (line, bar, funnel, heatmap), user segmentation, event tracking UI, report builder, and billing page.' },
    { label: '🤝 CRM Platform', prompt: 'Build a CRM SaaS with contacts database, deal pipeline (Kanban), email sequences, activity timeline, revenue forecasting chart, team inbox, and automation rules UI.' },
    { label: '📋 Project Management', prompt: 'Build a project management SaaS with Kanban board, Gantt chart view, team workload view, time tracking, sprint planning, and burndown chart.' },
    { label: '💬 Customer Support', prompt: 'Build a customer support SaaS with ticket inbox, live chat UI, knowledge base, canned responses, SLA tracking, and customer satisfaction dashboard.' },
  ],
  dashboards: [
    { label: '📈 Business Intelligence', prompt: 'Build a BI dashboard with KPI cards (revenue, users, conversion, churn), revenue trend chart, geographic heatmap, cohort analysis table, top products list, and real-time activity feed.' },
    { label: '🛒 E-commerce Admin', prompt: 'Build an e-commerce admin dashboard with sales overview, order management table, inventory tracker, customer list, product catalog, and revenue analytics.' },
    { label: '🏥 Healthcare Dashboard', prompt: 'Build a healthcare admin dashboard with patient overview, appointment calendar, vitals charts, medication tracker, staff schedule, and billing summary.' },
    { label: '🔧 DevOps Dashboard', prompt: 'Build a DevOps monitoring dashboard with server health cards, deployment pipeline status, error rate charts, log viewer, alert management, and uptime tracker.' },
  ],
  ai: [
    { label: '🤖 AI Chat Interface', prompt: 'Build a ChatGPT-style AI chat interface with conversation sidebar, streaming message display, markdown rendering, code blocks with syntax highlighting, model selector, and conversation export.' },
    { label: '✍️ AI Writing Assistant', prompt: 'Build an AI writing assistant with document editor, tone selector, writing modes (blog, email, social, ad copy), grammar checker UI, plagiarism score, and export options.' },
    { label: '🖼️ AI Image Generator', prompt: 'Build an AI image generation UI with prompt input, style presets, aspect ratio selector, generation history grid, image editor tools, and download/share options.' },
    { label: '📊 AI Data Analyzer', prompt: 'Build an AI data analysis tool with CSV upload, auto-generated charts, natural language query input, insight cards, anomaly detection alerts, and report export.' },
  ],
  ecommerce: [
    { label: '🛍️ Fashion Store', prompt: 'Build a fashion e-commerce store with hero banner, product grid with filters (size, color, price), product detail page with image gallery, size guide, cart drawer, and checkout flow.' },
    { label: '🍕 Food Delivery App', prompt: 'Build a food delivery app UI with restaurant listing, menu with categories, cart with customizations, order tracking map, order history, and loyalty points.' },
    { label: '💻 Tech Store', prompt: 'Build a tech product store with featured products hero, category navigation, product comparison table, spec sheets, reviews with ratings, and wishlist.' },
    { label: '📚 Digital Products', prompt: 'Build a digital products marketplace with course/ebook listings, preview modals, purchase flow, download manager, review system, and creator dashboard.' },
  ],
}

const STARTUP_TEMPLATES = [
  { label: '🚀 AI SaaS Starter', prompt: 'Build a complete AI SaaS product: landing page with pricing, user dashboard with AI prompt interface, usage analytics, API key management, team settings, and billing page. Include onboarding flow.' },
  { label: '📊 Analytics Platform', prompt: 'Build a full analytics platform SaaS: marketing site, event tracking dashboard, funnel analysis, user cohorts, A/B testing UI, custom reports, and white-label options.' },
  { label: '🤝 B2B CRM Suite', prompt: 'Build a B2B CRM SaaS: landing page, contact management, deal pipeline, email automation, meeting scheduler, revenue dashboard, and team collaboration features.' },
  { label: '🛒 E-commerce Platform', prompt: 'Build a complete e-commerce SaaS: store builder landing page, product management dashboard, order processing, inventory tracking, customer analytics, and payment settings.' },
  { label: '📋 Project Management SaaS', prompt: 'Build a project management platform: marketing landing page, workspace dashboard, Kanban + Gantt views, team management, time tracking, invoicing, and client portal.' },
  { label: '🎓 EdTech Platform', prompt: 'Build an online learning platform: course marketplace landing, student dashboard, video player with notes, quiz system, progress tracking, certificates, and instructor analytics.' },
]

interface Props {
  isGenerating: boolean
  hasFiles: boolean
  autonomousMode?: boolean
  chatHistory: ChatMessage[]
  generationStatus?: string
  onGenerate: (prompt: string, forceAgent?: AgentType, startupMode?: boolean) => void
  onCancel?: () => void
}

export function PromptPanel({ isGenerating, hasFiles, autonomousMode, chatHistory, generationStatus, onGenerate, onCancel }: Props) {
  const [prompt, setPrompt] = useState('')
  const [tab, setTab] = useState<'chat' | 'build' | 'templates' | 'startup'>(hasFiles ? 'chat' : 'build')
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('websites')
  const [showAllActions, setShowAllActions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Switch to chat tab when files appear
  useEffect(() => {
    if (hasFiles && tab === 'build') setTab('chat')
  }, [hasFiles, tab])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return
    onGenerate(prompt, undefined, tab === 'startup')
    setPrompt('')
  }

  const handleTemplate = (t: { prompt: string }, startup?: boolean) => {
    setPrompt(t.prompt)
    setTab(startup ? 'startup' : 'build')
    textareaRef.current?.focus()
  }

  const visibleActions = showAllActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 4)
  const creditCost = tab === 'startup'
    ? 15  // CREDIT_COSTS.startupGenerator
    : autonomousMode
    ? 20  // CREDIT_COSTS.autonomousPipeline
    : hasFiles
    ? 2   // CREDIT_COSTS.improveCode (patch mode)
    : 10  // CREDIT_COSTS.generateProject

  return (
    <div className="shrink-0 border-t border-border/50 bg-card/30 p-3 space-y-2.5">
      {/* Tab switcher */}
      <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50">
        {[
          { id: 'chat', label: '💬 Chat', show: hasFiles },
          { id: 'build', label: 'Build' },
          { id: 'templates', label: 'Templates' },
          { id: 'startup', label: '🚀 Startup' },
        ].filter(t => t.show !== false).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              'flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all',
              tab === t.id
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CHAT TAB — shows when files exist */}
      {tab === 'chat' && (
        <div className="space-y-2">
          {/* Chat history */}
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {chatHistory.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                Describe changes to edit your project with AI
              </p>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={cn('flex gap-1.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[85%] rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}>
                    {msg.content}
                    {msg.isPatch && (
                      <span className="ml-1 opacity-60 text-[9px]">(patch)</span>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-1">
            {visibleActions.map(action => {
              const Icon = action.icon
              return (
                <button
                  key={action.agent}
                  onClick={() => onGenerate(action.prompt, action.agent)}
                  disabled={isGenerating}
                  className="flex items-center gap-1 px-2 py-1 rounded-md border border-border/50 bg-card text-[10px] hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <Icon className={`h-3 w-3 ${action.color}`} />
                  {action.label}
                </button>
              )
            })}
            <button
              onClick={() => setShowAllActions(v => !v)}
              className="flex items-center gap-0.5 px-2 py-1 rounded-md border border-border/50 bg-card text-[10px] text-muted-foreground hover:bg-muted transition-colors"
            >
              {showAllActions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showAllActions ? 'Less' : 'More'}
            </button>
          </div>
        </div>
      )}

      {/* BUILD TAB */}
      {tab === 'build' && (
        <>
          {hasFiles && (
            <div className="flex flex-wrap gap-1">
              {visibleActions.map(action => {
                const Icon = action.icon
                return (
                  <button
                    key={action.agent}
                    onClick={() => onGenerate(action.prompt, action.agent)}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-2 py-1 rounded-md border border-border/50 bg-card text-[10px] hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Icon className={`h-3 w-3 ${action.color}`} />
                    {action.label}
                  </button>
                )
              })}
              <button
                onClick={() => setShowAllActions(v => !v)}
                className="flex items-center gap-0.5 px-2 py-1 rounded-md border border-border/50 bg-card text-[10px] text-muted-foreground hover:bg-muted transition-colors"
              >
                {showAllActions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showAllActions ? 'Less' : 'More'}
              </button>
            </div>
          )}

          {!hasFiles && (
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: '🌐 SaaS Landing', prompt: 'Build a stunning SaaS landing page with animated hero, feature grid, pricing table, testimonials, and email capture.' },
                { label: '📊 Dashboard', prompt: 'Build a professional admin dashboard with sidebar, KPI cards, charts, data table, and activity feed.' },
                { label: '🤖 AI Chat App', prompt: 'Build a ChatGPT-style AI chat interface with conversation history, streaming display, and code highlighting.' },
                { label: '🛒 E-commerce', prompt: 'Build a modern e-commerce store with product grid, filters, cart drawer, and checkout flow.' },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={() => handleTemplate(t)}
                  className="text-left px-2.5 py-2 rounded-lg border border-border/50 bg-card text-[10px] hover:bg-muted hover:border-primary/30 transition-all leading-relaxed"
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* TEMPLATES TAB */}
      {tab === 'templates' && (
        <div className="space-y-2">
          <div className="flex gap-1 flex-wrap">
            {TEMPLATE_CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setTemplateCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border',
                    templateCategory === cat.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {TEMPLATES[templateCategory].map(t => (
              <button
                key={t.label}
                onClick={() => handleTemplate(t)}
                className="w-full text-left px-2.5 py-2 rounded-lg border border-border/50 bg-card text-[10px] hover:bg-muted hover:border-primary/30 transition-all"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STARTUP TAB */}
      {tab === 'startup' && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          <p className="text-[10px] text-muted-foreground px-0.5">Full-stack startup — landing page + app + SEO + deploy config</p>
          {STARTUP_TEMPLATES.map(t => (
            <button
              key={t.label}
              onClick={() => handleTemplate(t, true)}
              className="w-full text-left px-2.5 py-2 rounded-lg border border-border/50 bg-card text-[10px] hover:bg-muted hover:border-primary/30 transition-all"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Generation status */}
      {isGenerating && generationStatus && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20 text-[10px] text-primary">
          <Sparkles className="h-3 w-3 animate-pulse shrink-0" />
          <span className="flex-1 truncate">{generationStatus}</span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="shrink-0 px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-[9px] font-medium transition-colors"
              title="Cancel generation"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Prompt input */}
      <form onSubmit={handleSubmit} className="space-y-1.5">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent) }
            }}
            placeholder={
              tab === 'startup'
                ? 'Describe your startup idea...'
                : hasFiles
                  ? 'Describe changes... (Enter to send, Shift+Enter for newline)'
                  : 'Describe what you want to build...'
            }
            rows={3}
            className="resize-none text-xs pr-10 bg-background leading-relaxed"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!prompt.trim() || isGenerating}
            className="absolute bottom-2 right-2 h-7 w-7 p-0"
          >
            {isGenerating
              ? <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              : <Send className="h-3.5 w-3.5" />
            }
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Wand2 className="h-3 w-3" />
            {tab === 'startup'
              ? <span className="text-blue-500 font-medium">Full startup: landing + app + SEO + deploy</span>
              : autonomousMode
                ? <span className="text-purple-500 font-medium">Autonomous — 10 agents will run</span>
                : hasFiles
                  ? <span className="text-green-500 font-medium">Patch mode — only changed files updated</span>
                  : <span>AI selects the best agent for your request</span>
            }
          </div>
          <Badge variant="outline" className="text-[10px] h-4 shrink-0">
            {creditCost} credit{creditCost !== 1 ? 's' : ''}
          </Badge>
        </div>
      </form>
    </div>
  )
}
