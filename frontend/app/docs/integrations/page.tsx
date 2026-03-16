import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Integration Guides — Connect BuildForge with Your Stack | BuildForge',
  description: 'Integration guides for connecting BuildForge AI with Stripe, Supabase, OpenAI, GitHub, Vercel, and more.',
  alternates: { canonical: 'https://buildforge.ai/docs/integrations' },
}

const integrations = [
  { name: 'Stripe', desc: 'Add billing and subscriptions to generated apps', status: 'Available' },
  { name: 'Supabase', desc: 'PostgreSQL database and real-time features', status: 'Available' },
  { name: 'Clerk', desc: 'Authentication and user management', status: 'Available' },
  { name: 'GitHub', desc: 'Export projects and set up CI/CD', status: 'Available' },
  { name: 'Vercel', desc: 'One-click deployment for Next.js apps', status: 'Available' },
  { name: 'OpenAI', desc: 'Use your own OpenAI API key for generation', status: 'Available' },
  { name: 'Resend', desc: 'Transactional email for generated apps', status: 'Available' },
  { name: 'Slack', desc: 'Notifications and workflow automation', status: 'Coming Soon' },
]

export default function IntegrationsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Integration Guides</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Connect BuildForge with the tools and services you already use.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map(i => (
          <div key={i.name} className="p-5 border border-border rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">{i.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === 'Available' ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {i.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{i.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
