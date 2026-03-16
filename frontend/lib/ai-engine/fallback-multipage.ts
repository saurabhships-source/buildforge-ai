// Multi-page fallback generators for full application types
import type { FallbackResult } from './fallback-generator'
import { generateProjectTitle } from '@/lib/brand-generator'

type Brand = ReturnType<typeof generateProjectTitle>

function sharedNav(brand: Brand, pages: Array<{ label: string; href: string }>, currentLabel: string, prefix = ''): string {
  const links = pages.map(p =>
    `<a href="${prefix}${p.href}" class="nav-link${p.label === currentLabel ? ' active' : ''}">${p.label}</a>`
  ).join('\n      ')
  return `<nav class="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between">
    <a href="${prefix}index.html" class="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">${brand.fullName}</a>
    <div class="hidden md:flex gap-6 text-sm">
      ${links}
    </div>
    <button class="md:hidden text-white text-xl" onclick="document.getElementById('mnav').classList.toggle('hidden')">☰</button>
  </nav>
  <div id="mnav" class="hidden fixed top-14 left-0 w-full bg-slate-900/98 z-40 flex flex-col gap-3 px-6 py-4 border-b border-white/10 text-sm">
    ${links}
  </div>`
}

function sharedCss(): string {
  return `*{box-sizing:border-box}body{font-family:system-ui,sans-serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.fade-up{animation:fadeUp 0.5s ease-out}
.nav-link{color:#94a3b8;transition:color 0.2s;text-decoration:none}
.nav-link:hover,.nav-link.active{color:#fff}
.nav-link.active{font-weight:600}
.card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:1rem;padding:1.5rem;transition:border-color 0.2s,transform 0.2s}
.card:hover{border-color:rgba(99,102,241,0.5);transform:translateY(-2px)}
.btn-primary{background:#6366f1;color:#fff;padding:0.625rem 1.5rem;border-radius:0.75rem;font-weight:600;font-size:0.875rem;border:none;cursor:pointer;transition:background 0.2s}
.btn-primary:hover{background:#4f46e5}
.btn-secondary{background:transparent;color:#fff;padding:0.625rem 1.5rem;border-radius:0.75rem;font-weight:500;font-size:0.875rem;border:1px solid rgba(255,255,255,0.2);cursor:pointer;transition:background 0.2s}
.btn-secondary:hover{background:rgba(255,255,255,0.1)}
input,select,textarea{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:0.75rem;padding:0.625rem 1rem;color:#fff;font-size:0.875rem;width:100%;outline:none;transition:border-color 0.2s}
input:focus,select:focus,textarea:focus{border-color:#6366f1}
input::placeholder,textarea::placeholder{color:#64748b}
.stat-card{text-align:center;padding:1.5rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:1rem}
.stat-value{font-size:2rem;font-weight:700;color:#818cf8}
.stat-label{font-size:0.75rem;color:#64748b;margin-top:0.25rem}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:0.75rem 1rem;font-size:0.75rem;color:#64748b;border-bottom:1px solid rgba(255,255,255,0.1)}
td{padding:0.75rem 1rem;font-size:0.875rem;border-bottom:1px solid rgba(255,255,255,0.05)}
tr:hover td{background:rgba(255,255,255,0.03)}
.badge{display:inline-flex;align-items:center;padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.7rem;font-weight:600}
.badge-green{background:rgba(34,197,94,0.15);color:#4ade80}
.badge-blue{background:rgba(99,102,241,0.15);color:#818cf8}
.badge-yellow{background:rgba(234,179,8,0.15);color:#facc15}
.sidebar{position:fixed;left:0;top:0;height:100vh;width:220px;background:#0f172a;border-right:1px solid rgba(255,255,255,0.08);padding:1.5rem 1rem;display:flex;flex-direction:column;gap:0.5rem;z-index:40}
.sidebar-link{display:flex;align-items:center;gap:0.75rem;padding:0.625rem 0.75rem;border-radius:0.625rem;color:#94a3b8;font-size:0.875rem;text-decoration:none;transition:all 0.2s}
.sidebar-link:hover,.sidebar-link.active{background:rgba(99,102,241,0.15);color:#fff}
.main-content{margin-left:220px;padding:2rem}
@media(max-width:768px){.sidebar{display:none}.main-content{margin-left:0}}`
}

