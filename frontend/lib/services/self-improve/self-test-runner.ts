// Self Test Runner — validates sandbox patches before human approval

import type { SandboxResult } from './sandbox-builder'

export interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

export interface SelfTestReport {
  sandboxId: string
  success: boolean
  score: number
  tests: TestResult[]
  errors: string[]
  warnings: string[]
  testedAt: string
}

// TypeScript syntax heuristics (no actual tsc available in browser)
function checkTypeScriptSyntax(path: string, content: string): TestResult {
  const start = Date.now()
  const errors: string[] = []

  const ext = path.split('.').pop()?.toLowerCase()
  if (!['ts', 'tsx'].includes(ext ?? '')) {
    return { name: `TS syntax: ${path}`, passed: true, duration: Date.now() - start }
  }

  // Check for common syntax issues
  const opens = (content.match(/\{/g) ?? []).length
  const closes = (content.match(/\}/g) ?? []).length
  if (Math.abs(opens - closes) > 3) {
    errors.push(`Unbalanced braces: ${opens} open, ${closes} close`)
  }

  if (content.includes('```')) {
    errors.push('Contains markdown code fences')
  }

  // Check for obvious TS errors
  if (content.includes('any any') || content.includes(': any any')) {
    errors.push('Suspicious type annotation')
  }

  return {
    name: `TS syntax: ${path.split('/').pop()}`,
    passed: errors.length === 0,
    duration: Date.now() - start,
    error: errors[0],
  }
}

function checkImports(path: string, content: string): TestResult {
  const start = Date.now()

  if (!['ts', 'tsx'].includes(path.split('.').pop() ?? '')) {
    return { name: `Imports: ${path}`, passed: true, duration: 0 }
  }

  // Check for self-referential imports
  const fileName = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
  if (content.includes(`from './${fileName}'`) || content.includes(`from "./${fileName}"`)) {
    return {
      name: `Imports: ${path.split('/').pop()}`,
      passed: false,
      duration: Date.now() - start,
      error: 'Self-referential import detected',
    }
  }

  return { name: `Imports: ${path.split('/').pop()}`, passed: true, duration: Date.now() - start }
}

function checkNoProtectedModifications(files: Record<string, string>): TestResult {
  const start = Date.now()
  const PROTECTED = ['middleware.ts', 'stripe', 'prisma', 'billing', '(auth)']

  for (const path of Object.keys(files)) {
    if (PROTECTED.some(p => path.includes(p))) {
      return {
        name: 'Protected file check',
        passed: false,
        duration: Date.now() - start,
        error: `Protected file in patch: ${path}`,
      }
    }
  }

  return { name: 'Protected file check', passed: true, duration: Date.now() - start }
}

function checkFileCount(files: Record<string, string>): TestResult {
  const start = Date.now()
  const count = Object.keys(files).length

  // Reject patches that touch too many files at once (safety)
  if (count > 10) {
    return {
      name: 'File count check',
      passed: false,
      duration: Date.now() - start,
      error: `Patch touches ${count} files — max 10 allowed per patch`,
    }
  }

  return { name: 'File count check', passed: true, duration: Date.now() - start }
}

function checkApiRouteStructure(path: string, content: string): TestResult {
  const start = Date.now()

  if (!path.includes('/api/') || !path.endsWith('route.ts')) {
    return { name: `API structure: ${path}`, passed: true, duration: 0 }
  }

  const hasExport = content.includes('export async function') || content.includes('export function')
  const hasNextResponse = content.includes('NextResponse')

  if (!hasExport || !hasNextResponse) {
    return {
      name: `API structure: ${path.split('/').slice(-3).join('/')}`,
      passed: false,
      duration: Date.now() - start,
      error: 'API route missing export or NextResponse',
    }
  }

  return {
    name: `API structure: ${path.split('/').slice(-3).join('/')}`,
    passed: true,
    duration: Date.now() - start,
  }
}

export async function runSelfTests(sandboxResult: SandboxResult): Promise<SelfTestReport> {
  const tests: TestResult[] = []
  const errors: string[] = []
  const warnings: string[] = []

  if (!sandboxResult.success) {
    return {
      sandboxId: sandboxResult.sandboxId,
      success: false,
      score: 0,
      tests: [],
      errors: [sandboxResult.error ?? 'Sandbox build failed'],
      warnings: [],
      testedAt: new Date().toISOString(),
    }
  }

  // Run all checks
  tests.push(checkNoProtectedModifications(sandboxResult.files))
  tests.push(checkFileCount(sandboxResult.files))

  for (const [path, content] of Object.entries(sandboxResult.files)) {
    tests.push(checkTypeScriptSyntax(path, content))
    tests.push(checkImports(path, content))
    tests.push(checkApiRouteStructure(path, content))
  }

  if (sandboxResult.skippedFiles.length > 0) {
    warnings.push(`${sandboxResult.skippedFiles.length} files skipped: ${sandboxResult.skippedFiles.join(', ')}`)
  }

  const failedTests = tests.filter(t => !t.passed)
  for (const t of failedTests) {
    if (t.error) errors.push(t.error)
  }

  const passed = tests.filter(t => t.passed).length
  const score = tests.length > 0 ? Math.round((passed / tests.length) * 100) : 0

  return {
    sandboxId: sandboxResult.sandboxId,
    success: failedTests.length === 0,
    score,
    tests,
    errors,
    warnings,
    testedAt: new Date().toISOString(),
  }
}
