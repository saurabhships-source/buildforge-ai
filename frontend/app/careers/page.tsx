import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers — Join the BuildForge AI Team',
  description: 'Join the BuildForge AI team. We\'re building the future of AI-powered software development. See open roles.',
  alternates: { canonical: 'https://buildforge.ai/careers' },
}

export default function CareersPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Careers at BuildForge AI</h1>
      <p className="text-xl text-muted-foreground mb-10">
        We're building the platform that lets anyone create software with AI. Join us.
      </p>

      <h2 className="text-2xl font-semibold mb-6">Open Roles</h2>
      <div className="space-y-4 mb-12">
        {[
          { title: 'Senior AI Engineer', team: 'Engineering', location: 'Remote' },
          { title: 'Full-Stack Engineer (Next.js)', team: 'Engineering', location: 'Remote' },
          { title: 'Product Designer', team: 'Design', location: 'Remote' },
          { title: 'Growth Marketer', team: 'Marketing', location: 'Remote' },
        ].map(role => (
          <div key={role.title} className="flex items-center justify-between p-5 border border-border rounded-xl hover:border-primary/50 transition-colors">
            <div>
              <h3 className="font-semibold">{role.title}</h3>
              <p className="text-sm text-muted-foreground">{role.team} · {role.location}</p>
            </div>
            <span className="text-sm text-primary">Apply →</span>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        Don't see a role that fits? Send your resume to careers@buildforge.ai
      </p>
    </main>
  )
}
