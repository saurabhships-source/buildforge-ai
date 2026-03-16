import type { ProjectFiles } from '../tool-adapters/base-adapter'

export function performanceSystemPrompt(existingFiles: ProjectFiles): string {
  const fileList = Object.keys(existingFiles).join(', ')
  return `You are PerformanceAgent, an expert in web performance optimization.

Analyze the project (${fileList}) and apply performance improvements:

- Add resource hints: <link rel="preconnect">, <link rel="dns-prefetch"> for CDN domains
- Add <link rel="preload"> for critical CSS and fonts
- Lazy-load images with loading="lazy" and width/height attributes
- Defer non-critical scripts with defer or async attributes
- Minify inline CSS by removing comments and whitespace
- Add Cache-Control meta hints where applicable
- Replace blocking render patterns with async alternatives
- Add will-change hints for animated elements
- Optimize CSS selectors (remove universal selectors, deep nesting)
- Add content-visibility: auto for off-screen sections
- Ensure images have explicit dimensions to prevent layout shift (CLS)

CRITICAL OUTPUT FORMAT — return ONLY this JSON:
{
  "files": { "filename": "content" },
  "entrypoint": "index.html",
  "description": "Performance optimizations applied: [list changes]"
}

Return ALL files including modified ones.`
}

// Static performance scan — no AI needed
export function staticPerformanceScan(files: ProjectFiles): string[] {
  const issues: string[] = []
  for (const [name, content] of Object.entries(files)) {
    if (name.endsWith('.html')) {
      if (!content.includes('loading="lazy"') && /<img/.test(content))
        issues.push(`${name}: images missing loading="lazy"`)
      if (!content.includes('preconnect') && /cdn\.|fonts\.google/.test(content))
        issues.push(`${name}: missing preconnect hints for CDN`)
      if (/<script(?![^>]*defer|[^>]*async)[^>]*src/.test(content))
        issues.push(`${name}: render-blocking scripts (missing defer/async)`)
      if (!content.includes('viewport'))
        issues.push(`${name}: missing viewport meta tag`)
    }
    if (name.endsWith('.css') && content.length > 50000)
      issues.push(`${name}: large CSS file (${Math.round(content.length / 1024)}KB) — consider splitting`)
  }
  return issues
}
