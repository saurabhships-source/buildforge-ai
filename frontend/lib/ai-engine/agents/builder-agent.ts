import { getBrandContext, generateProjectTitle } from '@/lib/brand-generator'

type AppType = string

// Design system injected into every generation — ensures world-class output
const DESIGN_SYSTEM = `
DESIGN SYSTEM — apply to every project:
- Color palette: rich gradients, glassmorphism cards, subtle grain textures
- Typography: Inter or system-ui for body, display font for headings, tight tracking on large text
- Spacing: generous whitespace, 8px grid system
- Shadows: layered box-shadows for depth (sm/md/lg/xl variants)
- Animations: entrance animations (fade-up, slide-in), hover micro-interactions, smooth transitions (200-300ms)
- Components: pill badges, gradient buttons with hover glow, frosted glass cards, animated progress bars
- Dark theme: slate-900/950 backgrounds, white/10 borders, muted text hierarchy
- Icons: use Unicode emoji or SVG inline icons — never external icon libraries
- Mobile: fluid typography (clamp), responsive grid (1→2→3 cols), touch-friendly tap targets (44px min)
- Performance: CSS custom properties for theming, will-change on animated elements, contain: layout on cards`

const QUALITY_RULES = `
QUALITY RULES — non-negotiable:
1. Every page must look like it was designed by a senior product designer
2. No placeholder text like "Lorem ipsum" — write real, contextual copy
3. No empty sections — every section must have real content
4. Buttons must have hover states, active states, and focus rings
5. Forms must have proper labels, validation feedback, and loading states
6. Navigation must work — anchor links, smooth scroll, mobile hamburger menu
7. All interactive elements must respond to user input with visual feedback
8. Color contrast must pass WCAG AA (4.5:1 for text)
9. Every project must include: proper meta tags, Open Graph tags, favicon emoji
10. JavaScript must be modular, commented, and handle errors gracefully`

