#!/usr/bin/env ts-node
/**
 * Prebuild import validation script.
 * Run via: npm run check:imports
 * Automatically runs before `next build` via the "prebuild" script.
 */

// ts-node needs module resolution for @/ — use tsconfig-paths
import 'tsconfig-paths/register'
import path from 'path'
import { validateExports } from '../lib/dev/export-validator'

const ROOT = path.resolve(__dirname, '..')

console.log('\n🔍 BuildForge — checking import/export consistency...\n')

const mismatches = validateExports(ROOT)

if (mismatches.length === 0) {
  console.log('✅ All imports resolved correctly.\n')
  process.exit(0)
} else {
  console.error(`❌ Found ${mismatches.length} import/export mismatch(es):\n`)
  for (const m of mismatches) {
    console.error(`  • ${m.file}\n    └─ "${m.missingExport}" not exported from "${m.module}"\n`)
  }
  console.error('Fix these before building. Run `npm run fix:exports` to auto-fix where possible.\n')
  process.exit(1)
}
