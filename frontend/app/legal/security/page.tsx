import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security | BuildForge AI',
  description: 'BuildForge AI security practices. Learn how we protect your data, code, and account.',
  alternates: { canonical: 'https://buildforge.ai/legal/security' },
}

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 prose prose-neutral dark:prose-invert">
      <h1>Security</h1>
      <p className="text-muted-foreground">Last updated: March 1, 2026</p>

      <h2>Our Security Practices</h2>
      <p>
        Security is a core part of how BuildForge AI is built and operated. Here's how we protect
        your data and your generated applications.
      </p>

      <h2>Authentication</h2>
      <p>
        BuildForge uses Clerk for authentication, which provides industry-standard security including
        multi-factor authentication (MFA), session management, and brute-force protection.
      </p>

      <h2>Data Encryption</h2>
      <p>
        All data is encrypted in transit using TLS 1.3. Database data is encrypted at rest using
        AES-256 encryption provided by our infrastructure partners.
      </p>

      <h2>Payment Security</h2>
      <p>
        Payment processing is handled entirely by Stripe, a PCI DSS Level 1 certified provider.
        BuildForge never stores credit card numbers or payment credentials.
      </p>

      <h2>Code Isolation</h2>
      <p>
        Generated code previews run in sandboxed iframes with strict Content Security Policy headers.
        Your projects are isolated from other users' data.
      </p>

      <h2>Admin Access Controls</h2>
      <p>
        Platform administration is protected by role-based access control (RBAC). All admin actions
        are logged in an immutable audit trail.
      </p>

      <h2>Reporting Vulnerabilities</h2>
      <p>
        If you discover a security vulnerability, please report it responsibly to security@buildforge.ai.
        We aim to respond within 48 hours and will credit researchers who report valid issues.
      </p>
    </main>
  )
}
