/**
 * Email Engine — creates automated email sequences for leads.
 * Sequences: welcome, onboarding tips, upgrade offer, re-engagement.
 */

import { aiJsonRequest } from '@/lib/core/ai-request'
import { logger } from '@/lib/core/logger'
import type { StartupConcept } from '@/lib/services/startup/startup-brain'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface EmailTemplate {
  id: string
  subject: string
  previewText: string
  body: string          // HTML email body
  sendDay: number       // days after signup
  trigger: 'signup' | 'day' | 'action' | 'inactivity'
  goal: 'onboarding' | 'activation' | 'upgrade' | 'retention' | 'reactivation'
}

export interface EmailSequence {
  name: string
  description: string
  emails: EmailTemplate[]
}

export interface EmailCampaigns {
  onboarding: EmailSequence
  upgrade: EmailSequence
  reengagement: EmailSequence
  productHuntLaunch: EmailSequence
}

export async function generateEmailCampaigns(
  concept: StartupConcept,
  modelId: ModelId = 'gemini_flash',
): Promise<EmailCampaigns> {
  logger.info('ai-pipeline', '[EmailEngine] Generating campaigns', concept.name)

  // Build all sequences statically (fast, consistent, no AI cost for email bodies)
  return {
    onboarding: buildOnboardingSequence(concept),
    upgrade: buildUpgradeSequence(concept),
    reengagement: buildReengagementSequence(concept),
    productHuntLaunch: buildProductHuntSequence(concept),
  }
}

function buildOnboardingSequence(concept: StartupConcept): EmailSequence {
  const name = concept.name
  const feature1 = concept.keyFeatures[0] ?? 'core features'
  const feature2 = concept.keyFeatures[1] ?? 'dashboard'
  const feature3 = concept.keyFeatures[2] ?? 'integrations'

  return {
    name: 'Onboarding',
    description: 'Welcome new users and guide them to activation',
    emails: [
      {
        id: 'welcome',
        subject: `Welcome to ${name} 🎉`,
        previewText: `You're in! Here's how to get started.`,
        body: `<h1>Welcome to ${name}!</h1>
<p>Hi {{first_name}},</p>
<p>You're in! We're thrilled to have you.</p>
<p><strong>${concept.valueProposition}</strong></p>
<h2>Get started in 3 steps:</h2>
<ol>
  <li>Complete your profile</li>
  <li>Try your first ${concept.domain} workflow</li>
  <li>Invite your team</li>
</ol>
<a href="{{dashboard_url}}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Go to dashboard →</a>
<p>Any questions? Just reply to this email — we read every one.</p>
<p>Team ${name}</p>`,
        sendDay: 0,
        trigger: 'signup',
        goal: 'onboarding',
      },
      {
        id: 'tips-day-3',
        subject: `3 tips to get the most out of ${name}`,
        previewText: `Power users do these 3 things first.`,
        body: `<h1>3 tips for ${name} power users</h1>
<p>Hi {{first_name}},</p>
<p>Here are 3 things our best users do in their first week:</p>
<h3>1. ${feature1}</h3>
<p>Set up ${feature1.toLowerCase()} to save time immediately.</p>
<h3>2. ${feature2}</h3>
<p>Your ${feature2.toLowerCase()} gives you a real-time view of everything.</p>
<h3>3. ${feature3}</h3>
<p>Connect your existing tools via ${feature3.toLowerCase()} for a seamless workflow.</p>
<a href="{{dashboard_url}}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Open ${name} →</a>
<p>Team ${name}</p>`,
        sendDay: 3,
        trigger: 'day',
        goal: 'activation',
      },
      {
        id: 'check-in-day-7',
        subject: `How's it going with ${name}?`,
        previewText: `We'd love to hear your feedback.`,
        body: `<h1>Quick check-in</h1>
<p>Hi {{first_name}},</p>
<p>You've been using ${name} for a week — how's it going?</p>
<p>We'd love to hear what's working and what could be better. Just reply to this email.</p>
<p>Also, if you haven't tried <strong>${feature1}</strong> yet, now's a great time!</p>
<a href="{{dashboard_url}}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Continue where you left off →</a>
<p>Team ${name}</p>`,
        sendDay: 7,
        trigger: 'day',
        goal: 'activation',
      },
    ],
  }
}