const APP_CONTEXTS: Record<string, { description: string; sections: string[]; features: string[] }> = {
  restaurant: {
    description: 'a beautiful restaurant website with online presence',
    sections: ['Hero with full-bleed food photography background + reservation CTA', 'About / story section with chef photo', 'Menu section with categories (Starters, Mains, Desserts, Drinks) and prices', 'Gallery grid of food photos', 'Testimonials / reviews', 'Reservation / booking form', 'Location map embed + hours', 'Footer with social links'],
    features: ['Sticky navigation with logo', 'Smooth scroll between sections', 'Menu tab switching (Starters/Mains/Desserts)', 'Reservation form with date/time/guests', 'Mobile hamburger menu', 'Parallax hero effect', 'Opening hours display'],
  },
  portfolio: {
    description: 'a stunning personal portfolio website',
    sections: ['Hero with name, title, and animated tagline', 'About me with photo and bio', 'Skills / tech stack grid', 'Projects showcase (cards with screenshots)', 'Work experience timeline', 'Testimonials', 'Contact form', 'Footer with social links'],
    features: ['Smooth scroll navigation', 'Project filter by category', 'Animated skill bars', 'Contact form with validation', 'Dark/light mode toggle', 'Scroll-triggered animations', 'Mobile responsive'],
  },
  blog: {
    description: 'a modern blog with article listing and reading experience',
    sections: ['Header with logo and nav', 'Featured post hero', 'Article grid with thumbnails, titles, excerpts', 'Category filter tabs', 'Newsletter signup', 'Sidebar with popular posts', 'Footer'],
    features: ['Category filtering', 'Search bar', 'Reading time estimate', 'Article card hover effects', 'Newsletter form', 'Pagination', 'Social share buttons'],
  },
  ecommerce: {
    description: 'a modern e-commerce product store',
    sections: ['Hero banner with sale CTA', 'Featured products grid', 'Category navigation', 'Product cards with price + add to cart', 'Shopping cart sidebar', 'Testimonials', 'Newsletter signup', 'Footer'],
    features: ['Add to cart with quantity', 'Cart sidebar with total', 'Product image hover zoom', 'Category filter', 'Price sorting', 'Wishlist toggle', 'Mobile responsive grid'],
  },
  booking: {
    description: 'a service booking and appointment platform',
    sections: ['Hero with booking CTA', 'Services list with pricing', 'How it works (3 steps)', 'Team / staff profiles', 'Availability calendar', 'Booking form', 'Testimonials', 'FAQ', 'Footer'],
    features: ['Date/time picker', 'Service selection', 'Staff selection', 'Booking confirmation', 'Form validation', 'Mobile responsive', 'Smooth scroll'],
  },
  website: {
    description: 'a stunning modern marketing website',
    sections: ['Hero with animated gradient + CTA', 'Social proof / logos bar', 'Features grid (3-6 cards)', 'How it works (3 steps)', 'Testimonials carousel', 'Pricing table (3 tiers)', 'FAQ accordion', 'CTA banner', 'Footer with links'],
    features: ['Smooth scroll navigation', 'Mobile hamburger menu', 'Animated counters', 'Scroll-triggered animations', 'Email capture form', 'Cookie consent banner'],
  },
  tool: {
    description: 'a powerful interactive web tool',
    sections: ['Tool header with description', 'Input panel with controls', 'Real-time output/results panel', 'History/saved results', 'Share/export options', 'How to use guide'],
    features: ['Real-time computation', 'Input validation with feedback', 'Copy to clipboard', 'Export results (CSV/JSON/PDF)', 'Keyboard shortcuts', 'Undo/redo history'],
  },
  saas: {
    description: 'a complete SaaS product with landing page and app',
    sections: ['Marketing landing page', 'Auth pages (login/signup)', 'Onboarding flow', 'Main dashboard', 'Feature pages', 'Settings page', 'Billing/upgrade page'],
    features: ['Role-based navigation', 'Usage metrics dashboard', 'Team management UI', 'API key management', 'Notification system', 'Dark/light mode toggle'],
  },
  dashboard: {
    description: 'a professional admin dashboard',
    sections: ['Sidebar navigation', 'Top header with search + notifications', 'KPI cards row', 'Charts (line, bar, donut)', 'Data table with filters/sort/pagination', 'Recent activity feed', 'Quick actions panel'],
    features: ['Collapsible sidebar', 'Real-time data simulation', 'Table search and filter', 'Export to CSV', 'Date range picker', 'Notification dropdown'],
  },
  ai_app: {
    description: 'an AI-powered application',
    sections: ['Chat/prompt interface', 'Streaming response display', 'Conversation history sidebar', 'Model/settings panel', 'Output formatting options', 'Save/share results'],
    features: ['Streaming text animation', 'Markdown rendering', 'Code syntax highlighting', 'Copy code blocks', 'Conversation branching', 'Token usage display'],
  },
  crm: {
    description: 'a full-featured CRM system',
    sections: ['Contacts list with search/filter', 'Contact detail view', 'Deal pipeline (Kanban)', 'Activity timeline', 'Email composer', 'Reports & analytics', 'Calendar view'],
    features: ['Drag-and-drop pipeline', 'Contact import/export', 'Activity logging', 'Deal stage automation', 'Email templates', 'Revenue forecasting'],
  },
  internal_tool: {
    description: 'an internal business tool',
    sections: ['Main workflow interface', 'Data input forms', 'Results/output view', 'Audit log', 'User management', 'Settings/configuration'],
    features: ['Role-based access', 'Bulk operations', 'Data validation', 'Export reports', 'Activity audit trail', 'Keyboard shortcuts'],
  },
}

