#!/usr/bin/env node
// BuildForge Super Dev Mode — cleans stale cache and starts fresh

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const NEXT_DIR = path.join(ROOT, '.next')

const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
}

const log = (color, msg) => console.log(`${color}${msg}${COLORS.reset}`)
const info = (msg) => log(COLORS.cyan, `  ℹ  ${msg}`)
const ok = (msg) => log(COLORS.green, `  ✓  ${msg}`)
const warn = (msg) => log(COLORS.yellow, `  ⚠  ${msg}`)
const err = (msg) => log(COLORS.red, `  ✗  ${msg}`)

// ─── Banner ───────────────────────────────────────────────────────────────────
console.log()
log(COLORS.bold + COLORS.cyan, '  ╔══════════════════════════════════════╗')
log(COLORS.bold + COLORS.cyan, '  ║   BuildForge  ⚡  Super Dev Mode     ║')
log(COLORS.bold + COLORS.cyan, '  ╚══════════════════════════════════════╝')
console.log()

// ─── Section 1: Validate project structure ────────────────────────────────────
info('Validating project structure...')
const required = ['app', 'components', 'package.json']
let structureOk = true
for (const item of required) {
  if (!fs.existsSync(path.join(ROOT, item))) {
    warn(`Missing expected path: ${item} — are you running from the frontend/ directory?`)
    structureOk = false
  }
}
if (structureOk) ok('Project structure looks good')

// ─── Section 2: Environment variable check ────────────────────────────────────
info('Checking environment variables...')

// Load .env.local if present
const envFile = path.join(ROOT, '.env.local')
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n')
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
    }
  }
}

const REQUIRED_ENV = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
]
const OPTIONAL_ENV = [
  'DATABASE_URL',
  'NEXT_PUBLIC_APP_URL',
]

let missingRequired = false
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    warn(`Missing env var: ${key}`)
    missingRequired = true
  } else {
    ok(`${key} is set`)
  }
}
for (const key of OPTIONAL_ENV) {
  if (!process.env[key]) {
    log(COLORS.dim, `  -  ${key} not set (optional)`)
  }
}
if (missingRequired) {
  warn('Some required env vars are missing — dev mode will continue but some features may not work')
  warn('Copy frontend/.env.local.example to frontend/.env.local and fill in your keys')
} else {
  ok('Environment variables OK')
}

// ─── Section 3: Clean .next cache ─────────────────────────────────────────────
info('Checking for stale build cache...')
if (fs.existsSync(NEXT_DIR)) {
  info('Clearing stale .next build cache...')
  try {
    fs.rmSync(NEXT_DIR, { recursive: true, force: true })
    ok('.next cache cleared')
  } catch (e) {
    err(`Failed to delete .next: ${e.message}`)
    warn('Try manually deleting the .next folder and re-running')
    process.exit(1)
  }
} else {
  ok('No stale cache found')
}

// ─── Section 4: Launch dev server ─────────────────────────────────────────────
console.log()
log(COLORS.bold + COLORS.green, '  Starting fresh dev server...')
log(COLORS.dim, '  Dev server ready at: http://localhost:3000')
console.log()

const isWindows = process.platform === 'win32'
const next = isWindows ? 'next.cmd' : 'next'
const nextBin = path.join(ROOT, 'node_modules', '.bin', next)

const child = spawn(nextBin, ['dev'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
})

child.on('error', (e) => {
  err(`Failed to start dev server: ${e.message}`)
  if (e.message.includes('ENOENT')) {
    warn('next binary not found — try running: npm install')
  }
  process.exit(1)
})

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    err(`Dev server exited with code ${code}`)
    warn('If this keeps happening, try: npm install  or  rm -rf node_modules && npm install')
  }
  process.exit(code ?? 0)
})

// Graceful shutdown
process.on('SIGINT', () => {
  child.kill('SIGINT')
  process.exit(0)
})
process.on('SIGTERM', () => {
  child.kill('SIGTERM')
  process.exit(0)
})
