// Feature Installer — installs named features into existing project files
// "add authentication", "add payments", "add analytics", "add admin dashboard"

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import type { ModelId } from '@/lib/ai-engine/model-router'

export type FeatureId =
  | 'authentication' | 'payments' | 'analytics' | 'admin-dashboard'
  | 'blog' | 'dark-mode' | 'search' | 'notifications' | 'contact-form'
  | 'newsletter' | 'chat' | 'maps' | 'social-login' | 'file-upload'

export interface FeatureManifest {
  id: FeatureId
  name: string
  description: string
  newFiles: string[]
  modifiedFiles: string[]
  envVars: string[]
  dependencies: string[]
}

export interface FeatureInstallResult {
  feature: FeatureId
  files: Record<string, string>
  description: string
  envVars: string[]
  success: boolean
}

const FEATURE_MANIFESTS: Record<FeatureId, FeatureManifest> = {
  authentication: {
    id: 'authentication', name: 'Authentication', description: 'Login, signup, and session management',
    newFiles: ['login.html', 'signup.html', 'lib/auth.js'],
    modifiedFiles: ['index.html', 'script.js'],
    envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    dependencies: ['@supabase/supabase-js'],
  },
  payments: {
    id: 'payments', name: 'Payments', description: 'Stripe checkout and billing',
    newFiles: ['pricing.html', 'checkout.html', 'lib/stripe.js'],
    modifiedFiles: ['index.html'],
    envVars: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'],
    dependencies: ['stripe', '@stripe/stripe-js'],
  },
  analytics: {
    id: 'analytics', name: 'Analytics', description: 'Usage tracking and charts',
    newFiles: ['analytics.html', 'lib/analytics.js'],
    modifiedFiles: ['index.html', 'script.js'],
    envVars: [],
    dependencies: [],
  },
  'admin-dashboard': {
    id: 'admin-dashboard', name: 'Admin Dashboard', description: 'Admin panel with user management',
    newFiles: ['admin.html', 'admin.js'],
    modifiedFiles: ['index.html'],
    envVars: [],
    dependencies: [],
  },
  blog: {
    id: 'blog', name: 'Blog', description: 'Blog with posts and categories',
    newFiles: ['blog.html', 'post.html', 'lib/blog.js'],
    modifiedFiles: ['index.html'],
    envVars: [],
    dependencies: [],
  },
  'dark-mode': {
    id: 'dark-mode', name: 'Dark Mode', description: 'Light/dark theme toggle',
    newFiles: [],
    modifiedFiles: ['index.html', 'styles.css', 'script.js'],
    envVars: [],
    dependencies: [],
  },
  search: {
    id: 'search', name: 'Search', description: 'Full-text search functionality',
    newFiles: ['lib/search.js'],
    modifiedFiles: ['index.html', 'script.js'],
    envVars: [],
    dependencies: [],
  },
  notifications: {
    id: 'notifications', name: 'Notifications', description: 'Toast notifications and alerts',
    newFiles: ['lib/notifications.js'],
    modifiedFiles: ['index.html', 'script.js'],
    envVars: [],
    dependencies: [],
  },
  'contact-form': {
    id: 'contact-form', name: 'Contact Form', description: 'Contact form with email sending',
    newFiles: ['contact.html'],
    modifiedFiles: ['index.html'],
    envVars: ['RESEND_API_KEY'],
    dependencies: ['resend'],
  },
  newsletter: {
    id: 'newsletter', name: 'Newsletter', description: 'Email newsletter signup',
    newFiles: ['lib/newsletter.js'],
    modifiedFiles: ['index.html'],
    envVars: ['MAILCHIMP_API_KEY'],
    dependencies: [],
  },
  chat: {
    id: 'chat', name: 'Live Chat', description: 'Real-time chat widget',
    newFiles: ['lib/chat.js'],
    modifiedFiles: ['index.html', 'script.js'],
    envVars: [],
    dependencies: [],
  },
  maps: {
    id: 'maps', name: 'Maps', description: 'Interactive map integration',
    newFiles: ['lib/maps.js'],
    modifiedFiles: ['index.html'],
    envVars: ['NEXT_PUBLIC_GOOGLE_MAPS_KEY'],
    dependencies: [],
  },
  'social-login': {
    id: 'social-login', name: 'Social Login', description: 'Google and GitHub OAuth',
    newFiles: ['lib/oauth.js'],
    modifiedFiles: ['login.html', 'script.js'],
    envVars: ['GOOGLE_CLIENT_ID', 'GITHUB_CLIENT_ID'],
    dependencies: [],
  },
  'file-upload': {
    id: 'file-upload', name: 'File Upload', description: 'Drag-and-drop file upload',
    newFiles: ['lib/upload.js'],
    modifiedFiles: ['index.html', 'script.js'],
    envVars: [],
    dependencies: [],
  },
}

const INSTALLER_SYSTEM = `You are a feature installer for web apps. Add the requested feature to the existing project.

Return JSON:
{
  "files": {
    "filename": "complete file content"
  },
  "description": "what was added"
}

Rules:
- Return ALL files that need to be created or modified (complete content)
- Use HTML, Tailwind CSS CDN, and vanilla JavaScript
- Integrate seamlessly with existing code style
- No markdown fences in response`

