import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Get in Touch with BuildForge AI',
  description: 'Contact the BuildForge AI team for support, sales, partnerships, or press inquiries.',
  alternates: { canonical: 'https://buildforge.ai/contact' },
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-xl text-muted-foreground mb-12">
        We'd love to hear from you. Reach out for support, sales, or partnerships.
      </p>

      <div className="space-y-6 mb-12">
        {[
          { label: 'General Support', email: 'support@buildforge.ai', desc: 'Help with your account or projects' },
          { label: 'Sales & Enterprise', email: 'sales@buildforge.ai', desc: 'Custom plans and enterprise pricing' },
          { label: 'Partnerships', email: 'partners@buildforge.ai', desc: 'Integration and partnership opportunities' },
          { label: 'Press', email: 'press@buildforge.ai', desc: 'Media inquiries and press resources' },
        ].map(c => (
          <div key={c.label} className="p-5 border border-border rounded-xl">
            <h2 className="font-semibold mb-1">{c.label}</h2>
            <p className="text-sm text-muted-foreground mb-2">{c.desc}</p>
            <a href={`mailto:${c.email}`} className="text-sm text-primary hover:underline">{c.email}</a>
          </div>
        ))}
      </div>
    </main>
  )
}
