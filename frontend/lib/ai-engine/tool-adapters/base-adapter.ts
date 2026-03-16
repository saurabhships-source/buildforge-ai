export interface ProjectFiles {
  [filename: string]: string
}

export interface AdapterResult {
  files: ProjectFiles
  entrypoint: string
  description: string
}

export interface BaseAdapter {
  generateCode(prompt: string, appType: string, existingFiles?: ProjectFiles): Promise<AdapterResult>
  analyzeRepo(files: ProjectFiles): Promise<string>
  improveUI(files: ProjectFiles): Promise<AdapterResult>
  fixBugs(files: ProjectFiles): Promise<AdapterResult>
  refactorCode(files: ProjectFiles, instructions?: string): Promise<AdapterResult>
  runTests(files: ProjectFiles): Promise<{ passed: boolean; issues: string[] }>
  deployApp(files: ProjectFiles, provider: 'vercel' | 'netlify'): Promise<{ config: ProjectFiles }>
}

export function parseFilesJson(text: string): AdapterResult {
  let cleaned = text.trim()

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) cleaned = fenceMatch[1].trim()

  // Extract the outermost JSON object
  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    // AI returned plain text — wrap it as a single HTML file
    return wrapPlainText(cleaned)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1))
  } catch {
    // Malformed JSON — try to salvage by extracting the files block directly
    return extractFilesFromMalformed(cleaned) ?? wrapPlainText(cleaned)
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('files' in parsed) ||
    typeof (parsed as Record<string, unknown>).files !== 'object'
  ) {
    return wrapPlainText(cleaned)
  }

  const p = parsed as { files: Record<string, string>; entrypoint?: string; description?: string }

  // Ensure all file values are strings
  const files: ProjectFiles = {}
  for (const [k, v] of Object.entries(p.files)) {
    files[k] = typeof v === 'string' ? v : JSON.stringify(v)
  }

  if (Object.keys(files).length === 0) return wrapPlainText(cleaned)

  return {
    files,
    entrypoint: p.entrypoint ?? 'index.html',
    description: p.description ?? '',
  }
}

// Wrap plain-text AI output as a viewable HTML file
function wrapPlainText(text: string): AdapterResult {
  const escaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return {
    files: {
      'index.html': `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Generated Project</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-950 text-gray-100 p-8 font-mono"><pre class="whitespace-pre-wrap text-sm">${escaped}</pre></body></html>`,
    },
    entrypoint: 'index.html',
    description: 'Raw AI output (JSON parse failed)',
  }
}

// Last-resort: try to pull a "files" key out of broken JSON using regex
function extractFilesFromMalformed(text: string): AdapterResult | null {
  try {
    // Find the "files": { ... } block — use brace counting to handle nesting
    const filesKeyIdx = text.indexOf('"files"')
    if (filesKeyIdx === -1) return null
    const braceStart = text.indexOf('{', filesKeyIdx)
    if (braceStart === -1) return null

    let depth = 0
    let braceEnd = -1
    for (let i = braceStart; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}') {
        depth--
        if (depth === 0) { braceEnd = i; break }
      }
    }
    if (braceEnd === -1) return null

    const filesBlock = text.slice(braceStart, braceEnd + 1)
    const files = JSON.parse(filesBlock) as Record<string, string>
    if (typeof files !== 'object' || Object.keys(files).length === 0) return null

    // Also try to extract entrypoint
    const epMatch = text.match(/"entrypoint"\s*:\s*"([^"]+)"/)
    return { files, entrypoint: epMatch?.[1] ?? 'index.html', description: '' }
  } catch {
    return null
  }
}
