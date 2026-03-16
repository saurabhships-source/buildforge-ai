// Improvement Cycle — orchestrates the full self-improvement pipeline
// scanSystem → detectOpportunities → planFeature → generatePatch → sandbox → test → propose

import { scanSystem, type SystemReport } from './system-monitor'
import { detectOpportunities, type OpportunityReport } from './opportunity-detector'
import { planFeature } from './feature-planner'
import { generatePatch } from './patch-generator'
import { buildSandbox } from './sandbox-builder'
import { runSelfTests } from './self-test-runner'
import { patchManager } from './patch-manager'
import type { ModelId } from '@/lib/ai-engine/model-router'

export type CycleStage =
  | 'scanning' | 'detecting' | 'planning' | 'generating'
  | 'sandboxing' | 'testing' | 'proposing' | 'done' | 'error'

export interface CycleProgress {
  stage: CycleStage
  message: string
  opportunityTitle?: string
}

export interface CycleResult {
  systemReport: SystemReport
  opportunityReport: OpportunityReport
  proposalsCreated: number
  proposalIds: string[]
  errors: string[]
  completedAt: string
}

export type CycleProgressCallback = (progress: CycleProgress) => void

export interface ImprovementCycleOptions {
  modelId?: ModelId
  maxOpportunities?: number
  onProgress?: CycleProgressCallback
  /** Only process opportunities with this priority or higher */
  minPriority?: 'low' | 'medium' | 'high'
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export async function runImprovementCycle(
  opts: ImprovementCycleOptions = {},
): Promise<CycleResult> {
  const {
    modelId = 'gemini_flash',
    maxOpportunities = 3,
    onProgress,
    minPriority = 'medium',
  } = opts

  const emit = (stage: CycleStage, message: string, opportunityTitle?: string) => {
    onProgress?.({ stage, message, opportunityTitle })
  }

  const errors: string[] = []
  const proposalIds: string[] = []

  // Stage 1: Scan
  emit('scanning', 'Scanning BuildForge codebase...')
  const systemReport = await scanSystem()
  emit('scanning', `Health score: ${systemReport.healthScore}% — ${systemReport.issues.length} issues found`)

  // Stage 2: Detect opportunities
  emit('detecting', 'Detecting improvement opportunities...')
  const opportunityReport = detectOpportunities(systemReport)
  emit('detecting', `Found ${opportunityReport.totalCount} opportunities (${opportunityReport.highPriorityCount} high priority)`)

  // Filter by priority and limit count
  const filtered = opportunityReport.opportunities
    .filter(o => PRIORITY_ORDER[o.priority] <= PRIORITY_ORDER[minPriority])
    .slice(0, maxOpportunities)

  // Stage 3-7: Process each opportunity
  for (const opportunity of filtered) {
    try {
      // Plan
      emit('planning', `Planning: ${opportunity.title}`, opportunity.title)
      const plan = planFeature(opportunity)

      if (plan.safetyLevel === 'blocked') {
        errors.push(`Blocked: ${plan.featureName} — ${plan.blockedReason}`)
        continue
      }

      // Generate patch
      emit('generating', `Generating patch for: ${opportunity.title}`, opportunity.title)
      const patch = await generatePatch(plan, modelId)

      if (patch.files.length === 0) {
        errors.push(`No files generated for: ${opportunity.title}`)
        continue
      }

      // Sandbox
      emit('sandboxing', `Building sandbox for: ${opportunity.title}`, opportunity.title)
      const sandboxResult = buildSandbox(patch)

      // Test
      emit('testing', `Running tests for: ${opportunity.title}`, opportunity.title)
      const testReport = await runSelfTests(sandboxResult)

      if (!testReport.success) {
        errors.push(`Tests failed for ${opportunity.title}: ${testReport.errors.join(', ')}`)
        // Still create proposal but mark test failure
      }

      // Propose (only if tests pass or it's review-required)
      if (testReport.success || plan.safetyLevel === 'review-required') {
        emit('proposing', `Creating proposal for: ${opportunity.title}`, opportunity.title)
        const proposal = patchManager.createPatchProposal(patch, plan, testReport)
        proposalIds.push(proposal.id)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed: ${opportunity.title}`
      errors.push(msg)
      console.error('[improvement-cycle]', msg)
    }
  }

  emit('done', `Cycle complete — ${proposalIds.length} proposals created`)

  return {
    systemReport,
    opportunityReport,
    proposalsCreated: proposalIds.length,
    proposalIds,
    errors,
    completedAt: new Date().toISOString(),
  }
}
