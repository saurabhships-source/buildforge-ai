#!/usr/bin/env ts-node
/**
 * Safe component generator — creates a named-export component file.
 * Usage: npm run create:component -- MyComponent
 *        npm run create:component -- MyComponent components/ui
 */

import fs from 'fs'
import path from 'path'

const [,, rawName, rawDir] = process.argv

if (!rawName) {
  console.error('Usage: npm run create:component -- ComponentName [optional/subdir]')
  process.exit(1)
}

// PascalCase name
const componentName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

// kebab-case filename
const fileName = componentName
  .replace(/([A-Z])/g, (m, l, i) => (i === 0 ? l.toLowerCase() : `-${l.toLowerCase()}`))
  .replace(/^-/, '')

const targetDir = path.resolve(process.cwd(), rawDir ?? 'components')
const targetFile = path.join(targetDir, `${fileName}.tsx`)

if (fs.existsSync(targetFile)) {
  console.error(`❌ File already exists: ${targetFile}`)
  process.exit(1)
}

fs.mkdirSync(targetDir, { recursive: true })

const template = `// ${componentName} — auto-generated safe component template
// Always use named exports to prevent import/export mismatches.

export function ${componentName}() {
  return (
    <div>
      <p>${componentName}</p>
    </div>
  )
}
`

fs.writeFileSync(targetFile, template, 'utf-8')
console.log(`✅ Created: ${path.relative(process.cwd(), targetFile)}`)
console.log(`   Export:  export function ${componentName}()`)
