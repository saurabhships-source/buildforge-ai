// File parser — extracts FILE: blocks from AI-generated text
// Supports both "FILE: filename" format and JSON {"files":{...}} format

export interface ParsedFile {
  name: string
  content: string
}

/**
 * Parse FILE: blocks from AI output.
 *
 * Expects format:
 *   FILE: index.html
 *   ...content...
 *
 *   FILE: styles.css
 *   ...content...
 */
export function parseFileBlocks(text: string): ParsedFile[] {
  const files: ParsedFile[] = []
  // Split on FILE: markers (case-insensitive)
  const parts = text.split(/^FILE:\s*/im)

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    // First line is the filename, rest is content
    const newlineIdx = trimmed.indexOf('\n')
    if (newlineIdx === -1) continue

    const name = trimmed.slice(0, newlineIdx).trim()
    const content = trimmed.slice(newlineIdx + 1).trim()

    if (name && content) {
      files.push({ name, content })
    }
  }

  return files
}

/**
 * Convert ParsedFile[] to the ProjectFiles record format used by BuildForge.
 */
export function toProjectFiles(files: ParsedFile[]): Record<string, string> {
  return Object.fromEntries(files.map(f => [f.name, f.content]))
}

/**
 * Try to parse AI output as either FILE: blocks or JSON {"files":{...}}.
 * Returns a ProjectFiles record, or null if parsing fails.
 */
export function parseAIOutput(text: string): Record<string, string> | null {
  if (!text?.trim()) return null

  // Try JSON format first (BuildForge native format)
  const jsonMatch = text.match(/\{[\s\S]*"files"\s*:\s*\{[\s\S]*\}[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { files?: Record<string, string> }
      if (parsed.files && typeof parsed.files === 'object') {
        return parsed.files
      }
    } catch { /* fall through to FILE: block parsing */ }
  }

  // Try FILE: block format
  const fileBlocks = parseFileBlocks(text)
  if (fileBlocks.length > 0) {
    return toProjectFiles(fileBlocks)
  }

  return null
}

/**
 * Detect the entrypoint from a files record.
 * Prefers index.html, then pages/dashboard.html, then first .html file.
 */
export function detectEntrypoint(files: Record<string, string>): string {
  if (files['index.html']) return 'index.html'
  const htmlFiles = Object.keys(files).filter(f => f.endsWith('.html'))
  const dashboard = htmlFiles.find(f => f.includes('dashboard'))
  if (dashboard) return dashboard
  return htmlFiles[0] ?? Object.keys(files)[0] ?? 'index.html'
}
