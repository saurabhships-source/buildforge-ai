import type { ProjectFiles } from '../tool-adapters/base-adapter'

export function seoSystemPrompt(existingFiles: ProjectFiles): string {
  const fileList = Object.keys(existingFiles).join(', ')
  return `You are SEOAgent, an expert in technical SEO, content strategy, and search engine optimization.

Analyze the project (${fileList}) and add comprehensive SEO assets.

Tasks:
- Add/improve <title>, <meta description>, <meta keywords> in all HTML files
- Add OpenGraph tags (og:title, og:description, og:image, og:url, og:type)
- Add Twitter Card meta tags
- Add JSON-LD schema markup (WebSite, Organization, or SoftwareApplication)
- Generate sitemap.xml listing all pages
- Generate robots.txt with proper crawl rules
- Add canonical URLs to prevent duplicate content
- Add hreflang if multi-language content detected
- Ensure heading hierarchy (h1 → h2 → h3) is correct
- Add alt text to any img tags missing it
- Optimize page load hints (preconnect, dns-prefetch for CDN resources)

CRITICAL OUTPUT FORMAT — return ONLY this JSON:
{
  "files": {
    "index.html": "...",
    "sitemap.xml": "...",
    "robots.txt": "...",
    "schema.json": "..."
  },
  "entrypoint": "index.html",
  "description": "SEO assets generated: sitemap, robots.txt, schema markup, meta tags"
}

Return ALL files including new SEO assets.`
}

// Generate static SEO files without AI (fast path)
export function generateStaticSEO(projectName: string, appUrl: string, description: string): ProjectFiles {
  const domain = appUrl.replace(/https?:\/\//, '').replace(/\/$/, '')
  return {
    'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://${domain}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://${domain}/features</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://${domain}/pricing</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>`,
    'robots.txt': `User-agent: *\nAllow: /\nSitemap: https://${domain}/sitemap.xml`,
    'schema.json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: projectName,
      description,
      url: `https://${domain}`,
      applicationCategory: 'WebApplication',
    }, null, 2),
  }
}
