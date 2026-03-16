import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Website Builder — Build Websites Instantly with AI | BuildForge',
  description: 'BuildForge AI Website Builder generates complete, production-ready websites from a single prompt. No coding required. Deploy in minutes.',
  keywords: ['AI website builder', 'build website with AI', 'AI web design', 'generate website automatically'],
  alternates: { canonical: 'https://buildforge.ai/product/ai-website-builder' },
}

export default function AIWebsiteBuilderPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">AI Website Builder</h1>
      <p className="text-xl text-muted-foreground mb-10">
        Generate complete, production-ready websites from a single prompt. BuildForge AI writes the code,
        designs the layout, and deploys your site — all in minutes.
      </p>

      <h2 className="text-2xl font-semibold mb-4">What is an AI Website Builder?</h2>
      <p className="text-muted-foreground mb-6">
        An AI website builder uses large language models to generate HTML, CSS, and JavaScript from natural
        language descriptions. BuildForge goes further — it generates full Next.js applications with SEO
        metadata, responsive design, and deployment-ready code.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>Generate full websites from a single text prompt</li>
        <li>Automatic SEO meta tags, Open Graph, and structured data</li>
        <li>Responsive Tailwind CSS layouts out of the box</li>
        <li>One-click deployment to Vercel or Netlify</li>
        <li>Live preview and code editor built in</li>
        <li>AI repair agent fixes errors automatically</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Who is it for?</h2>
      <p className="text-muted-foreground mb-8">
        BuildForge AI Website Builder is built for founders, marketers, and developers who need to ship
        websites fast. Whether you're building a landing page, portfolio, or product site — describe it
        and BuildForge builds it.
      </p>

      <Link
        href="/signup"
        className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Start Building for Free
      </Link>
    </main>
  )
}
