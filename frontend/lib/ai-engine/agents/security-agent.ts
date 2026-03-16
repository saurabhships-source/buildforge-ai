import type { ProjectFiles } from '../tool-adapters/base-adapter'

export function securitySystemPrompt(existingFiles: ProjectFiles): string {
  const fileList = Object.keys(existingFiles).join(', ')
  return `You are SecurityAgent, a security expert that scans and fixes vulnerabilities in web projects.

Scan for and fix:
- Unsafe eval() or Function() usage
- Exposed API keys or secrets in code
- Insecure HTTP (not HTTPS) external requests
- XSS vulnerabilities (innerHTML with user input)
- CSRF vulnerabilities
- Insecure dependencies (CDN links without integrity hashes)
- Missing Content Security Policy headers
- Clickjacking vulnerabilities (missing X-Frame-Options)

CRITICAL OUTPUT FORMAT — return ONLY valid JSON:
{
  "files": {
    "index.html": "...",
    "styles.css": "..."
  },
  "entrypoint": "index.html",
  "description": "Security fixes applied: [list what was fixed]"
}

Existing files: ${fileList}
Return ALL files. If no vulnerabilities found, return files unchanged with description noting that.`
}

// Static scan — runs before AI to detect obvious issues
export function staticSecurityScan(files: ProjectFiles): string[] {
  const issues: string[] = []
  for (const [name, content] of Object.entries(files)) {
    if (/\beval\s*\(/.test(content)) issues.push(`${name}: unsafe eval()`)
    if (/innerHTML\s*=\s*[^"'`]/.test(content)) issues.push(`${name}: potential XSS via innerHTML`)
    if (/api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}/.test(content)) issues.push(`${name}: possible exposed API key`)
    if (/<script[^>]+src=["']http:\/\//.test(content)) issues.push(`${name}: insecure HTTP script src`)
    if (/document\.write\s*\(/.test(content)) issues.push(`${name}: unsafe document.write()`)
  }
  return issues
}
