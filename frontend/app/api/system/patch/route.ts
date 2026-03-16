import { NextRequest, NextResponse } from 'next/server'
import { planFeature } from '@/lib/services/self-improve/feature-planner'
import { generatePatch } from '@/lib/services/self-improve/patch-generator'
import { buildSandbox } from '@/lib/services/self-improve/sandbox-builder'
import { runSelfTests } from '@/lib/services/self-improve/self-test-runner'
import { patchManager } from '@/lib/services/self-improve/patch-manager'
import type { Opportunity } from '@/lib/services/self-improve/opportunity-detector'
import type { ModelId } from '@/lib/ai-engine/model-router'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { opportunity: Opportunity; modelId?: ModelId }
    const { opportunity, modelId = 'gemini_flash' } = body

    if (!opportunity) {
      return NextResponse.json({ error: 'opportunity required' }, { status: 400 })
    }

    const plan = planFeature(opportunity)
    if (plan.safetyLevel === 'blocked') {
      return NextResponse.json({ error: `Blocked: ${plan.blockedReason}` }, { status: 403 })
    }

    const patch = await generatePatch(plan, modelId)
    const sandboxResult = buildSandbox(patch)
    const testReport = await runSelfTests(sandboxResult)

    const proposal = patchManager.createPatchProposal(patch, plan, testReport)

    return NextResponse.json({
      proposal,
      plan,
      patch,
      sandboxResult,
      testReport,
    })
  } catch (err) {
    console.error('[system/patch]', err)
    return NextResponse.json({ error: 'Patch generation failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json(patchManager.getAll())
}
