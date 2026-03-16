import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://buildforge.ai'),
  title: {
    default: 'BuildForge — AI SaaS Builder and Startup Generator',
    template: '%s | BuildForge',
  },
  description: 'BuildForge is an AI platform that generates full SaaS products, landing pages, and marketing systems automatically. Build and launch AI startups in minutes.',
  keywords: [
    'AI SaaS builder', 'AI startup generator', 'build SaaS with AI', 'AI app builder',
    'startup generator', 'AI product factory', 'no-code AI builder', 'SaaS generator',
    'AI landing page generator', 'AI growth engine',
  ],
  openGraph: {
    type: 'website',
    siteName: 'BuildForge',
    title: 'BuildForge — AI SaaS Builder and Startup Generator',
    description: 'BuildForge is an AI platform that generates full SaaS products, landing pages, and marketing systems automatically.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'BuildForge AI SaaS Builder' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BuildForge — AI SaaS Builder and Startup Generator',
    description: 'BuildForge is an AI platform that generates full SaaS products, landing pages, and marketing systems automatically.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://buildforge.ai' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BuildForge',
  applicationCategory: 'DeveloperApplication',
  description: 'AI platform that generates full SaaS products, landing pages, and marketing systems automatically.',
  url: 'https://buildforge.ai',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0',
    highPrice: '49',
    offerCount: '3',
  },
  operatingSystem: 'Web',
  featureList: [
    'AI SaaS Builder',
    'Autonomous Startup Generator',
    'AI Growth Engine',
    'Multi-Agent AI System',
    'Self-Healing Code Repair',
    'One-Click Deployment',
  ],
}

// Check if a real Clerk key is configured
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
const hasRealClerkKey = clerkKey.startsWith('pk_') && !clerkKey.includes('your_clerk')

function Providers({ children }: { children: React.ReactNode }) {
  if (hasRealClerkKey) {
    return <ClerkProvider>{children}</ClerkProvider>
  }
  return <>{children}</>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </Providers>
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