function buildUpgradeSequence(concept: StartupConcept): EmailSequence {
  const name = concept.name
  const proFeatures = concept.keyFeatures.slice(2, 5)

  return {
    name: 'Upgrade',
    description: 'Convert free users to paid',
    emails: [
      {
        id: 'upgrade-day-14',
        subject: `You're hitting your limits on ${name}`,
        previewText: `Upgrade to Pro and unlock everything.`,
        body: `<h1>Ready to unlock more?</h1>
<p>Hi {{first_name}},</p>
<p>You've been getting great value from ${name}'s free plan. Here's what you're missing on Pro:</p>
<ul>
${proFeatures.map(f => `  <li>✅ ${f}</li>`).join('\n')}
  <li>✅ Priority support</li>
  <li>✅ Unlimited projects</li>
</ul>
<p>Upgrade today and use code <strong>UPGRADE20</strong> for 20% off your first month.</p>
<a href="{{upgrade_url}}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Upgrade to Pro →</a>
<p>Team ${name}</p>`,
        sendDay: 14,
        trigger: 'day',
        goal: 'upgrade',
      },
      {
        id: 'upgrade-day-21',
        subject: `Last chance: 20% off ${name} Pro`,
        previewText: `Offer expires in 48 hours.`,
        body: `<h1>Your discount expires soon</h1>
<p>Hi {{first_name}},</p>
<p>Your 20% discount code <strong>UPGRADE20</strong> expires in 48 hours.</p>
<p>${concept.valueProposition}</p>
<a href="{{upgrade_url}}" style="background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Claim your discount →</a>
<p>Team ${name}</p>`,
        sendDay: 21,
        trigger: 'day',
        goal: 'upgrade',
      },
    ],
  }
}

function buildReengagementSequence(concept: StartupConcept): EmailSequence {
  const name = concept.name

  return {
    name: 'Re-engagement',
    description: 'Win back inactive users',
    emails: [
      {
        id: 'reengagement-day-30',
        subject: `We miss you, {{first_name}} 👋`,
        previewText: `Here's what's new in ${name}.`,
        body: `<h1>We've been busy building for you</h1>
<p>Hi {{first_name}},</p>
<p>We noticed you haven't logged into ${name} in a while. Here's what's new:</p>
<ul>
  <li>🚀 Faster performance</li>
  <li>✨ New ${concept.keyFeatures[0] ?? 'features'}</li>
  <li>🔧 Improved ${concept.keyFeatures[1] ?? 'dashboard'}</li>
</ul>
<a href="{{dashboard_url}}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Come back and explore →</a>
<p>Team ${name}</p>`,
        sendDay: 30,
        trigger: 'inactivity',
        goal: 'reactivation',
      },
    ],
  }
}

function buildProductHuntSequence(concept: StartupConcept): EmailSequence {
  const name = concept.name

  return {
    name: 'Product Hunt Launch',
    description: 'Drive support on launch day',
    emails: [
      {
        id: 'ph-launch-day',
        subject: `We're live on Product Hunt today! 🚀`,
        previewText: `Support us and get 30% off.`,
        body: `<h1>We're live on Product Hunt!</h1>
<p>Hi {{first_name}},</p>
<p>Today's the day! ${name} is live on Product Hunt.</p>
<p>If ${name} has helped you, we'd love your support — it takes 30 seconds and means the world to us.</p>
<a href="{{product_hunt_url}}" style="background:#da552f;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Upvote on Product Hunt →</a>
<p>As a thank you, use code <strong>PRODUCTHUNT</strong> for 30% off Pro.</p>
<p>Team ${name}</p>`,
        sendDay: 0,
        trigger: 'action',
        goal: 'retention',
      },
    ],
  }
}
