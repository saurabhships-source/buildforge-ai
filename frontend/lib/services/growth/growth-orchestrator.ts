/**
 * Growth Orchestrator — full pipeline from startup to growth system.
 *
 * Pipeline:
 *   startup → SEO strategy → content generation → social content
 *           → lead capture config → email automation → analytics setup
 */

import { generateSEOStrategy } from './seo-generator'
import { generateContentPlan } from './content-engine'
import { generateSocialCampaign } from './social-engine'
import { generateLeadFormConfig, leadStore } from './lead-generator'
import { generateEmailCampaigns } from './email-engine'
import { analyticsEngine } from './analytics-engine'
import { logger } from '@/lib/core/logger'
import type { StartupConcept } from '@/lib/services/startup/startup-brain'
import type { ModelId } from '@/lib/ai-engine/model-router'
import type { SEOStrategy } from './seo-generator'
import type { ContentPlan } from './content-engine'
import type { SocialCampaign } from './social-engine'
import type { LeadFormConfig } from './lead-generator'
import type { EmailCampaigns } from './email-engine'

export type GrowthStage =
  | 'seo' | 'content' | 'social' | 'leads' | 'email' | 'analytics' | 'done'

export interface GrowthProgress {
  stage: GrowthStage
  message: string
}

export interface GrowthPackage {
  startupId: string
  seo: SEOStrategy
  content: ContentPlan
  social: SocialCampaign
  leadForm: LeadFormConfig
  email: EmailCampaigns
  analyticsSetup: {
    trackingEvents: string[]
    dashboardUrl: string
    initialReport: ReturnType<typeof analyticsEngine.getReport>
  }
  launchReadinessScore: number    // 0–100
  launchReadinessChecklist: { item: string; done: boolean }[]
}

export interface GrowthOrchestratorOptions {
  modelId?: ModelId
  onProgress?: (progress: GrowthProgress) => void
}

export async function runGrowthOrchestrator(
  startupId: string,
  concept: StartupConcept,
  opts: GrowthOrchestratorOptions = {},
): Promise<GrowthPackage> {
  const { modelId = 'gemini_flash', onProgress } = opts

  const emit = (stage: GrowthStage, message: string) => {
    onProgress?.({ stage, message })
    logger.info('ai-pipeline', `[GrowthOrchestrator] ${stage}: ${message}`)
  }

  // ── Stage 1: SEO ───────────────────────────────────────────────────────────
  emit('seo', 'Generating SEO strategy...')
  const seo = await generateSEOStrategy(concept, modelId)
  emit('seo', `${seo.primaryKeywords.length} keywords, ${seo.landingPages.length} landing pages`)

  // ── Stage 2: Content ───────────────────────────────────────────────────────
  emit('content', 'Generating content plan...')
  const content = await generateContentPlan(concept, seo.blogTopics.map(t => t.title), modelId)
  emit('content', `${content.blogPosts.length} posts, ${content.tutorials.length} tutorials`)

  // ── Stage 3: Social ────────────────────────────────────────────────────────
  emit('social', 'Generating social media campaigns...')
  const social = await generateSocialCampaign(concept, modelId)
  emit('social', `${social.twitter.launchThread.length} tweets, ${social.reddit.posts.length} Reddit posts`)

  // ── Stage 4: Lead Capture ──────────────────────────────────────────────────
  emit('leads', 'Setting up lead capture...')
  const leadForm = generateLeadFormConfig(startupId, concept.name, concept.tagline)
  emit('leads', 'Lead capture form configured')

  // ── Stage 5: Email ─────────────────────────────────────────────────────────
  emit('email', 'Generating email sequences...')
  const email = await generateEmailCampaigns(concept, modelId)
  const totalEmails = Object.values(email).reduce((sum, seq) => sum + seq.emails.length, 0)
  emit('email', `${totalEmails} emails across ${Object.keys(email).length} sequences`)

  // ── Stage 6: Analytics ─────────────────────────────────────────────────────
  emit('analytics', 'Setting up analytics...')
  const trackingEvents = ['page_view', 'signup', 'login', 'feature_used', 'upgrade', 'email_opened']
  const initialReport = analyticsEngine.getReport(startupId)
  emit('analytics', 'Analytics tracking configured')

  // ── Launch readiness score ─────────────────────────────────────────────────
  const checklist = [
    { item: 'SEO strategy defined', done: seo.primaryKeywords.length > 0 },
    { item: 'Blog content planned', done: content.blogPosts.length > 0 },
    { item: 'Social campaigns ready', done: social.twitter.launchThread.length > 0 },
    { item: 'Product Hunt launch prepared', done: !!social.productHunt.title },
    { item: 'Lead capture configured', done: !!leadForm.headline },
    { item: 'Email sequences ready', done: totalEmails > 0 },
    { item: 'Analytics tracking set up', done: trackingEvents.length > 0 },
    { item: 'Launch checklist reviewed', done: false },
  ]
  const launchReadinessScore = Math.round(
    (checklist.filter(c => c.done).length / checklist.length) * 100
  )

  emit('done', `Growth package ready — ${launchReadinessScore}% launch readiness`)

  return {
    startupId,
    seo,
    content,
    social,
    leadForm,
    email,
    analyticsSetup: {
      trackingEvents,
      dashboardUrl: `/dashboard/analytics?startup=${startupId}`,
      initialReport,
    },
    launchReadinessScore,
    launchReadinessChecklist: checklist,
  }
}
