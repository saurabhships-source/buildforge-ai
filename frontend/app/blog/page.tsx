import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — AI Builder Guides, Tutorials & Updates | BuildForge',
  description: 'Read the BuildForge blog for guides on AI website building, SaaS development, startup generation, and the latest platform updates.',
  alternates: { canonical: 'https://buildforge.ai/blog' },
}

const posts = [
  {
    slug: 'how-to-build-saas-with-ai',
    title: 'How to Build a SaaS Product with AI in 2026',
    desc: 'A step-by-step guide to generating a complete SaaS application using BuildForge AI — from idea to deployed product.',
    date: 'March 10, 2026',
  },
  {
    slug: 'ai-website-builder-guide',
    title: 'The Complete Guide to AI Website Builders',
    desc: 'What to look for in an AI website builder, and how BuildForge compares to traditional development and other AI tools.',
    date: 'March 5, 2026',
  },
  {
    slug: 'launch-startup-with-ai',
    title: 'How to Launch a Startup with AI in One Day',
    desc: 'Solo founders are using AI to compress months of work into hours. Here\'s how to use BuildForge to launch your startup fast.',
    date: 'February 28, 2026',
  },
  {
    slug: 'multi-agent-ai-development',
    title: 'Multi-Agent AI: The Future of Software Development',
    desc: 'How coordinated AI agents — architect, builder, QA, and deploy — produce better software than a single model.',
    date: 'February 20, 2026',
  },
]

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Blog</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Guides, tutorials, and updates from the BuildForge team.
      </p>

      <div className="space-y-6">
        {posts.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block p-6 border border-border rounded-xl hover:border-primary/50 transition-colors">
            <p className="text-xs text-muted-foreground mb-2">{post.date}</p>
            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-muted-foreground text-sm">{post.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
