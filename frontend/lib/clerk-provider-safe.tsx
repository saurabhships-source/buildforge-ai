'use client'

import { ClerkProvider } from '@clerk/nextjs'

const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''

const hasRealClerkKey =
  (rawKey.startsWith('pk_test_') || rawKey.startsWith('pk_live_')) &&
  !rawKey.includes('your_') &&
  !rawKey.includes('placeholder') &&
  rawKey.length > 20

export function ClerkProviderSafe({ children }: { children: React.ReactNode }) {
  if (!hasRealClerkKey) return <>{children}</>
  return <ClerkProvider>{children}</ClerkProvider>
}
