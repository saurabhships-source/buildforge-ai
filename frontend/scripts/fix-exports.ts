#!/usr/bin/env ts-node
/**
 * Auto-fix missing exports across the project.
 * Run via: npm run fix:exports
 */

import 'tsconfig-paths/register'
import path from 'path'
import { autoFixMissingExports } from '../lib/dev/auto-export-fix'

const ROOT = path.resolve(__dirname, '..')

console.log('\n🔧 BuildForge — auto-fixing missing exports...\n')

const { fixed, failed } = autoFixMissingExports(ROOT)

if (fixed > 0) {
  console.log(`✅ Fixed ${fixed} export(s) automatically.\n`)
}

if (failed.length > 0) {
  console.warn(`⚠️  ${failed.length} mismatch(es) require manual attention:\n`)
  for (const m of failed) {
    console.warn(`  • ${m.file}\n    └─ "${m.missingExport}" in "${m.module}"\n`)
  }
}

if (fixed === 0 && failed.length === 0) {
  console.log('✅ No issues found.\n')
}
