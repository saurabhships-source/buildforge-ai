import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Help Center — BuildForge AI Support',
  description: 'Get help with BuildForge AI. Find answers to common questions about building websites, SaaS apps, billing, and deployment.',
  alternates: { canonical: 'https://buildforge.ai/help' },
}

const faqs = [
  { q: 'How do credits work?', a: 'Each generation uses 1 credit. Startup mode uses 3 credits. Autonomous pipeline mode uses up to 9 credits. Free plan includes 100 credits per month.' },
  { q: 'What frameworks does BuildForge generate?', a: 'BuildForge primarily generates Next.js (App Router) applications with TypeScript and Tailwind CSS. HTML/CSS output is also supported for simple websites.' },
  { q: 'Can I export my code?', a: 'Yes. You can export your project to GitHub or download the source files at any time. You own all generated code.' },
  { q: 'How do I deploy my project?', a: 'BuildForge supports one-click deployment to Vercel, Netlify, and Railway. Connect your account and deploy directly from the builder.' },
  { q: 'What happens if the AI generates broken code?', a: 'BuildForge includes a self-healing repair agent that automatically detects and fixes errors. If the repair agent can\'t fix an issue, you can edit the code directly in the built-in editor.' },
  { q: 'Can I use my own AI API keys?', a: 'Yes. Pro and Enterprise plans support custom OpenAI, Gemini, and other model API keys via the integrations panel.' },
]

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Help Center</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Answers to common questions about BuildForge AI.
      </p>

      <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
      <div className="space-y-6">
        {faqs.map(faq => (
          <div key={faq.q} className="border-b border-border pb-6">
            <h3 className="font-semibold mb-2">{faq.q}</h3>
            <p className="text-muted-foreground text-sm">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 border border-border rounded-xl">
        <h2 className="font-semibold mb-2">Still need help?</h2>
        <p className="text-sm text-muted-foreground mb-4">Can't find what you're looking for? Check the docs or reach out.</p>
        <Link href="/docs" className="text-sm text-primary hover:underline">Browse Documentation →</Link>
      </div>
    </main>
  )
}