export function detectAppType(prompt: string): AppType {
  const p = prompt.toLowerCase()
  if (/restaurant|cafe|bistro|food|menu|dining|eatery|pizz|sushi|burger/.test(p)) return 'restaurant'
  if (/portfolio|personal site|my work|showcase|freelance|designer|developer site/.test(p)) return 'portfolio'
  if (/blog|article|post|writing|newsletter|publication/.test(p)) return 'blog'
  if (/shop|store|ecommerce|e-commerce|product|buy|cart|checkout/.test(p)) return 'ecommerce'
  if (/booking|appointment|reservation|schedule|calendar|availability/.test(p)) return 'booking'
  if (/crm|customer relation|contact management|lead management/.test(p)) return 'crm'
  if (/dashboard|admin panel|analytics|metrics|management system/.test(p)) return 'dashboard'
  if (/saas|platform|software|subscription/.test(p)) return 'saas'
  if (/tool|calculator|converter|generator|checker/.test(p)) return 'tool'
  if (/ai|chat|gpt|assistant|bot/.test(p)) return 'ai_app'
  return 'website'
}

/**
 * Returns true only when the prompt explicitly asks for a simple landing/marketing page.
 * Everything else is treated as a full application.
 */
export function isLandingPageOnly(prompt: string): boolean {
  const p = prompt.toLowerCase()
  return /\b(landing page|marketing page|marketing site|portfolio|personal site|coming soon|one.?page|single.?page|static site)\b/.test(p)
}

// Multi-page app structures per type
const FULL_APP_PAGES: Record<string, { pages: string[]; entrypoint: string; description: string }> = {
  saas: {
    pages: ['index.html', 'pages/login.html', 'pages/signup.html', 'pages/dashboard.html', 'pages/settings.html', 'pages/billing.html'],
    entrypoint: 'index.html',
    description: 'SaaS app with landing, auth, dashboard, settings, and billing pages',
  },
  ecommerce: {
    pages: ['index.html', 'pages/products.html', 'pages/product-detail.html', 'pages/cart.html', 'pages/checkout.html', 'pages/account.html'],
    entrypoint: 'index.html',
    description: 'E-commerce store with product listing, detail, cart, checkout, and account pages',
  },
  crm: {
    pages: ['pages/dashboard.html', 'pages/contacts.html', 'pages/contact-detail.html', 'pages/deals.html', 'pages/reports.html', 'pages/settings.html'],
    entrypoint: 'pages/dashboard.html',
    description: 'CRM with dashboard, contacts, deals pipeline, reports, and settings',
  },
  dashboard: {
    pages: ['pages/dashboard.html', 'pages/analytics.html', 'pages/users.html', 'pages/reports.html', 'pages/settings.html'],
    entrypoint: 'pages/dashboard.html',
    description: 'Admin dashboard with analytics, user management, reports, and settings',
  },
  ai_app: {
    pages: ['index.html', 'pages/chat.html', 'pages/history.html', 'pages/settings.html'],
    entrypoint: 'index.html',
    description: 'AI app with landing, chat interface, history, and settings',
  },
  internal_tool: {
    pages: ['pages/dashboard.html', 'pages/data.html', 'pages/reports.html', 'pages/settings.html'],
    entrypoint: 'pages/dashboard.html',
    description: 'Internal tool with dashboard, data management, reports, and settings',
  },
  booking: {
    pages: ['index.html', 'pages/services.html', 'pages/book.html', 'pages/confirmation.html', 'pages/account.html'],
    entrypoint: 'index.html',
    description: 'Booking platform with services, booking flow, confirmation, and account pages',
  },
}

