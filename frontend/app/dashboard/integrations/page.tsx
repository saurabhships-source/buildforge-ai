'use client'

import { useState, useEffect } from 'react'
import { Check, ExternalLink, Loader2, Plug } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const INTEGRATIONS = [
  {
    name: 'stripe',
    label: 'Stripe',
    description: 'Accept payments, manage subscriptions, and handle billing in your generated apps.',
    icon: '💳',
    color: 'from-violet-500 to-purple-600',
    category: 'Payments',
    docsUrl: 'https://stripe.com/docs',
    features: ['Payment processing', 'Subscription billing', 'Invoice management'],
  },
  {
    name: 'supabase',
    label: 'Supabase',
    description: 'Add a PostgreSQL database, authentication, and real-time subscriptions.',
    icon: '🗄️',
    color: 'from-green-500 to-emerald-600',
    category: 'Database',
    docsUrl: 'https://supabase.com/docs',
    features: ['PostgreSQL database', 'Auth & users', 'Real-time updates'],
  },
  {
    name: 'openai',
    label: 'OpenAI',
    description: 'Embed AI capabilities — chat, completions, embeddings, and image generation.',
    icon: '🤖',
    color: 'from-gray-700 to-gray-900',
    category: 'AI',
    docsUrl: 'https://platform.openai.com/docs',
    features: ['GPT-4 chat', 'Embeddings', 'Image generation'],
  },
  {
    name: 'sendgrid',
    label: 'SendGrid',
    description: 'Send transactional emails, newsletters, and automated email workflows.',
    icon: '📧',
    color: 'from-blue-500 to-cyan-600',
    category: 'Email',
    docsUrl: 'https://docs.sendgrid.com',
    features: ['Transactional email', 'Email templates', 'Analytics'],
  },
  {
    name: 'slack',
    label: 'Slack',
    description: 'Send notifications, alerts, and messages to Slack channels from your apps.',
    icon: '💬',
    color: 'from-amber-500 to-orange-600',
    category: 'Notifications',
    docsUrl: 'https://api.slack.com',
    features: ['Channel notifications', 'Webhooks', 'Bot messages'],
  },
]

export default function IntegrationsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const toggle = async (name: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [name]: true }))
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'global', name, enabled: value }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setEnabled(prev => ({ ...prev, [name]: value }))
      toast.success(`${name} ${value ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update integration')
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }))
    }
  }

  const categories = [...new Set(INTEGRATIONS.map(i => i.category))]

  return (
    <div className="space-y-8 p-6 overflow-auto h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Plug className="h-6 w-6 text-primary" />
          Integrations
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect services to your generated apps. Enabled integrations are injected into AI prompts automatically.
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.filter(i => i.category === category).map(integration => {
              const isEnabled = enabled[integration.name] ?? false
              const isLoading = loading[integration.name] ?? false

              return (
                <Card key={integration.name} className={`border-border/50 transition-all ${isEnabled ? 'border-primary/30 shadow-md shadow-primary/5' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center text-xl shadow-sm`}>
                          {integration.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base">{integration.label}</CardTitle>
                          <Badge variant="outline" className="text-[10px] mt-0.5">{integration.category}</Badge>
                        </div>
                      </div>
                      {isLoading
                        ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        : <Switch checked={isEnabled} onCheckedChange={v => toggle(integration.name, v)} />
                      }
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription>{integration.description}</CardDescription>
                    <ul className="space-y-1">
                      {integration.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="ghost" size="sm" className="h-7 text-xs w-full" asChild>
                      <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        View Docs
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
