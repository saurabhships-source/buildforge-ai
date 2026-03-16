import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | BuildForge AI',
  description: 'BuildForge AI Terms of Service. Read the terms governing your use of the BuildForge platform.',
  alternates: { canonical: 'https://buildforge.ai/legal/terms' },
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 prose prose-neutral dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: March 1, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using BuildForge AI, you agree to be bound by these Terms of Service. If you
        do not agree, do not use the platform.
      </p>

      <h2>2. Use of the Platform</h2>
      <p>
        BuildForge AI grants you a non-exclusive, non-transferable license to use the platform for
        lawful purposes. You may not use BuildForge to generate malicious code, spam, or content that
        violates applicable laws.
      </p>

      <h2>3. Ownership of Generated Content</h2>
      <p>
        You retain full ownership of all code, content, and applications generated using BuildForge AI.
        BuildForge does not claim any intellectual property rights over your generated output.
      </p>

      <h2>4. Credits and Billing</h2>
      <p>
        Credits are consumed per generation. Unused credits do not roll over between billing periods
        on the Free plan. Pro and Enterprise plans include unlimited credits. Refunds are handled on
        a case-by-case basis within 7 days of purchase.
      </p>

      <h2>5. Service Availability</h2>
      <p>
        We aim for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance
        will be communicated in advance where possible.
      </p>

      <h2>6. Termination</h2>
      <p>
        We reserve the right to suspend or terminate accounts that violate these terms. You may cancel
        your account at any time from the billing settings page.
      </p>

      <h2>7. Contact</h2>
      <p>For questions about these terms, contact legal@buildforge.ai.</p>
    </main>
  )
}
