import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partners — BuildForge AI Partner Program',
  description: 'Join the BuildForge AI partner program. Integrate with our platform, refer customers, or build on top of our API.',
  alternates: { canonical: 'https://buildforge.ai/partners' },
}

export default function PartnersPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Partner Program</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Build with BuildForge AI. Integrate our platform, refer customers, or create solutions
        on top of our API.
      </p>

      <div className="grid gap-6 md:grid-cols-3 mb-12">
        {[
          { title: 'Technology Partners', desc: 'Integrate your product with BuildForge AI. Get listed in our integrations directory and co-market to our users.' },
          { title: 'Referral Partners', desc: 'Earn recurring revenue by referring customers to BuildForge. Competitive commission rates for agencies and consultants.' },
          { title: 'Solution Partners', desc: 'Build custom solutions and templates on top of BuildForge for your clients. Access to partner-only features and support.' },
        ].map(p => (
          <div key={p.title} className="p-6 border border-border rounded-xl">
            <h2 className="font-semibold mb-2">{p.title}</h2>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        Interested in partnering? Contact partners@buildforge.ai
      </p>
    </main>
  )
}