function sharedJs(brand: Brand): string {
  return `// ${brand.fullName} — shared app logic
document.addEventListener('DOMContentLoaded', () => {
  // Highlight active sidebar/nav links
  const path = window.location.pathname.split('/').pop() || 'index.html'
  document.querySelectorAll('[data-page]').forEach(el => {
    if (el.getAttribute('data-page') === path) el.classList.add('active')
  })
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' })
    })
  })
})
function showToast(msg, type = 'success') {
  const t = document.createElement('div')
  t.className = 'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl ' + (type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}`
}

// ── SaaS Multi-page Fallback ──────────────────────────────────────────────────
export function generateSaasFallback(brand: Brand): FallbackResult {
  const nav = [
    { label: 'Home', href: 'index.html' },
    { label: 'Dashboard', href: 'pages/dashboard.html' },
    { label: 'Pricing', href: '#pricing' },
  ]
  const indexHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${brand.fullName}</title><meta name="description" content="${brand.metaDescription}"/>
<script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen">
${sharedNav(brand, nav, 'Home')}
<main class="pt-20">
  <section class="max-w-5xl mx-auto px-6 py-24 text-center fade-up">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs mb-8 font-medium">✦ Now in Beta</div>
    <h1 class="text-6xl font-bold mb-6 leading-tight">${brand.fullName}</h1>
    <p class="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">${brand.tagline}</p>
    <div class="flex gap-4 justify-center flex-wrap">
      <a href="pages/signup.html" class="btn-primary px-8 py-3">Start Free Trial</a>
      <a href="pages/dashboard.html" class="btn-secondary px-8 py-3">View Demo</a>
    </div>
    <div class="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
      <div class="stat-card"><div class="stat-value">10k+</div><div class="stat-label">Active Users</div></div>
      <div class="stat-card"><div class="stat-value">99.9%</div><div class="stat-label">Uptime</div></div>
      <div class="stat-card"><div class="stat-value">4.9★</div><div class="stat-label">Rating</div></div>
    </div>
  </section>
  <section class="max-w-5xl mx-auto px-6 py-16">
    <h2 class="text-3xl font-bold text-center mb-12">Everything you need</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="card"><div class="text-3xl mb-3">⚡</div><h3 class="font-semibold mb-2">Lightning Fast</h3><p class="text-slate-400 text-sm">Built for performance at scale. Sub-100ms response times guaranteed.</p></div>
      <div class="card"><div class="text-3xl mb-3">🔒</div><h3 class="font-semibold mb-2">Enterprise Security</h3><p class="text-slate-400 text-sm">SOC2 compliant, end-to-end encryption, and role-based access control.</p></div>
      <div class="card"><div class="text-3xl mb-3">📊</div><h3 class="font-semibold mb-2">Advanced Analytics</h3><p class="text-slate-400 text-sm">Real-time dashboards, custom reports, and actionable insights.</p></div>
    </div>
  </section>
  <section id="pricing" class="max-w-4xl mx-auto px-6 py-16">
    <h2 class="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="card text-center"><h3 class="font-bold mb-2">Starter</h3><p class="text-4xl font-black my-4 text-indigo-400">$0<span class="text-base font-normal text-slate-400">/mo</span></p><ul class="text-slate-400 text-sm space-y-2 mb-6 text-left"><li>✓ Up to 3 projects</li><li>✓ 1GB storage</li><li>✓ Community support</li></ul><a href="pages/signup.html" class="btn-secondary block text-center py-2">Get Started</a></div>
      <div class="card text-center border-indigo-500/50 relative"><span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs px-3 py-1 rounded-full font-bold">Popular</span><h3 class="font-bold mb-2">Pro</h3><p class="text-4xl font-black my-4 text-indigo-400">$29<span class="text-base font-normal text-slate-400">/mo</span></p><ul class="text-slate-400 text-sm space-y-2 mb-6 text-left"><li>✓ Unlimited projects</li><li>✓ 50GB storage</li><li>✓ Priority support</li><li>✓ Advanced analytics</li></ul><a href="pages/signup.html" class="btn-primary block text-center py-2">Start Free Trial</a></div>
      <div class="card text-center"><h3 class="font-bold mb-2">Enterprise</h3><p class="text-4xl font-black my-4 text-indigo-400">$99<span class="text-base font-normal text-slate-400">/mo</span></p><ul class="text-slate-400 text-sm space-y-2 mb-6 text-left"><li>✓ Everything in Pro</li><li>✓ Unlimited storage</li><li>✓ Dedicated support</li><li>✓ Custom integrations</li></ul><a href="pages/signup.html" class="btn-secondary block text-center py-2">Contact Sales</a></div>
    </div>
  </section>
</main>
<footer class="border-t border-white/10 px-6 py-8 text-center text-slate-500 text-sm mt-8">
  <p class="text-indigo-400 font-semibold mb-1">${brand.fullName}</p>
  <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
</footer>
<script src="script.js"><\/script></body></html>`

  const loginHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Login — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center px-6">
<div class="w-full max-w-sm">
  <a href="../index.html" class="block text-center text-lg font-bold text-indigo-400 mb-8">${brand.fullName}</a>
  <div class="card">
    <h1 class="text-xl font-bold mb-6 text-center">Welcome back</h1>
    <form onsubmit="handleLogin(event)" class="space-y-4">
      <div><label class="text-xs text-slate-400 mb-1 block">Email</label><input type="email" placeholder="you@example.com" required/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Password</label><input type="password" placeholder="••••••••" required/></div>
      <button type="submit" id="login-btn" class="btn-primary w-full py-3">Sign In</button>
    </form>
    <p class="text-center text-slate-400 text-sm mt-4">No account? <a href="signup.html" class="text-indigo-400 hover:underline">Sign up free</a></p>
  </div>
</div>
<script src="../script.js"><\/script>
<script>function handleLogin(e){e.preventDefault();const btn=document.getElementById('login-btn');btn.textContent='Signing in...';btn.disabled=true;setTimeout(()=>{window.location.href='dashboard.html'},1200)}<\/script>
</body></html>`

  const signupHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Sign Up — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center px-6">
<div class="w-full max-w-sm">
  <a href="../index.html" class="block text-center text-lg font-bold text-indigo-400 mb-8">${brand.fullName}</a>
  <div class="card">
    <h1 class="text-xl font-bold mb-6 text-center">Create your account</h1>
    <form onsubmit="handleSignup(event)" class="space-y-4">
      <div><label class="text-xs text-slate-400 mb-1 block">Full Name</label><input type="text" placeholder="Your name" required/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Email</label><input type="email" placeholder="you@example.com" required/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Password</label><input type="password" placeholder="Min 8 characters" required/></div>
      <button type="submit" id="signup-btn" class="btn-primary w-full py-3">Create Account — Free</button>
    </form>
    <p class="text-center text-slate-400 text-sm mt-4">Already have an account? <a href="login.html" class="text-indigo-400 hover:underline">Sign in</a></p>
  </div>
</div>
<script src="../script.js"><\/script>
<script>function handleSignup(e){e.preventDefault();const btn=document.getElementById('signup-btn');btn.textContent='Creating account...';btn.disabled=true;setTimeout(()=>{window.location.href='dashboard.html'},1200)}<\/script>
</body></html>`

  const dashboardHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Dashboard — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar">
  <a href="../index.html" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>
  <a href="dashboard.html" class="sidebar-link active" data-page="dashboard.html">📊 Dashboard</a>
  <a href="settings.html" class="sidebar-link" data-page="settings.html">⚙️ Settings</a>
  <a href="billing.html" class="sidebar-link" data-page="billing.html">💳 Billing</a>
  <div class="mt-auto pt-4 border-t border-white/10"><a href="login.html" class="sidebar-link text-slate-500">← Sign Out</a></div>
</aside>
<main class="main-content pt-6">
  <div class="flex items-center justify-between mb-8">
    <div><h1 class="text-2xl font-bold">Dashboard</h1><p class="text-slate-400 text-sm">Welcome back to ${brand.fullName}</p></div>
    <button class="btn-primary">+ New Project</button>
  </div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="stat-card"><div class="stat-value">24</div><div class="stat-label">Active Projects</div></div>
    <div class="stat-card"><div class="stat-value">1.2k</div><div class="stat-label">API Calls Today</div></div>
    <div class="stat-card"><div class="stat-value">98%</div><div class="stat-label">Uptime</div></div>
    <div class="stat-card"><div class="stat-value">$0</div><div class="stat-label">This Month</div></div>
  </div>
  <div class="card mb-6">
    <h2 class="font-semibold mb-4">Recent Projects</h2>
    <table><thead><tr><th>Name</th><th>Status</th><th>Last Updated</th><th>Actions</th></tr></thead>
    <tbody>
      <tr><td class="font-medium">Marketing Site</td><td><span class="badge badge-green">Live</span></td><td class="text-slate-400">2 hours ago</td><td><button class="text-indigo-400 text-sm hover:underline">Open</button></td></tr>
      <tr><td class="font-medium">API Dashboard</td><td><span class="badge badge-blue">Building</span></td><td class="text-slate-400">1 day ago</td><td><button class="text-indigo-400 text-sm hover:underline">Open</button></td></tr>
      <tr><td class="font-medium">Mobile App</td><td><span class="badge badge-yellow">Draft</span></td><td class="text-slate-400">3 days ago</td><td><button class="text-indigo-400 text-sm hover:underline">Open</button></td></tr>
    </tbody></table>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const settingsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Settings — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar">
  <a href="../index.html" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>
  <a href="dashboard.html" class="sidebar-link" data-page="dashboard.html">📊 Dashboard</a>
  <a href="settings.html" class="sidebar-link active" data-page="settings.html">⚙️ Settings</a>
  <a href="billing.html" class="sidebar-link" data-page="billing.html">💳 Billing</a>
</aside>
<main class="main-content pt-6">
  <h1 class="text-2xl font-bold mb-8">Account Settings</h1>
  <div class="card max-w-lg mb-6">
    <h2 class="font-semibold mb-4">Profile</h2>
    <form onsubmit="saveSettings(event)" class="space-y-4">
      <div><label class="text-xs text-slate-400 mb-1 block">Full Name</label><input type="text" value="John Doe"/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Email</label><input type="email" value="john@example.com"/></div>
      <button type="submit" class="btn-primary">Save Changes</button>
    </form>
  </div>
  <div class="card max-w-lg">
    <h2 class="font-semibold mb-4">API Keys</h2>
    <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-3">
      <code class="text-xs text-slate-300 flex-1">sk-••••••••••••••••••••••••••••••••</code>
      <button onclick="showToast('Copied!')" class="text-indigo-400 text-xs hover:underline">Copy</button>
    </div>
    <button class="btn-secondary text-sm">Generate New Key</button>
  </div>
</main>
<script src="../script.js"><\/script>
<script>function saveSettings(e){e.preventDefault();showToast('Settings saved!')}<\/script>
</body></html>`

  const billingHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Billing — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar">
  <a href="../index.html" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>
  <a href="dashboard.html" class="sidebar-link" data-page="dashboard.html">📊 Dashboard</a>
  <a href="settings.html" class="sidebar-link" data-page="settings.html">⚙️ Settings</a>
  <a href="billing.html" class="sidebar-link active" data-page="billing.html">💳 Billing</a>
</aside>
<main class="main-content pt-6">
  <h1 class="text-2xl font-bold mb-8">Billing</h1>
  <div class="card max-w-lg mb-6">
    <div class="flex items-center justify-between mb-4"><h2 class="font-semibold">Current Plan</h2><span class="badge badge-green">Active</span></div>
    <p class="text-2xl font-bold text-indigo-400 mb-1">Starter — Free</p>
    <p class="text-slate-400 text-sm mb-4">3 projects · 1GB storage · Community support</p>
    <button class="btn-primary">Upgrade to Pro — $29/mo</button>
  </div>
  <div class="card max-w-lg">
    <h2 class="font-semibold mb-4">Billing History</h2>
    <p class="text-slate-400 text-sm">No invoices yet. Upgrade to a paid plan to see billing history.</p>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  return {
    files: {
      'index.html': indexHtml,
      'pages/login.html': loginHtml,
      'pages/signup.html': signupHtml,
      'pages/dashboard.html': dashboardHtml,
      'pages/settings.html': settingsHtml,
      'pages/billing.html': billingHtml,
      'styles.css': sharedCss(),
      'script.js': sharedJs(brand),
    },
    entrypoint: 'index.html',
    description: `${brand.fullName} SaaS app — landing, auth, dashboard, settings, billing`,
  }
}

