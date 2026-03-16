import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tutorials — Learn to Build with BuildForge AI',
  description: 'Step-by-step tutorials for building websites, SaaS apps, and AI tools with BuildForge. From beginner to advanced.',
  alternates: { canonical: 'https://buildforge.ai/docs/tutorials' },
}

const tutorials = [
  { title: 'Build Your First SaaS in 10 Minutes', level: 'Beginner', time: '10 min' },
  { title: 'Generate a Landing Page with AI', level: 'Beginner', time: '5 min' },
  { title: 'Add Stripe Billing to Your App', level: 'Intermediate', time: '15 min' },
  { title: 'Deploy to Vercel with One Click', level: 'Beginner', time: '5 min' },
  { title: 'Use the Multi-Agent Pipeline', level: 'Intermediate', time: '20 min' },
  { title: 'Generate a Complete Startup', level: 'Advanced', time: '30 min' },
  { title: 'Export to GitHub and Set Up CI/CD', level: 'Intermediate', time: '15 min' },
  { title: 'Use the Repair Agent to Fix Errors', level: 'Beginner', time: '10 min' },
]

export default function TutorialsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Tutorials</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Step-by-step guides for building with BuildForge AI.
      </p>

      <div className="space-y-3">
        {tutorials.map(t => (
          <div key={t.title} className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer">
            <div>
              <h2 className="font-medium">{t.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.level} · {t.time} read</p>
            </div>
            <span className="text-muted-foreground text-sm">→</span>
          </div>
        ))}
      </div>
    </main>
  )
}