/** Detect feature from natural language command */
export function detectFeature(command: string): FeatureId | null {
  const c = command.toLowerCase()
  if (/auth|login|signup|sign.?in|register/.test(c)) return 'authentication'
  if (/payment|stripe|checkout|billing|pay/.test(c)) return 'payments'
  if (/analytic|chart|metric|stat|tracking/.test(c)) return 'analytics'
  if (/admin|dashboard|panel|management/.test(c)) return 'admin-dashboard'
  if (/blog|post|article|cms/.test(c)) return 'blog'
  if (/dark.?mode|light.?mode|theme.?toggle/.test(c)) return 'dark-mode'
  if (/search|find|filter/.test(c)) return 'search'
  if (/notification|alert|toast/.test(c)) return 'notifications'
  if (/contact.?form|contact.?us/.test(c)) return 'contact-form'
  if (/newsletter|subscribe|email.?list/.test(c)) return 'newsletter'
  if (/chat|message|inbox/.test(c)) return 'chat'
  if (/map|location|address/.test(c)) return 'maps'
  if (/google.?login|github.?login|social.?login|oauth/.test(c)) return 'social-login'
  if (/upload|file|attachment/.test(c)) return 'file-upload'
  return null
}

/** Install a feature into existing project files */
export async function installFeature(
  featureId: FeatureId,
  existingFiles: Record<string, string>,
  projectName: string,
  modelId: ModelId = 'gemini_flash',
): Promise<FeatureInstallResult> {
  const manifest = FEATURE_MANIFESTS[featureId]
  const filesContext = Object.entries(existingFiles)
    .slice(0, 3)
    .map(([k, v]) => `=== ${k} ===\n${v.slice(0, 1500)}`)
    .join('\n\n')

  const prompt = `Install the "${manifest.name}" feature into this project.

Project: ${projectName}
Feature: ${manifest.description}
Files to create: ${manifest.newFiles.join(', ')}
Files to modify: ${manifest.modifiedFiles.join(', ')}

Existing project files:
${filesContext}

Generate all required files to add this feature.`

  try {
    const { text } = await generateText({
      model: getModel(modelId),
      system: INSTALLER_SYSTEM,
      prompt,
      maxOutputTokens: 8000,
    })

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned) as { files: Record<string, string>; description: string }

    return {
      feature: featureId,
      files: { ...existingFiles, ...result.files },
      description: result.description ?? `${manifest.name} installed`,
      envVars: manifest.envVars,
      success: Object.keys(result.files).length > 0,
    }
  } catch (err) {
    console.warn(`[feature-installer] AI failed for ${featureId}:`, err)
    // Return heuristic fallback
    const fallbackFiles = buildFallbackFeature(featureId, existingFiles, projectName)
    return {
      feature: featureId,
      files: { ...existingFiles, ...fallbackFiles },
      description: `${manifest.name} added (template)`,
      envVars: manifest.envVars,
      success: Object.keys(fallbackFiles).length > 0,
    }
  }
}

/** Install from a natural language command */
export async function installFromCommand(
  command: string,
  existingFiles: Record<string, string>,
  projectName: string,
  modelId: ModelId = 'gemini_flash',
): Promise<FeatureInstallResult | null> {
  const featureId = detectFeature(command)
  if (!featureId) return null
  return installFeature(featureId, existingFiles, projectName, modelId)
}

function buildFallbackFeature(
  featureId: FeatureId,
  existingFiles: Record<string, string>,
  projectName: string,
): Record<string, string> {
  switch (featureId) {
    case 'dark-mode': {
      const toggle = `
<!-- Dark Mode Toggle — add to your navbar -->
<button id="theme-toggle" onclick="toggleTheme()"
  class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
  <span id="theme-icon">🌙</span>
</button>
<script>
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark')
  document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙'
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}
// Restore on load
if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark')
  document.getElementById('theme-icon').textContent = '☀️'
}
<\/script>`
      return { 'dark-mode-snippet.html': toggle }
    }

    case 'contact-form': {
      return {
        'contact.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contact — ${projectName}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
  <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
    <h1 class="text-2xl font-bold mb-2">Contact Us</h1>
    <p class="text-gray-500 mb-6">We'd love to hear from you.</p>
    <form id="contact-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input type="text" required placeholder="Your name"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" required placeholder="you@example.com"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea rows="4" required placeholder="Your message..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
      </div>
      <button type="submit"
        class="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
        Send Message
      </button>
    </form>
    <div id="success" class="hidden text-center py-8">
      <div class="text-4xl mb-3">✅</div>
      <p class="font-semibold">Message sent!</p>
      <p class="text-gray-500 text-sm mt-1">We'll get back to you soon.</p>
    </div>
  </div>
  <script>
    document.getElementById('contact-form').addEventListener('submit', e => {
      e.preventDefault()
      document.getElementById('contact-form').classList.add('hidden')
      document.getElementById('success').classList.remove('hidden')
    })
  <\/script>
</body>
</html>`,
      }
    }

    case 'newsletter': {
      return {
        'newsletter-snippet.html': `
<!-- Newsletter Signup — embed anywhere -->
<section class="py-16 bg-indigo-600 text-white text-center px-6">
  <h2 class="text-2xl font-bold mb-2">Stay in the loop</h2>
  <p class="text-indigo-200 mb-6">Get the latest updates delivered to your inbox.</p>
  <form id="newsletter-form" class="flex gap-3 max-w-md mx-auto">
    <input type="email" required placeholder="Enter your email"
      class="flex-1 px-4 py-2.5 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white" />
    <button type="submit"
      class="px-5 py-2.5 bg-white text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors">
      Subscribe
    </button>
  </form>
  <p id="nl-success" class="hidden mt-4 text-indigo-200">🎉 You're subscribed!</p>
  <script>
    document.getElementById('newsletter-form').addEventListener('submit', e => {
      e.preventDefault()
      e.target.classList.add('hidden')
      document.getElementById('nl-success').classList.remove('hidden')
    })
  <\/script>
</section>`,
      }
    }

    default:
      return {}
  }
}

export { FEATURE_MANIFESTS }
