import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Self-Healing Code Repair — AI That Fixes Its Own Errors | BuildForge',
  description: 'BuildForge Self-Healing Code Repair automatically detects and fixes runtime errors, build failures, and logic bugs in generated code — without manual intervention.',
  keywords: ['self-healing code', 'AI code repair', 'automatic error fixing', 'AI bug fixer'],
  alternates: { canonical: 'https://buildforge.ai/platform/self-healing-repair' },
}

export default function SelfHealingRepairPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <h1 className="text-4xl font-bold mb-4">Self-Healing Code Repair</h1>
      <p className="text-xl text-muted-foreground mb-10">
        BuildForge automatically detects errors in generated code and fixes them — without you having
        to do anything. The repair agent runs continuously to keep your application working.
      </p>

      <h2 className="text-2xl font-semibold mb-4">How Self-Healing Works</h2>
      <ol className="space-y-3 text-muted-foreground mb-8 list-decimal list-inside">
        <li>Error collector monitors for runtime and build errors</li>
        <li>Error analyzer classifies the error type and root cause</li>
        <li>Fix generator produces targeted code patches</li>
        <li>Patch applier applies fixes to the affected files</li>
        <li>Rebuild validates the fix didn't introduce new errors</li>
        <li>Repair memory stores successful fixes for future use</li>
      </ol>

      <h2 className="text-2xl font-semibold mb-4">What Gets Fixed Automatically</h2>
      <ul className="space-y-2 text-muted-foreground mb-8 list-disc list-inside">
        <li>TypeScript type errors and missing imports</li>
        <li>React component rendering errors</li>
        <li>API route failures and missing handlers</li>
        <li>Database query errors and schema mismatches</li>
        <li>Build configuration issues</li>
      </ul>

      <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Build with Self-Healing AI
      </Link>
    </main>
  )
}
