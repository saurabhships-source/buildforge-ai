import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'

export const maxDuration = 30

export interface HealthMetric {
  name: string
  score: number // 0-100
  status: 'good' | 'warning' | 'error'
  issues: string[]
  suggestions: string[]
}

export interface HealthReport {
  overall: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  metrics: HealthMetric[]
  topSuggestions: string[]
}

function scorePerformance(files: Record<string, string>): HealthMetric {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  const html = Object.entries(files).find(([k]) => k.endsWith('.html'))?.[1] ?? ''
  const js = Object.entries(files).filter(([k]) => k.endsWith('.js')).map(([, v]) => v).join('\n')
  const css = Object.entries(files).filter(([k]) => k.endsWith('.css')).map(([, v]) => v).join('\n')

  if (!html.includes('loading="lazy"') && html.includes('<img')) {
    issues.push('Images missing loading="lazy"'); score -= 10
    suggestions.push('Add loading="lazy" to all <img> tags')
  }
  if (js.length > 50000) {
    issues.push('Large JS bundle (>50KB)'); score -= 15
    suggestions.push('Split JavaScript into smaller modules')
  }
  if (css.length > 30000) {
    issues.push('Large CSS file (>30KB)'); score -= 10
    suggestions.push('Remove unused CSS rules')
  }
  if (!html.includes('defer') && !html.includes('async') && html.includes('<script src')) {
    issues.push('Render-blocking scripts'); score -= 15
    suggestions.push('Add defer or async to script tags')
  }
  if (!html.includes('preconnect') && !html.includes('dns-prefetch')) {
    suggestions.push('Add <link rel="preconnect"> for external resources')
    score -= 5
  }

  return {
    name: 'Performance',
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 60 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

function scoreAccessibility(files: Record<string, string>): HealthMetric {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  const html = Object.entries(files).find(([k]) => k.endsWith('.html'))?.[1] ?? ''

  if (html.includes('<img') && !html.includes('alt=')) {
    issues.push('Images missing alt attributes'); score -= 20
    suggestions.push('Add descriptive alt text to all images')
  }
  if (!html.includes('lang=')) {
    issues.push('Missing lang attribute on <html>'); score -= 10
    suggestions.push('Add lang="en" to the <html> element')
  }
  if (!html.includes('<label') && html.includes('<input')) {
    issues.push('Form inputs missing labels'); score -= 15
    suggestions.push('Add <label> elements for all form inputs')
  }
  if (!html.includes('role=') && !html.includes('<nav') && !html.includes('<main')) {
    issues.push('Missing semantic HTML landmarks'); score -= 10
    suggestions.push('Use semantic elements: <nav>, <main>, <header>, <footer>')
  }
  if (!html.includes('focus') && !html.includes(':focus')) {
    suggestions.push('Add visible focus styles for keyboard navigation')
    score -= 5
  }

  return {
    name: 'Accessibility',
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 60 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

function scoreSEO(files: Record<string, string>): HealthMetric {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  const html = Object.entries(files).find(([k]) => k.endsWith('.html'))?.[1] ?? ''

  if (!html.includes('<title')) { issues.push('Missing <title> tag'); score -= 20 }
  if (!html.includes('meta name="description"')) { issues.push('Missing meta description'); score -= 15; suggestions.push('Add <meta name="description" content="...">') }
  if (!html.includes('og:title') && !html.includes('og:description')) { issues.push('Missing Open Graph tags'); score -= 10; suggestions.push('Add Open Graph meta tags for social sharing') }
  if (!html.includes('canonical')) { suggestions.push('Add <link rel="canonical"> tag'); score -= 5 }
  if (!files['sitemap.xml']) { suggestions.push('Add sitemap.xml for search engine indexing'); score -= 5 }
  if (!files['robots.txt']) { suggestions.push('Add robots.txt file'); score -= 5 }
  if (!html.includes('application/ld+json')) { suggestions.push('Add JSON-LD structured data'); score -= 5 }

  return {
    name: 'SEO',
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 60 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

function scoreCodeQuality(files: Record<string, string>): HealthMetric {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  const allCode = Object.entries(files)
    .filter(([k]) => k.endsWith('.js') || k.endsWith('.ts') || k.endsWith('.tsx'))
    .map(([, v]) => v).join('\n')

  if (allCode.includes('console.log')) { issues.push('console.log statements in production code'); score -= 5; suggestions.push('Remove console.log statements') }
  if (allCode.includes('TODO') || allCode.includes('FIXME')) { issues.push('Unresolved TODO/FIXME comments'); score -= 5 }
  if (allCode.includes('var ')) { issues.push('Using var instead of const/let'); score -= 10; suggestions.push('Replace var with const or let') }
  if (allCode.includes('innerHTML =') && !allCode.includes('DOMPurify')) { issues.push('Potential XSS via innerHTML'); score -= 20; suggestions.push('Sanitize HTML before using innerHTML') }
  if (!allCode.includes('try') && allCode.includes('fetch(')) { issues.push('fetch() calls without error handling'); score -= 10; suggestions.push('Wrap fetch() calls in try/catch') }

  const fileCount = Object.keys(files).length
  if (fileCount < 3) { suggestions.push('Consider splitting code into more files for maintainability') }

  return {
    name: 'Code Quality',
    score: Math.max(0, score),
    status: score >= 80 ? 'good' : score >= 60 ? 'warning' : 'error',
    issues,
    suggestions,
  }
}

function getGrade(score: number): HealthReport['grade'] {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export async function POST(req: Request) {
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse

  const { files }: { files: Record<string, string> } = await req.json()
  if (!files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const metrics = [
    scorePerformance(files),
    scoreAccessibility(files),
    scoreSEO(files),
    scoreCodeQuality(files),
  ]

  const overall = Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length)
  const allSuggestions = metrics.flatMap(m => m.suggestions)
  const topSuggestions = allSuggestions.slice(0, 5)

  const report: HealthReport = {
    overall,
    grade: getGrade(overall),
    metrics,
    topSuggestions,
  }

  return NextResponse.json({ report })
}
