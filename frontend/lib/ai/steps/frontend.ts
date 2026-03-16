// Frontend Generator — Stage 4 of the multi-stage AI pipeline
// Generates HTML pages based on the blueprint

import { generateCode } from '../router'
import { parseAIOutput, detectEntrypoint } from '../file-parser'
import { builderSystemPrompt, buildUserMessage } from '@/lib/ai-engine/agents/builder-agent'
import type { AppBlueprint } from './blueprint'

export interface FrontendResult {
  files: Record<string, string>
  entrypoint: string
}

const FRONTEND_SYSTEM_SUFFIX = `
PIPELINE MODE — you are the frontend generator in a multi-stage pipeline.
The blueprint and database schema have already been designed.
Your job: generate ONLY the HTML/CSS/JS files.

Output FILE: blocks for every page listed in the blueprint.
Each page must:
- Include a shared navigation bar linking to ALL other pages
- Use correct relative paths (pages/ folder → ../index.html)
- Link to shared styles.css and script.js
- Contain real, specific content — no placeholders
- Be visually polished with Tailwind CSS (CDN)
`

export async function generateFrontend(
  prompt: string,
  blueprint: AppBlueprint
): Promise<FrontendResult> {
  const appType = blueprint.appType
  const system = builderSystemPrompt(appType, undefined, prompt) + FRONTEND_SYSTEM_SUFFIX

  const userMsg = `Generate all frontend pages for this application:

App: ${blueprint.appName}
Type: ${blueprint.appType}
Description: ${blueprint.description}
Color scheme: ${blueprint.colorScheme}

Pages to generate:
${blueprint.pages.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Features to include: ${blueprint.features.join(', ')}

Output FILE: blocks for each page plus styles.css and script.js.`

  try {
    const result = await generateCode(userMsg, {
      system,
      appType,
      maxTokens: 14000,
    })

    // Try FILE: block format first, then JSON
    const files = parseAIOutput(result.text)
    if (files && Object.keys(files).length > 0) {
      return { files, entrypoint: detectEntrypoint(files) }
    }
  } catch (err) {
    console.warn('[frontend-generator] AI failed, using builder-agent fallback:', err)
  }

  // Fallback: use the standard builder-agent single-call approach
  try {
    const system2 = builderSystemPrompt(appType, undefined, prompt)
    const userMsg2 = buildUserMessage(prompt, appType)
    const result2 = await generateCode(userMsg2, { system: system2, appType, maxTokens: 14000 })
    const files = parseAIOutput(result2.text) ?? result2.files
    if (files && Object.keys(files).length > 0) {
      return { files, entrypoint: detectEntrypoint(files) }
    }
  } catch (err2) {
    console.warn('[frontend-generator] fallback also failed:', err2)
  }

  // Last resort: minimal shell
  return {
    files: {
      'index.html': buildMinimalShell(blueprint),
      'styles.css': '/* styles */',
      'script.js': '// scripts',
    },
    entrypoint: 'index.html',
  }
}

function buildMinimalShell(blueprint: AppBlueprint): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blueprint.appName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-slate-950 text-white min-h-screen">
  <nav class="border-b border-white/10 px-6 py-4 flex items-center justify-between">
    <span class="font-bold text-xl">${blueprint.appName}</span>
    <div class="flex gap-4 text-sm text-slate-400">
      ${blueprint.pages.map(p => `<a href="${p}" class="hover:text-white transition-colors">${p.replace('pages/', '').replace('.html', '')}</a>`).join('\n      ')}
    </div>
  </nav>
  <main class="max-w-5xl mx-auto px-6 py-16 text-center">
    <h1 class="text-5xl font-bold mb-4">${blueprint.appName}</h1>
    <p class="text-xl text-slate-400 mb-8">${blueprint.description}</p>
    <a href="${blueprint.pages[1] ?? '#'}" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-medium transition-colors">Get Started</a>
  </main>
  <script src="script.js"></script>
</body>
</html>`
}
