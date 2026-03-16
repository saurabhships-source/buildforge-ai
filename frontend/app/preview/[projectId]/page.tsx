// Edge Preview Runtime — serves sandboxed project HTML
// URL: /preview/{projectId}
// This route is isolated from AI logic — it only serves project files.
import { SEED_GALLERY_PROJECTS } from '@/lib/gallery-service'

export const runtime = 'edge'

export default async function PreviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const seed = SEED_GALLERY_PROJECTS.find(p => p.id === projectId || p.shareSlug === projectId)
  const name = seed?.name ?? 'Preview'
  const icon = seed?.icon ?? '📁'
  const description = seed?.description ?? ''

  // In production this would load project files from DB/storage.
  // For now render a branded preview shell that the client hydrates.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f0f13; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
    .icon { font-size: 64px; }
    h1 { font-size: 24px; font-weight: 700; color: #fff; }
    p { color: #94a3b8; font-size: 14px; max-width: 360px; text-align: center; }
    .badge { background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3); padding: 4px 12px; border-radius: 999px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="icon">${icon}</div>
  <h1>${name}</h1>
  <p>${description}</p>
  <span class="badge">Built with BuildForge AI</span>
  <script>
    // Client-side: load project HTML from localStorage if available
    try {
      const stored = localStorage.getItem('buildforge_preview_${projectId}')
      if (stored) {
        document.open(); document.write(stored); document.close();
      }
    } catch(e) {}
  </script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