// ── CRM Multi-page Fallback ───────────────────────────────────────────────────
export function generateCrmFallback(brand: Brand): FallbackResult {
  const sidebarLinks = `
  <a href="dashboard.html" class="sidebar-link" data-page="dashboard.html">📊 Dashboard</a>
  <a href="contacts.html" class="sidebar-link" data-page="contacts.html">👥 Contacts</a>
  <a href="deals.html" class="sidebar-link" data-page="deals.html">💼 Deals</a>
  <a href="reports.html" class="sidebar-link" data-page="reports.html">📈 Reports</a>
  <a href="settings.html" class="sidebar-link" data-page="settings.html">⚙️ Settings</a>`

  const dashboardHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Dashboard — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <div class="flex items-center justify-between mb-8"><h1 class="text-2xl font-bold">CRM Dashboard</h1><button class="btn-primary">+ Add Contact</button></div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="stat-card"><div class="stat-value">248</div><div class="stat-label">Total Contacts</div></div>
    <div class="stat-card"><div class="stat-value">32</div><div class="stat-label">Open Deals</div></div>
    <div class="stat-card"><div class="stat-value">$84k</div><div class="stat-label">Pipeline Value</div></div>
    <div class="stat-card"><div class="stat-value">68%</div><div class="stat-label">Win Rate</div></div>
  </div>
  <div class="card mb-6">
    <h2 class="font-semibold mb-4">Recent Activity</h2>
    <div class="space-y-3">
      <div class="flex items-center gap-3 text-sm"><span class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">JD</span><div><p class="font-medium">John Doe — Deal closed</p><p class="text-slate-400 text-xs">2 hours ago · $12,000</p></div></div>
      <div class="flex items-center gap-3 text-sm"><span class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-xs">AS</span><div><p class="font-medium">Alice Smith — New contact added</p><p class="text-slate-400 text-xs">4 hours ago</p></div></div>
      <div class="flex items-center gap-3 text-sm"><span class="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs">MB</span><div><p class="font-medium">Mike Brown — Follow-up scheduled</p><p class="text-slate-400 text-xs">Yesterday</p></div></div>
    </div>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const contactsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Contacts — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">Contacts</h1><button class="btn-primary">+ Add Contact</button></div>
  <div class="card mb-4"><input type="text" placeholder="Search contacts..." oninput="filterContacts(this.value)"/></div>
  <div class="card">
    <table id="contacts-table"><thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>
      <tr><td class="font-medium">John Doe</td><td class="text-slate-400">john@acme.com</td><td>Acme Corp</td><td><span class="badge badge-green">Customer</span></td><td><button class="text-indigo-400 text-xs hover:underline">View</button></td></tr>
      <tr><td class="font-medium">Alice Smith</td><td class="text-slate-400">alice@techco.com</td><td>TechCo</td><td><span class="badge badge-blue">Lead</span></td><td><button class="text-indigo-400 text-xs hover:underline">View</button></td></tr>
      <tr><td class="font-medium">Mike Brown</td><td class="text-slate-400">mike@startup.io</td><td>Startup.io</td><td><span class="badge badge-yellow">Prospect</span></td><td><button class="text-indigo-400 text-xs hover:underline">View</button></td></tr>
      <tr><td class="font-medium">Sarah Lee</td><td class="text-slate-400">sarah@bigco.com</td><td>BigCo</td><td><span class="badge badge-green">Customer</span></td><td><button class="text-indigo-400 text-xs hover:underline">View</button></td></tr>
    </tbody></table>
  </div>
</main>
<script src="../script.js"><\/script>
<script>function filterContacts(q){const rows=document.querySelectorAll('#contacts-table tbody tr');rows.forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q.toLowerCase())?'':'none'})}<\/script>
</body></html>`

  const dealsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Deals — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">Deal Pipeline</h1><button class="btn-primary">+ New Deal</button></div>
  <div class="grid md:grid-cols-4 gap-4">
    <div><h3 class="text-xs font-semibold text-slate-400 uppercase mb-3">Prospecting</h3>
      <div class="space-y-3">
        <div class="card text-sm"><p class="font-medium mb-1">Website Redesign</p><p class="text-slate-400">TechCo · $8,000</p></div>
        <div class="card text-sm"><p class="font-medium mb-1">Mobile App</p><p class="text-slate-400">Startup.io · $15,000</p></div>
      </div>
    </div>
    <div><h3 class="text-xs font-semibold text-slate-400 uppercase mb-3">Qualified</h3>
      <div class="space-y-3">
        <div class="card text-sm border-indigo-500/30"><p class="font-medium mb-1">CRM Integration</p><p class="text-slate-400">Acme Corp · $22,000</p></div>
      </div>
    </div>
    <div><h3 class="text-xs font-semibold text-slate-400 uppercase mb-3">Proposal</h3>
      <div class="space-y-3">
        <div class="card text-sm border-yellow-500/30"><p class="font-medium mb-1">Analytics Platform</p><p class="text-slate-400">BigCo · $45,000</p></div>
      </div>
    </div>
    <div><h3 class="text-xs font-semibold text-slate-400 uppercase mb-3">Closed Won</h3>
      <div class="space-y-3">
        <div class="card text-sm border-green-500/30"><p class="font-medium mb-1">E-commerce Store</p><p class="text-slate-400">RetailCo · $12,000</p></div>
      </div>
    </div>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const reportsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Reports — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <h1 class="text-2xl font-bold mb-8">Reports</h1>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="card"><h2 class="font-semibold mb-4">Revenue by Month</h2>
      <div class="space-y-2">
        ${['Jan','Feb','Mar','Apr','May','Jun'].map((m,i) => `<div class="flex items-center gap-3 text-sm"><span class="w-8 text-slate-400">${m}</span><div class="flex-1 bg-white/5 rounded-full h-2"><div class="bg-indigo-500 h-2 rounded-full" style="width:${[40,55,70,45,80,65][i]}%"></div></div><span class="text-slate-300 w-12 text-right">$${[12,18,24,15,28,22][i]}k</span></div>`).join('')}
      </div>
    </div>
    <div class="card"><h2 class="font-semibold mb-4">Deal Sources</h2>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between items-center"><span>Referral</span><div class="flex items-center gap-2"><div class="w-24 bg-white/5 rounded-full h-2"><div class="bg-green-500 h-2 rounded-full" style="width:45%"></div></div><span class="text-slate-400">45%</span></div></div>
        <div class="flex justify-between items-center"><span>Inbound</span><div class="flex items-center gap-2"><div class="w-24 bg-white/5 rounded-full h-2"><div class="bg-indigo-500 h-2 rounded-full" style="width:30%"></div></div><span class="text-slate-400">30%</span></div></div>
        <div class="flex justify-between items-center"><span>Outbound</span><div class="flex items-center gap-2"><div class="w-24 bg-white/5 rounded-full h-2"><div class="bg-yellow-500 h-2 rounded-full" style="width:25%"></div></div><span class="text-slate-400">25%</span></div></div>
      </div>
    </div>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const settingsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Settings — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <h1 class="text-2xl font-bold mb-8">Settings</h1>
  <div class="card max-w-lg">
    <h2 class="font-semibold mb-4">Organization</h2>
    <form onsubmit="e=>e.preventDefault()" class="space-y-4">
      <div><label class="text-xs text-slate-400 mb-1 block">Organization Name</label><input type="text" value="${brand.fullName}"/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Admin Email</label><input type="email" value="admin@example.com"/></div>
      <button type="button" onclick="showToast('Settings saved!')" class="btn-primary">Save Changes</button>
    </form>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  return {
    files: {
      'pages/dashboard.html': dashboardHtml,
      'pages/contacts.html': contactsHtml,
      'pages/deals.html': dealsHtml,
      'pages/reports.html': reportsHtml,
      'pages/settings.html': settingsHtml,
      'styles.css': sharedCss(),
      'script.js': sharedJs(brand),
    },
    entrypoint: 'pages/dashboard.html',
    description: `${brand.fullName} CRM — dashboard, contacts, deals pipeline, reports, settings`,
  }
}

// ── Dashboard Multi-page Fallback ─────────────────────────────────────────────
export function generateDashboardFallback(brand: Brand): FallbackResult {
  const sidebarLinks = `
  <a href="dashboard.html" class="sidebar-link" data-page="dashboard.html">📊 Overview</a>
  <a href="analytics.html" class="sidebar-link" data-page="analytics.html">📈 Analytics</a>
  <a href="users.html" class="sidebar-link" data-page="users.html">👥 Users</a>
  <a href="reports.html" class="sidebar-link" data-page="reports.html">📋 Reports</a>
  <a href="settings.html" class="sidebar-link" data-page="settings.html">⚙️ Settings</a>`

  const dashboardHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Overview — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <div class="flex items-center justify-between mb-8"><h1 class="text-2xl font-bold">Overview</h1><span class="text-slate-400 text-sm">Last 30 days</span></div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="stat-card"><div class="stat-value">12.4k</div><div class="stat-label">Total Users</div></div>
    <div class="stat-card"><div class="stat-value">$48k</div><div class="stat-label">Revenue</div></div>
    <div class="stat-card"><div class="stat-value">3.2k</div><div class="stat-label">New Signups</div></div>
    <div class="stat-card"><div class="stat-value">94%</div><div class="stat-label">Retention</div></div>
  </div>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="card"><h2 class="font-semibold mb-4">Traffic Overview</h2>
      <div class="space-y-2">
        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => `<div class="flex items-center gap-3 text-xs"><span class="w-8 text-slate-400">${d}</span><div class="flex-1 bg-white/5 rounded-full h-1.5"><div class="bg-indigo-500 h-1.5 rounded-full" style="width:${[60,75,55,80,90,45,30][i]}%"></div></div></div>`).join('')}
      </div>
    </div>
    <div class="card"><h2 class="font-semibold mb-4">Recent Events</h2>
      <div class="space-y-3 text-sm">
        <div class="flex items-center gap-3"><span class="badge badge-green">New</span><span>User signup: alice@example.com</span></div>
        <div class="flex items-center gap-3"><span class="badge badge-blue">Plan</span><span>Upgrade: Pro plan activated</span></div>
        <div class="flex items-center gap-3"><span class="badge badge-yellow">Alert</span><span>High traffic detected</span></div>
      </div>
    </div>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const analyticsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Analytics — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <h1 class="text-2xl font-bold mb-8">Analytics</h1>
  <div class="grid md:grid-cols-3 gap-4 mb-8">
    <div class="stat-card"><div class="stat-value">48.2k</div><div class="stat-label">Page Views</div></div>
    <div class="stat-card"><div class="stat-value">3m 24s</div><div class="stat-label">Avg Session</div></div>
    <div class="stat-card"><div class="stat-value">32%</div><div class="stat-label">Bounce Rate</div></div>
  </div>
  <div class="card"><h2 class="font-semibold mb-4">Top Pages</h2>
    <table><thead><tr><th>Page</th><th>Views</th><th>Avg Time</th><th>Bounce</th></tr></thead>
    <tbody>
      <tr><td>/dashboard</td><td>12,400</td><td>4m 12s</td><td>18%</td></tr>
      <tr><td>/analytics</td><td>8,200</td><td>3m 45s</td><td>22%</td></tr>
      <tr><td>/users</td><td>6,100</td><td>2m 30s</td><td>35%</td></tr>
      <tr><td>/settings</td><td>3,400</td><td>1m 55s</td><td>42%</td></tr>
    </tbody></table>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const usersHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Users — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">Users</h1><button class="btn-primary">+ Invite User</button></div>
  <div class="card mb-4"><input type="text" placeholder="Search users..." oninput="filterTable(this.value,'users-table')"/></div>
  <div class="card">
    <table id="users-table"><thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Joined</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="font-medium">Alice Johnson</td><td class="text-slate-400">alice@example.com</td><td>Pro</td><td class="text-slate-400">Jan 2026</td><td><span class="badge badge-green">Active</span></td></tr>
      <tr><td class="font-medium">Bob Smith</td><td class="text-slate-400">bob@example.com</td><td>Free</td><td class="text-slate-400">Feb 2026</td><td><span class="badge badge-green">Active</span></td></tr>
      <tr><td class="font-medium">Carol White</td><td class="text-slate-400">carol@example.com</td><td>Enterprise</td><td class="text-slate-400">Dec 2025</td><td><span class="badge badge-blue">Trial</span></td></tr>
    </tbody></table>
  </div>
</main>
<script src="../script.js"><\/script>
<script>function filterTable(q,id){document.querySelectorAll('#'+id+' tbody tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q.toLowerCase())?'':'none'})}<\/script>
</body></html>`

  const reportsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Reports — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">Reports</h1><button class="btn-primary">Export CSV</button></div>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="card"><h2 class="font-semibold mb-4">Monthly Summary</h2>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between"><span class="text-slate-400">New Users</span><span class="font-semibold">+3,240</span></div>
        <div class="flex justify-between"><span class="text-slate-400">Revenue</span><span class="font-semibold text-green-400">+$48,200</span></div>
        <div class="flex justify-between"><span class="text-slate-400">Churn Rate</span><span class="font-semibold text-red-400">2.1%</span></div>
        <div class="flex justify-between"><span class="text-slate-400">NPS Score</span><span class="font-semibold">72</span></div>
      </div>
    </div>
    <div class="card"><h2 class="font-semibold mb-4">Available Reports</h2>
      <div class="space-y-2">
        <button onclick="showToast('Downloading...')" class="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm">📊 User Growth Report</button>
        <button onclick="showToast('Downloading...')" class="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm">💰 Revenue Report</button>
        <button onclick="showToast('Downloading...')" class="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm">📈 Engagement Report</button>
      </div>
    </div>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const settingsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Settings — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white">
<aside class="sidebar"><a href="#" class="text-base font-bold text-indigo-400 mb-6 block">${brand.fullName}</a>${sidebarLinks}</aside>
<main class="main-content pt-6">
  <h1 class="text-2xl font-bold mb-8">Settings</h1>
  <div class="card max-w-lg">
    <h2 class="font-semibold mb-4">General</h2>
    <form class="space-y-4">
      <div><label class="text-xs text-slate-400 mb-1 block">App Name</label><input type="text" value="${brand.fullName}"/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Timezone</label><select><option>UTC</option><option>US/Eastern</option><option>US/Pacific</option></select></div>
      <button type="button" onclick="showToast('Settings saved!')" class="btn-primary">Save</button>
    </form>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  return {
    files: {
      'pages/dashboard.html': dashboardHtml,
      'pages/analytics.html': analyticsHtml,
      'pages/users.html': usersHtml,
      'pages/reports.html': reportsHtml,
      'pages/settings.html': settingsHtml,
      'styles.css': sharedCss(),
      'script.js': sharedJs(brand),
    },
    entrypoint: 'pages/dashboard.html',
    description: `${brand.fullName} admin dashboard — overview, analytics, users, reports, settings`,
  }
}
