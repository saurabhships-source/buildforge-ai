// AI Output Validator — validates AI-generated files before applying them
// Prevents destructive operations, catches syntax errors, validates structure.

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  sanitized?: Record<string, string>
}

const DANGEROUS_PATTERNS = [
  /process\.env\b/g,           // env var leakage
  /eval\s*\(/g,                // eval calls
  /document\.cookie/g,         // cookie theft
  /localStorage\.clear\s*\(/g, // clearing storage
  /window\.location\s*=\s*['"](?!https?:\/\/)/g, // open redirect
]

const DANGEROUS_FILENAMES = [
  '.env', '.env.local', '.env.production',
  'id_rsa', 'id_ed25519', '.ssh',
  'secrets.json', 'credentials.json',
]

/**
 * Validate a files object returned by AI generation or patch.
 * Returns sanitized files with issues flagged.
 */
export function validateAIOutput(
  files: unknown,
  existingFiles?: Record<string, string>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Structure check
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    return { valid: false, errors: ['AI returned invalid files structure (expected object)'], warnings: [] }
  }

  const fileMap = files as Record<string, unknown>
  const fileCount = Object.keys(fileMap).length

  if (fileCount === 0) {
    return { valid: false, errors: ['AI returned empty files object'], warnings: [] }
  }

  // 2. Destructive operation check — refuse if patch would delete >80% of existing files
  if (existingFiles) {
    const existingCount = Object.keys(existingFiles).length
    const returnedCount = fileCount
    if (existingCount > 3 && returnedCount < existingCount * 0.2) {
      errors.push(`Destructive operation blocked: AI returned only ${returnedCount} files but project has ${existingCount}. Use patch mode for edits.`)
    }
  }

  // 3. Per-file validation
  const sanitized: Record<string, string> = {}

  for (const [filename, content] of Object.entries(fileMap)) {
    // Filename safety
    if (DANGEROUS_FILENAMES.some(d => filename.toLowerCase().includes(d))) {
      errors.push(`Blocked dangerous filename: ${filename}`)
      continue
    }
    if (filename.includes('..') || filename.startsWith('/')) {
      errors.push(`Blocked path traversal filename: ${filename}`)
      continue
    }

    // Content must be a string
    const contentStr = typeof content === 'string' ? content
      : typeof content === 'object' ? JSON.stringify(content, null, 2)
      : String(content ?? '')

    // Dangerous pattern check (warn, don't block — could be legitimate)
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(contentStr)) {
        warnings.push(`Potentially unsafe pattern in ${filename}: ${pattern.source}`)
      }
    }

    // Basic JS/TS syntax check — look for obviously broken structure
    if (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
      const syntaxIssues = checkBasicSyntax(contentStr, filename)
      warnings.push(...syntaxIssues)
    }

    sanitized[filename] = contentStr
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized,
  }
}

/**
 * Validate a patch result (updates/newFiles/deletedFiles).
 */
export function validatePatchOutput(
  patch: unknown,
  existingFiles: Record<string, string>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return { valid: false, errors: ['Patch response is not an object'], warnings: [] }
  }

  const p = patch as Record<string, unknown>

  // Validate deletedFiles — refuse to delete all files
  const deletedFiles = Array.isArray(p.deletedFiles) ? p.deletedFiles as string[] : []
  const existingCount = Object.keys(existingFiles).length
  if (deletedFiles.length >= existingCount && existingCount > 1) {
    errors.push(`Blocked: patch would delete all ${deletedFiles.length} files`)
  }

  // Validate updates
  const updates = (p.updates ?? {}) as Record<string, unknown>
  const newFiles = (p.newFiles ?? {}) as Record<string, unknown>
  const allChanges = { ...updates, ...newFiles }

  const fileValidation = validateAIOutput(allChanges)
  errors.push(...fileValidation.errors)
  warnings.push(...fileValidation.warnings)

  return { valid: errors.length === 0, errors, warnings, sanitized: fileValidation.sanitized }
}

/**
 * Basic syntax heuristics for JS/TS files.
 * Not a full parser — just catches common AI mistakes.
 */
function checkBasicSyntax(content: string, filename: string): string[] {
  const issues: string[] = []
  if (!content.trim()) {
    issues.push(`${filename}: file is empty`)
    return issues
  }

  // Check brace balance
  let braces = 0, brackets = 0, parens = 0
  let inString = false, stringChar = '', inComment = false
  for (let i = 0; i < content.length; i++) {
    const c = content[i]
    const prev = content[i - 1]
    if (inComment) { if (c === '\n') inComment = false; continue }
    if (!inString && c === '/' && content[i + 1] === '/') { inComment = true; continue }
    if (!inString && (c === '"' || c === "'" || c === '`')) { inString = true; stringChar = c; continue }
    if (inString && c === stringChar && prev !== '\\') { inString = false; continue }
    if (inString) continue
    if (c === '{') braces++
    else if (c === '}') braces--
    else if (c === '[') brackets++
    else if (c === ']') brackets--
    else if (c === '(') parens++
    else if (c === ')') parens--
  }

  if (braces !== 0) issues.push(`${filename}: unbalanced braces (${braces > 0 ? 'missing' : 'extra'} })`)
  if (brackets !== 0) issues.push(`${filename}: unbalanced brackets`)
  if (parens !== 0) issues.push(`${filename}: unbalanced parentheses`)

  return issues
}
