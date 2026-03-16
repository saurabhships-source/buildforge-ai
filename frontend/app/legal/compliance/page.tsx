import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compliance — BuildForge AI Data and Security Compliance',
  description: 'BuildForge AI compliance information including GDPR, data processing, and security standards.',
  alternates: { canonical: 'https://buildforge.ai/legal/compliance' },
}

export default function CompliancePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 prose prose-neutral dark:prose-invert">
      <h1>Compliance</h1>
      <p className="text-muted-foreground">Last updated: March 1, 2026</p>

      <h2>GDPR</h2>
      <p>
        BuildForge AI is committed to compliance with the General Data Protection Regulation (GDPR)
        for users in the European Union. We process personal data only as necessary to provide the
        platform, and we provide mechanisms for data access, correction, and deletion upon request.
      </p>

      <h2>Data Processing</h2>
      <p>
        We act as a data processor for content you generate using BuildForge. You retain ownership
        of all generated code and content. We process your prompts and generation requests solely
        to provide the service.
      </p>

      <h2>Data Retention</h2>
      <p>
        Account data is retained for the duration of your subscription plus 90 days after
        cancellation. You can request immediate deletion of your data by contacting privacy@buildforge.ai.
      </p>

      <h2>Sub-processors</h2>
      <p>We use the following sub-processors to deliver our service:</p>
      <ul>
        <li>Clerk — authentication and user management</li>
        <li>Stripe — payment processing</li>
        <li>Vercel — application hosting</li>
        <li>OpenAI / Google — AI model inference</li>
      </ul>

      <h2>Contact</h2>
      <p>For compliance inquiries, contact privacy@buildforge.ai.</p>
    </main>
  )
}