export function builderSystemPrompt(appType: AppType, existingFiles?: Record<string, string>, prompt?: string): string {
  const resolvedType = prompt ? detectAppType(prompt) : appType
  const ctx = APP_CONTEXTS[resolvedType] ?? APP_CONTEXTS.website
  const isUpdate = existingFiles && Object.keys(existingFiles).length > 0
  const brandCtx = prompt && !isUpdate ? getBrandContext(prompt) : ''
  const fullApp = prompt ? !isLandingPageOnly(prompt) && !!FULL_APP_PAGES[resolvedType] : false
  const appPages = fullApp ? FULL_APP_PAGES[resolvedType] : null

  const sharedStack = `TECHNICAL STACK:
- HTML5 semantic markup (header, main, section, article, nav, footer)
- Tailwind CSS via CDN for utility classes
- Custom CSS in styles.css for animations, gradients, glassmorphism
- Vanilla JavaScript in script.js — ES6+, modular, well-commented
- No external dependencies except Tailwind CDN

TAILWIND CONFIG — add this to every HTML file <head>:
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: { 50:'#f0f9ff', 500:'#6366f1', 600:'#4f46e5', 900:'#1e1b4b' }
        },
        animation: {
          'fade-up': 'fadeUp 0.6s ease-out forwards',
          'slide-in': 'slideIn 0.4s ease-out forwards',
          'pulse-slow': 'pulse 3s ease-in-out infinite',
        }
      }
    }
  }
<\/script>`

  const seoRequirements = `SEO REQUIREMENTS — include in every HTML file <head>:
<meta name="description" content="[brand meta description]">
<meta property="og:title" content="[brand full name]">
<meta property="og:description" content="[brand meta description]">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://example.com">`

  const base = `You are BuilderAgent — the world's most advanced AI web developer. You build ${ctx.description}.

${brandCtx}

${DESIGN_SYSTEM}

${QUALITY_RULES}

REQUIRED SECTIONS for this ${resolvedType}:
${ctx.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

REQUIRED FEATURES:
${ctx.features.map(f => `• ${f}`).join('\n')}

${sharedStack}

${seoRequirements}
`

  if (fullApp && appPages) {
    const pageList = appPages.pages.map(p => `  "${p}": "COMPLETE HTML page — 150+ lines, full navigation, real content"`).join(',\n')
    const outputFormat = `OUTPUT FORMAT — return ONLY this exact JSON (no markdown, no fences, no extra text):
{
  "files": {
${pageList},
    "styles.css": "COMPLETE shared CSS — animations, glassmorphism, custom components, used by all pages",
    "script.js": "COMPLETE shared JS — navigation, state management, all interactivity"
  },
  "entrypoint": "${appPages.entrypoint}",
  "description": "what was built"
}

MULTI-PAGE RULES:
1. Every page must include a shared navigation bar with links to ALL other pages using relative paths (e.g., ../pages/dashboard.html or index.html)
2. Navigation must highlight the current active page
3. All pages must link to the same styles.css and script.js using correct relative paths
4. Each page must be fully functional and contain real, specific content — no placeholders
5. Pages in the pages/ folder must reference shared files as: ../styles.css and ../script.js
6. The entrypoint page (${appPages.entrypoint}) is the first page users see`

    if (isUpdate) {
      const fileList = Object.keys(existingFiles!).join(', ')
      return `${base}${outputFormat}

EXISTING FILES: ${fileList}
MODE: UPDATE — preserve all functionality, only improve/extend what the user requests.
Include ALL files in output (modified and unmodified).`
    }
    return `${base}${outputFormat}`
  }

  // Single-page / landing page output format
  const outputFormat = `OUTPUT FORMAT — return ONLY this exact JSON (no markdown, no fences, no extra text):
{
  "files": {
    "index.html": "COMPLETE HTML — minimum 200 lines, all sections included",
    "styles.css": "COMPLETE CSS — animations, glassmorphism, custom components",
    "script.js": "COMPLETE JS — all interactivity, state management, event handlers"
  },
  "entrypoint": "index.html",
  "description": "what was built"
}`

  if (isUpdate) {
    const fileList = Object.keys(existingFiles!).join(', ')
    return `${base}${outputFormat}

EXISTING FILES: ${fileList}
MODE: UPDATE — preserve all functionality, only improve/extend what the user requests.
Include ALL files in output (modified and unmodified).`
  }

  return `${base}${outputFormat}`
}

