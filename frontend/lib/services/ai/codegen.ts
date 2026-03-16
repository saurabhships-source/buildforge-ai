// Code Generator — generates complete file content for each file in the tree
import { aiRequest, stripFences } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { ProjectPlan } from './planner'

export interface GeneratedFile {
  path: string
  content: string
}

const CODEGEN_SYSTEM = `You are an expert web developer. Generate complete, production-ready file content.
Rules:
- Use HTML5, TailwindCSS CDN, and vanilla JavaScript
- All code must be complete and functional — no placeholders
- Return ONLY the raw file content, no markdown fences, no explanation
- For HTML: include full DOCTYPE, head with Tailwind CDN, and complete body
- For CSS: include all animations, custom properties, and component styles
- For JS: include all event handlers, state management, and utility functions`

export async function generateFileCode(
  filePath: string,
  plan: ProjectPlan,
  existingFiles: Record<string, string> = {},
  modelId: ModelId = 'gemini_flash',
): Promise<GeneratedFile> {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const context = buildFileContext(filePath, plan, existingFiles)

  try {
    const text = await aiRequest({
      system: CODEGEN_SYSTEM,
      prompt: context,
      modelId,
      maxOutputTokens: 8000,
      timeoutMs: 30_000,
    })
    return { path: filePath, content: stripFences(text) }
  } catch (err) {
    logger.warn('ai-pipeline', `codegen fallback for ${filePath}`, err instanceof Error ? err.message : String(err))
    return { path: filePath, content: generateStaticFile(filePath, plan, ext) }
  }
}

function buildFileContext(
  filePath: string,
  plan: ProjectPlan,
  existingFiles: Record<string, string>,
): string {
  const existingContext = Object.keys(existingFiles).length > 0
    ? `\n\nExisting files for context:\n${Object.entries(existingFiles)
        .slice(0, 2)
        .map(([k, v]) => `=== ${k} ===\n${v.slice(0, 500)}`)
        .join('\n\n')}`
    : ''

  return `Generate the complete content for file: ${filePath}

Project: ${plan.name}
Type: ${plan.appType}
Description: ${plan.description}
Tech stack: ${plan.techStack.join(', ')}
Pages: ${plan.pages.map(p => `${p.name} (${p.route})`).join(', ')}
Components: ${plan.components.join(', ')}
Features: ${plan.features.join(', ')}
Color scheme: ${plan.colorScheme}${existingContext}

Generate ONLY the complete file content for ${filePath}. No explanation, no markdown.`
}

function generateStaticFile(filePath: string, plan: ProjectPlan, ext: string): string {
  if (ext === 'html') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${plan.name}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="styles.css" />
</head>
<body class="bg-gray-950 text-white min-h-screen">
  <nav class="px-6 py-4 border-b border-white/10 flex items-center justify-between">
    <span class="font-bold text-lg">${plan.name}</span>
    <a href="index.html" class="text-sm text-gray-400 hover:text-white transition">Home</a>
  </nav>
  <main class="max-w-4xl mx-auto px-6 py-16 text-center">
    <h1 class="text-4xl font-bold mb-4">${filePath.replace('.html', '').replace(/-/g, ' ')}</h1>
    <p class="text-gray-400">${plan.description}</p>
  </main>
  <script src="script.js"><\/script>
</body>
</html>`
  }
  if (ext === 'css') {
    return `/* ${plan.name} — Styles */
* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --brand: #6366f1; --brand-dark: #4f46e5; }
@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.animate-fade-up { animation: fadeUp 0.6s ease-out forwards; }
body { font-family: system-ui, -apple-system, sans-serif; }`
  }
  if (ext === 'js') {
    return `// ${plan.name} — Scripts
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' })
    })
  })
})`
  }
  return `// ${filePath} — ${plan.name}`
}
