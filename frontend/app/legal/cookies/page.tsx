import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | BuildForge AI',
  description: 'BuildForge AI Cookie Policy. Learn about the cookies we use and how to manage your preferences.',
  alternates: { canonical: 'https://buildforge.ai/legal/cookies' },
}

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 prose prose-neutral dark:prose-invert">
      <h1>Cookie Policy</h1>
      <p className="text-muted-foreground">Last updated: March 1, 2026</p>

      <h2>1. What Are Cookies</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help us
        remember your preferences and improve your experience on BuildForge AI.
      </p>

      <h2>2. Cookies We Use</h2>
      <h3>Essential Cookies</h3>
      <p>
        Required for the platform to function. These include authentication session cookies managed
        by Clerk and security tokens. You cannot opt out of essential cookies.
      </p>

      <h3>Analytics Cookies</h3>
      <p>
        We use analytics cookies to understand how users interact with BuildForge. This data is
        aggregated and anonymized. You can opt out via your browser settings.
      </p>

      <h3>Preference Cookies</h3>
      <p>
        These cookies remember your settings such as theme preference (dark/light mode) and
        editor configuration.
      </p>

      <h2>3. Managing Cookies</h2>
      <p>
        You can control cookies through your browser settings. Disabling essential cookies will
        prevent you from logging in to BuildForge.
      </p>

      <h2>4. Contact</h2>
      <p>For cookie-related questions, contact privacy@buildforge.ai.</p>
    </main>
  )
}