export function patchSystemPrompt(existingFiles: Record<string, string>): string {
  const fileList = Object.keys(existingFiles).join(', ')
  return `You are BuilderAgent in PATCH MODE — you apply targeted edits to an existing project.

${DESIGN_SYSTEM}

${QUALITY_RULES}

EXISTING FILES: ${fileList}

PATCH MODE RULES:
1. Only modify files that need to change for the user's request
2. Do NOT regenerate unchanged files
3. You MAY add new files if the feature requires them
4. You MAY delete files if explicitly requested
5. Preserve all existing functionality not mentioned in the request
6. Apply the design system to any new/modified UI

OUTPUT FORMAT — return ONLY this exact JSON (no markdown, no fences, no extra text):
{
  "updates": {
    "filename": "complete updated file content"
  },
  "newFiles": {
    "filename": "complete new file content"
  },
  "deletedFiles": [],
  "description": "what was changed"
}`
}

export function buildPatchUserMessage(
  prompt: string,
  existingFiles: Record<string, string>
): string {
  const filesContext = Object.entries(existingFiles)
    .map(([name, content]) => `=== ${name} ===\n${content}`)
    .join('\n\n')
  return `EXISTING PROJECT:\n${filesContext}\n\nUSER REQUEST: ${prompt}\n\nReturn only the files that need to change. Do not regenerate unchanged files.`
}

export function buildUserMessage(
  prompt: string,
  appType: AppType,
  existingFiles?: Record<string, string>
): string {
  const resolvedType = appType === 'website' ? detectAppType(prompt) : appType
  const ctx = APP_CONTEXTS[resolvedType] ?? APP_CONTEXTS.website

  if (existingFiles && Object.keys(existingFiles).length > 0) {
    const filesContext = Object.entries(existingFiles)
      .map(([name, content]) => `=== ${name} ===\n${content}`)
      .join('\n\n')
    return `EXISTING PROJECT:\n${filesContext}\n\nUSER REQUEST: ${prompt}\n\nRemember: preserve all existing functionality, apply the design system, and return ALL files.`
  }

  const brand = generateProjectTitle(prompt)
  const fullApp = !isLandingPageOnly(prompt) && !!FULL_APP_PAGES[resolvedType]
  const appPages = fullApp ? FULL_APP_PAGES[resolvedType] : null

  if (fullApp && appPages) {
    return `Build this full application: "${prompt}"

BRAND: Use "${brand.fullName}" as the app name everywhere (title, navbar, all pages, meta tags).
TAGLINE: "${brand.tagline}"

You are building ${ctx.description} as a COMPLETE MULTI-PAGE APPLICATION.

PAGES TO GENERATE (all required):
${appPages.pages.map((p, i) => `${i + 1}. ${p}`).join('\n')}

IMPORTANT RULES:
- Every page must have a shared navigation bar linking to ALL other pages
- Use correct relative paths between pages (e.g., from pages/ folder: ../index.html, ../pages/dashboard.html)
- All pages share styles.css and script.js — reference them with correct relative paths
- Generate REAL, SPECIFIC content for each page — no placeholders
- Each page must be fully functional with working UI components
- The app must feel like a real product, not a template

Required features across all pages: ${ctx.features.join(', ')}.

Make every page visually stunning, fully functional, and production-ready.`
  }

  return `Build this: "${prompt}"

BRAND: Use "${brand.fullName}" as the site name everywhere (title, navbar, hero, footer, meta tags).
TAGLINE: "${brand.tagline}"
HERO IMAGE: Use this exact URL for the hero background: ${brand.heroImage}

You are building ${ctx.description}.
IMPORTANT: Generate content SPECIFIC to what was requested. Do NOT use the raw prompt as a heading. Use the brand name instead.
Required sections: ${ctx.sections.join(', ')}.
Required features: ${ctx.features.join(', ')}.

Make it visually stunning, fully functional, and production-ready. Use real, specific copy — no placeholders.
Generate exactly 3 files: index.html (200+ lines), styles.css (100+ lines), script.js (80+ lines).`
}

// Export generateProjectTitle so builder page can use it for project naming
export { generateProjectTitle } from '@/lib/brand-generator'
