import { NextRequest, NextResponse } from 'next/server'
import { buildSandbox } from '@/lib/services/self-improve/sandbox-builder'
import { runSelfTests } from '@/lib/services/self-improve/self-test-runner'
import type { GeneratedPatch } from '@/lib/services/self-improve/patch-generator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { patch: GeneratedPatch }
    if (!body.patch) {
      return NextResponse.json({ error: 'patch required' }, { status: 400 })
    }

    const sandboxResult = buildSandbox(body.patch)
    const testReport = await runSelfTests(sandboxResult)

    return NextResponse.json({ sandboxResult, testReport })
  } catch (err) {
    console.error('[system/sandbox-test]', err)
    return NextResponse.json({ error: 'Sandbox test failed' }, { status: 500 })
  }
}
