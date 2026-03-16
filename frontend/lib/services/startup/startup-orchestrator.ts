/**
 * Startup Orchestrator — full pipeline from idea to deployed startup package.
 *
 * Pipeline:
 *   idea → StartupBrain → MarketAnalyzer → ProductBrain → ProductFactory
 *        → LandingGenerator → PricingGenerator → MarketingGenerator → Deploy
 */

import { runStartupBrain } from './startup-brain'
import { analyzeMarket } from './market-analyzer'
import { generatePricing } from './pricing-generator'
import { generateLandingPage } from './landing-generator'
import { generateMarketing } from './marketing-generator'
import { buildProduct } from '@/lib/services/ai/product-factory'
import { deployProject } from '@/lib/services/deploy/deployment-engine'
import { logger } from '@/lib/core/logger'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { StartupConcept } from './startup-brain'
import type { MarketAnalysis } from './market-analyzer'
import type { PricingModel } from './pricing-generator'
import type { LandingPageFiles } from './landing-generator'
import type { MarketingStrategy } from './marketing-generator'

export type StartupStage =
  | 'brain' | 'market' | 'product' | 'landing' | 'pricing'
  | 'marketing' | 'deploy' | 'done'

export interface StartupProgress {
  stage: StartupStage
  message: string
}

export interface StartupPackage {
  projectId: string
  concept: StartupConcept
  market: MarketAnalysis
  pricing: PricingModel
  marketing: MarketingStrategy
  landingFiles: LandingPageFiles
  appFiles: Record<string, string>
  allFiles: Record<string, string>
  previewUrl: string
  deploymentUrl: string | null
  deployJobId: string | null
  fileCount: number
  fromCache: boolean
}

export interface StartupOrchestratorOptions {
  ownerId?: string
  modelId?: ModelId
  deploy?: boolean
  deployProvider?: 'vercel' | 'netlify'
  onProgress?: (progress: StartupProgress) => void
}

export async function generateStartup(
  idea: string,
  opts: StartupOrchestratorOptions = {},
): Promise<StartupPackage> {
  const {
    ownerId = 'anonymous',
    modelId = 'gemini_flash',
    deploy = false,
    deployProvider = 'vercel',
    onProgress,
  } = opts

  const emit = (stage: StartupStage, message: string) => {
    onProgress?.({ stage, message })
    logger.info('ai-pipeline', `[StartupOrchestrator] ${stage}: ${message}`)
  }

  // ── Stage 1: Startup Brain ─────────────────────────────────────────────────
  emit('brain', 'Interpreting startup idea...')
  const concept = await runStartupBrain(idea, modelId)
  emit('brain', `${concept.name} — ${concept.tagline}`)

  // ── Stage 2: Market Analysis ───────────────────────────────────────────────
  emit('market', 'Analyzing market and competition...')
  const market = await analyzeMarket(concept, modelId)
  emit('market', `${market.marketSize} market, ${market.competitors.length} competitors identified`)

  // ── Stage 3: Product Factory (SaaS app) ───────────────────────────────────
  emit('product', 'Generating SaaS product...')
  const productResult = await buildProduct(
    `Build a ${concept.category} SaaS called ${concept.name}: ${concept.solutionDescription}. Target users: ${concept.targetUsers.join(', ')}. Features: ${concept.keyFeatures.join(', ')}.`,
    {
      ownerId,
      modelId,
      deploy: false,
      onProgress: (p) => emit('product', p.message),
    },
  )
  emit('product', `${productResult.fileCount} app files generated`)

  // ── Stage 4: Landing Page ──────────────────────────────────────────────────
  emit('landing', 'Generating landing page...')
  const pricingModel = await generatePricing(concept, modelId)
  const landingFiles = await generateLandingPage(concept, pricingModel, market, modelId)
  emit('landing', `${Object.keys(landingFiles).length} landing page files`)

  // ── Stage 5: Pricing ───────────────────────────────────────────────────────
  emit('pricing', 'Finalizing pricing model...')
  // Already generated above — just log
  emit('pricing', `${pricingModel.tiers.map(t => `${t.name}: ${t.price}`).join(', ')}`)

  // ── Stage 6: Marketing ─────────────────────────────────────────────────────
  emit('marketing', 'Generating go-to-market strategy...')
  const marketing = await generateMarketing(concept, market, modelId)
  emit('marketing', `${marketing.channels.length} channels, ${marketing.emailSequences.length} email sequences`)

  // ── Merge all files ────────────────────────────────────────────────────────
  const allFiles: Record<string, string> = {
    ...productResult.files,
    ...landingFiles,
    'startup-package.json': JSON.stringify({
      concept,
      market: { marketSize: market.marketSize, uniqueOpportunity: market.uniqueOpportunity },
      pricing: { tiers: pricingModel.tiers.map(t => ({ name: t.name, price: t.price })) },
      marketing: { channels: marketing.channels, launchChecklist: marketing.launchChecklist },
    }, null, 2),
  }

  // ── Stage 7: Deploy (optional) ─────────────────────────────────────────────
  let deployJobId: string | null = null
  let deploymentUrl: string | null = null

  if (deploy) {
    emit('deploy', `Deploying to ${deployProvider}...`)
    try {
      const deployment = await deployProject({
        projectId: productResult.projectId,
        ownerId,
        files: allFiles,
        projectName: concept.name,
        provider: deployProvider,
      })
      deployJobId = deployment.jobId
      deploymentUrl = deployment.deploymentUrl ?? null
      emit('deploy', `Queued: ${deployJobId}`)
    } catch (err) {
      logger.warn('ai-pipeline', 'Startup deploy failed', err instanceof Error ? err.message : String(err))
    }
  }

  emit('done', `${concept.name} startup package ready — ${Object.keys(allFiles).length} files`)

  return {
    projectId: productResult.projectId,
    concept,
    market,
    pricing: pricingModel,
    marketing,
    landingFiles,
    appFiles: productResult.files,
    allFiles,
    previewUrl: productResult.previewUrl,
    deploymentUrl,
    deployJobId,
    fileCount: Object.keys(allFiles).length,
    fromCache: productResult.fromCache,
  }
}
