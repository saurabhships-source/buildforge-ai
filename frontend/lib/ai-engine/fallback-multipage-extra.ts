// Extra multi-page fallbacks: Matrimony, Marketplace, E-commerce full
import type { FallbackResult } from './fallback-generator'
import { generateProjectTitle } from '@/lib/brand-generator'

type Brand = ReturnType<typeof generateProjectTitle>

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
.badge{display:inline-flex;align-items:center;padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.7rem;font-weight:600}
.badge-green{background:rgba(34,197,94,0.15);color:#4ade80}
.badge-blue{background:rgba(99,102,241,0.15);color:#818cf8}
.badge-pink{background:rgba(236,72,153,0.15);color:#f472b6}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:0.75rem 1rem;font-size:0.75rem;color:#64748b;border-bottom:1px solid rgba(255,255,255,0.1)}
td{padding:0.75rem 1rem;font-size:0.875rem;border-bottom:1px solid rgba(255,255,255,0.05)}`
}

function sharedJs(brand: Brand): string {
  return `document.addEventListener('DOMContentLoaded',()=>{
  const path=window.location.pathname.split('/').pop()||'index.html'
  document.querySelectorAll('[data-page]').forEach(el=>{if(el.getAttribute('data-page')===path)el.classList.add('active')})
  document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'})})})
})
function showToast(msg){const t=document.createElement('div');t.className='fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl bg-green-500 text-white';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3000)}`
}

// ── Matrimony Multi-page Fallback ─────────────────────────────────────────────
export function generateMatrimonyFallback(brand: Brand): FallbackResult {
  const navLinks = `
    <a href="../index.html" class="nav-link" data-page="index.html">Home</a>
    <a href="browse.html" class="nav-link" data-page="browse.html">Browse</a>
    <a href="matches.html" class="nav-link" data-page="matches.html">Matches</a>
    <a href="messages.html" class="nav-link" data-page="messages.html">Messages</a>
    <a href="dashboard.html" class="nav-link" data-page="dashboard.html">Dashboard</a>`

  const sharedNavHtml = (current: string) => `<nav class="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between">
    <a href="../index.html" class="text-lg font-bold text-pink-400">${brand.fullName}</a>
    <div class="hidden md:flex gap-6 text-sm">${navLinks}</div>
    <a href="signup.html" class="btn-primary text-sm px-4 py-2">Join Free</a>
  </nav>`

  const indexHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${brand.fullName} — Find Your Perfect Match</title>
<meta name="description" content="${brand.metaDescription}"/>
<script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen">
<nav class="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between">
  <span class="text-lg font-bold text-pink-400">${brand.fullName}</span>
  <div class="hidden md:flex gap-6 text-sm">
    <a href="pages/browse.html" class="nav-link">Browse</a>
    <a href="pages/login.html" class="nav-link">Login</a>
  </div>
  <a href="pages/signup.html" class="btn-primary text-sm px-4 py-2">Join Free</a>
</nav>
<main class="pt-20">
  <section class="max-w-5xl mx-auto px-6 py-24 text-center fade-up">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs mb-8">💕 Trusted by 500,000+ members</div>
    <h1 class="text-6xl font-bold mb-6 leading-tight">${brand.fullName}</h1>
    <p class="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">${brand.tagline}</p>
    <div class="flex gap-4 justify-center flex-wrap">
      <a href="pages/signup.html" class="btn-primary px-8 py-3">Find Your Match</a>
      <a href="pages/browse.html" class="btn-secondary px-8 py-3">Browse Profiles</a>
    </div>
    <div class="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
      <div class="text-center"><p class="text-3xl font-bold text-pink-400">500k+</p><p class="text-slate-400 text-sm mt-1">Members</p></div>
      <div class="text-center"><p class="text-3xl font-bold text-pink-400">50k+</p><p class="text-slate-400 text-sm mt-1">Marriages</p></div>
      <div class="text-center"><p class="text-3xl font-bold text-pink-400">98%</p><p class="text-slate-400 text-sm mt-1">Satisfaction</p></div>
    </div>
  </section>
  <section class="max-w-5xl mx-auto px-6 py-16">
    <h2 class="text-3xl font-bold text-center mb-12">How It Works</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="card text-center"><div class="text-4xl mb-4">📝</div><h3 class="font-semibold mb-2">Create Profile</h3><p class="text-slate-400 text-sm">Share your story, preferences, and what you're looking for in a partner.</p></div>
      <div class="card text-center"><div class="text-4xl mb-4">🔍</div><h3 class="font-semibold mb-2">Browse Matches</h3><p class="text-slate-400 text-sm">Our AI finds compatible profiles based on your preferences and values.</p></div>
      <div class="card text-center"><div class="text-4xl mb-4">💬</div><h3 class="font-semibold mb-2">Connect</h3><p class="text-slate-400 text-sm">Send messages, express interest, and start meaningful conversations.</p></div>
    </div>
  </section>
</main>
<footer class="border-t border-white/10 px-6 py-8 text-center text-slate-500 text-sm">
  <p class="text-pink-400 font-semibold mb-1">${brand.fullName}</p>
  <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
</footer>
<script src="script.js"><\/script></body></html>`

  const signupHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Sign Up — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center px-6 py-12">
<div class="w-full max-w-md">
  <a href="../index.html" class="block text-center text-lg font-bold text-pink-400 mb-8">${brand.fullName}</a>
  <div class="card">
    <h1 class="text-xl font-bold mb-6 text-center">Create Your Profile</h1>
    <form onsubmit="handleSignup(event)" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-400 mb-1 block">First Name</label><input type="text" placeholder="Your name" required/></div>
        <div><label class="text-xs text-slate-400 mb-1 block">Age</label><input type="number" placeholder="25" min="18" max="80" required/></div>
      </div>
      <div><label class="text-xs text-slate-400 mb-1 block">Gender</label><select required><option value="">Select</option><option>Male</option><option>Female</option></select></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Religion</label><select><option>Hindu</option><option>Muslim</option><option>Christian</option><option>Sikh</option><option>Other</option></select></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Location</label><input type="text" placeholder="City, Country" required/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Email</label><input type="email" placeholder="you@example.com" required/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Password</label><input type="password" placeholder="Min 8 characters" required/></div>
      <button type="submit" id="signup-btn" class="btn-primary w-full py-3">Create Account — Free</button>
    </form>
    <p class="text-center text-slate-400 text-sm mt-4">Already a member? <a href="login.html" class="text-pink-400 hover:underline">Sign in</a></p>
  </div>
</div>
<script src="../script.js"><\/script>
<script>function handleSignup(e){e.preventDefault();const btn=document.getElementById('signup-btn');btn.textContent='Creating profile...';btn.disabled=true;setTimeout(()=>{window.location.href='dashboard.html'},1200)}<\/script>
</body></html>`

  const browseHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Browse Profiles — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen">
${sharedNavHtml('browse.html')}
<main class="pt-20 max-w-5xl mx-auto px-6 py-8">
  <div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">Browse Profiles</h1><span class="text-slate-400 text-sm">248 matches found</span></div>
  <div class="card mb-6">
    <div class="grid md:grid-cols-4 gap-3">
      <select><option>Any Age</option><option>18-25</option><option>26-30</option><option>31-35</option><option>36-40</option></select>
      <select><option>Any Religion</option><option>Hindu</option><option>Muslim</option><option>Christian</option></select>
      <select><option>Any Location</option><option>India</option><option>USA</option><option>UK</option><option>Canada</option></select>
      <button class="btn-primary">Search</button>
    </div>
  </div>
  <div class="grid md:grid-cols-3 gap-6">
    ${[
      { name: 'Priya S.', age: 27, loc: 'Mumbai', rel: 'Hindu', prof: 'Software Engineer' },
      { name: 'Ananya R.', age: 25, loc: 'Delhi', rel: 'Hindu', prof: 'Doctor' },
      { name: 'Meera K.', age: 29, loc: 'Bangalore', rel: 'Hindu', prof: 'Architect' },
      { name: 'Rahul M.', age: 30, loc: 'Chennai', rel: 'Hindu', prof: 'MBA' },
      { name: 'Arjun P.', age: 28, loc: 'Hyderabad', rel: 'Hindu', prof: 'Entrepreneur' },
      { name: 'Kavya T.', age: 26, loc: 'Pune', rel: 'Hindu', prof: 'Teacher' },
    ].map(p => `<div class="card text-center">
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 mx-auto mb-3 flex items-center justify-center text-2xl font-bold">${p.name[0]}</div>
      <h3 class="font-semibold">${p.name}, ${p.age}</h3>
      <p class="text-slate-400 text-xs mt-1">${p.loc} · ${p.rel}</p>
      <p class="text-slate-400 text-xs">${p.prof}</p>
      <div class="flex gap-2 mt-4 justify-center">
        <button onclick="showToast('Interest sent!')" class="btn-primary text-xs px-3 py-1.5">💕 Interest</button>
        <button onclick="showToast('Shortlisted!')" class="btn-secondary text-xs px-3 py-1.5">⭐</button>
      </div>
    </div>`).join('')}
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const dashboardHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Dashboard — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen">
${sharedNavHtml('dashboard.html')}
<main class="pt-20 max-w-5xl mx-auto px-6 py-8">
  <h1 class="text-2xl font-bold mb-6">My Dashboard</h1>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="card text-center"><p class="text-2xl font-bold text-pink-400">12</p><p class="text-slate-400 text-xs mt-1">Interests Received</p></div>
    <div class="card text-center"><p class="text-2xl font-bold text-pink-400">5</p><p class="text-slate-400 text-xs mt-1">Matches</p></div>
    <div class="card text-center"><p class="text-2xl font-bold text-pink-400">3</p><p class="text-slate-400 text-xs mt-1">Messages</p></div>
    <div class="card text-center"><p class="text-2xl font-bold text-pink-400">85%</p><p class="text-slate-400 text-xs mt-1">Profile Complete</p></div>
  </div>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="card"><h2 class="font-semibold mb-4">Recent Interests</h2>
      <div class="space-y-3">
        ${['Priya S., 27 — Mumbai','Ananya R., 25 — Delhi','Meera K., 29 — Bangalore'].map(n => `<div class="flex items-center justify-between text-sm"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-xs">${n[0]}</div><span>${n}</span></div><button onclick="showToast('Accepted!')" class="text-pink-400 text-xs hover:underline">Accept</button></div>`).join('')}
      </div>
    </div>
    <div class="card"><h2 class="font-semibold mb-4">Profile Completion</h2>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between"><span class="text-slate-400">Basic Info</span><span class="badge badge-green">Done</span></div>
        <div class="flex justify-between"><span class="text-slate-400">Photo</span><span class="badge badge-pink">Pending</span></div>
        <div class="flex justify-between"><span class="text-slate-400">Preferences</span><span class="badge badge-green">Done</span></div>
        <div class="flex justify-between"><span class="text-slate-400">Horoscope</span><span class="badge badge-pink">Pending</span></div>
      </div>
    </div>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const messagesHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Messages — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen">
${sharedNavHtml('messages.html')}
<main class="pt-20 max-w-5xl mx-auto px-6 py-8">
  <h1 class="text-2xl font-bold mb-6">Messages</h1>
  <div class="grid md:grid-cols-3 gap-6 h-96">
    <div class="card overflow-auto">
      <h2 class="font-semibold mb-4 text-sm">Conversations</h2>
      <div class="space-y-2">
        ${['Priya S.','Ananya R.','Meera K.'].map((n,i) => `<div onclick="openChat('${n}')" class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer ${i===0?'bg-white/10':''}"><div class="w-9 h-9 rounded-full bg-pink-500/20 flex items-center justify-center text-sm font-bold">${n[0]}</div><div><p class="text-sm font-medium">${n}</p><p class="text-xs text-slate-400">Hey, nice to meet you!</p></div></div>`).join('')}
      </div>
    </div>
    <div class="card md:col-span-2 flex flex-col">
      <div class="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
        <div class="w-9 h-9 rounded-full bg-pink-500/20 flex items-center justify-center font-bold">P</div>
        <span class="font-semibold">Priya S.</span>
      </div>
      <div class="flex-1 space-y-3 text-sm overflow-auto mb-4">
        <div class="flex justify-end"><div class="bg-indigo-600 px-3 py-2 rounded-xl max-w-xs">Hi! I saw your profile and would love to connect.</div></div>
        <div class="flex"><div class="bg-white/10 px-3 py-2 rounded-xl max-w-xs">Hello! Thank you for reaching out. I'd love to chat more.</div></div>
      </div>
      <div class="flex gap-2"><input type="text" placeholder="Type a message..." class="flex-1"/><button onclick="showToast('Message sent!')" class="btn-primary px-4">Send</button></div>
    </div>
  </div>
</main>
<script src="../script.js"><\/script>
<script>function openChat(name){document.querySelector('.md\\\\:col-span-2 .font-semibold').textContent=name}<\/script>
</body></html>`

  return {
    files: {
      'index.html': indexHtml,
      'pages/signup.html': signupHtml,
      'pages/login.html': signupHtml.replace('Create Your Profile', 'Sign In').replace('Create Account — Free', 'Sign In').replace('handleSignup', 'handleLogin'),
      'pages/browse.html': browseHtml,
      'pages/dashboard.html': dashboardHtml,
      'pages/messages.html': messagesHtml,
      'styles.css': sharedCss(),
      'script.js': sharedJs(brand),
    },
    entrypoint: 'index.html',
    description: `${brand.fullName} matrimony platform — home, browse, dashboard, messages`,
  }
}

// ── Marketplace Multi-page Fallback ──────────────────────────────────────────
export function generateMarketplaceFallback(brand: Brand): FallbackResult {
  const indexHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${brand.fullName}</title><meta name="description" content="${brand.metaDescription}"/>
<script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen">
<nav class="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between">
  <span class="text-lg font-bold text-indigo-400">${brand.fullName}</span>
  <div class="hidden md:flex gap-6 text-sm">
    <a href="pages/listings.html" class="nav-link">Browse</a>
    <a href="pages/sell.html" class="nav-link">Sell</a>
    <a href="pages/dashboard.html" class="nav-link">Dashboard</a>
  </div>
  <a href="pages/signup.html" class="btn-primary text-sm px-4 py-2">Join Free</a>
</nav>
<main class="pt-20">
  <section class="max-w-5xl mx-auto px-6 py-20 text-center fade-up">
    <h1 class="text-6xl font-bold mb-6">${brand.fullName}</h1>
    <p class="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">${brand.tagline}</p>
    <div class="flex gap-3 max-w-lg mx-auto mb-12">
      <input type="text" placeholder="Search listings..." class="flex-1"/>
      <button class="btn-primary px-6">Search</button>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      ${['Electronics','Fashion','Home & Garden','Vehicles'].map((cat,i) => `<a href="pages/listings.html" class="card text-center hover:border-indigo-500/50"><div class="text-3xl mb-2">${['💻','👗','🏠','🚗'][i]}</div><p class="text-sm font-medium">${cat}</p></a>`).join('')}
    </div>
  </section>
  <section class="max-w-5xl mx-auto px-6 py-12">
    <h2 class="text-2xl font-bold mb-6">Featured Listings</h2>
    <div class="grid md:grid-cols-4 gap-4">
      ${[
        { title: 'MacBook Pro 2024', price: '$1,200', cat: 'Electronics' },
        { title: 'Vintage Leather Jacket', price: '$85', cat: 'Fashion' },
        { title: 'Standing Desk', price: '$320', cat: 'Home' },
        { title: 'iPhone 15 Pro', price: '$750', cat: 'Electronics' },
      ].map(l => `<div class="card"><div class="h-32 bg-white/5 rounded-xl mb-3 flex items-center justify-center text-4xl">📦</div><h3 class="font-medium text-sm mb-1">${l.title}</h3><p class="text-xs text-slate-400 mb-2">${l.cat}</p><div class="flex items-center justify-between"><span class="font-bold text-indigo-400">${l.price}</span><button onclick="showToast('Added to cart!')" class="btn-primary text-xs px-3 py-1">Buy</button></div></div>`).join('')}
    </div>
  </section>
</main>
<footer class="border-t border-white/10 px-6 py-8 text-center text-slate-500 text-sm">
  <p class="text-indigo-400 font-semibold mb-1">${brand.fullName}</p>
  <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
</footer>
<script src="script.js"><\/script></body></html>`

  const listingsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Browse — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen">
<nav class="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between">
  <a href="../index.html" class="text-lg font-bold text-indigo-400">${brand.fullName}</a>
  <div class="hidden md:flex gap-6 text-sm">
    <a href="listings.html" class="nav-link active">Browse</a>
    <a href="sell.html" class="nav-link">Sell</a>
    <a href="dashboard.html" class="nav-link">Dashboard</a>
  </div>
  <a href="signup.html" class="btn-primary text-sm px-4 py-2">Join Free</a>
</nav>
<main class="pt-20 max-w-5xl mx-auto px-6 py-8">
  <div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">All Listings</h1><span class="text-slate-400 text-sm">1,240 items</span></div>
  <div class="grid md:grid-cols-4 gap-6">
    <aside class="card h-fit">
      <h2 class="font-semibold mb-4 text-sm">Filters</h2>
      <div class="space-y-4">
        <div><label class="text-xs text-slate-400 mb-1 block">Category</label><select><option>All</option><option>Electronics</option><option>Fashion</option><option>Home</option></select></div>
        <div><label class="text-xs text-slate-400 mb-1 block">Max Price</label><input type="number" placeholder="$1000"/></div>
        <button class="btn-primary w-full text-sm">Apply</button>
      </div>
    </aside>
    <div class="md:col-span-3 grid md:grid-cols-3 gap-4">
      ${Array.from({length:6},(_,i)=>`<div class="card"><div class="h-28 bg-white/5 rounded-xl mb-3 flex items-center justify-center text-3xl">📦</div><h3 class="font-medium text-sm mb-1">Item ${i+1}</h3><div class="flex items-center justify-between mt-2"><span class="font-bold text-indigo-400">$${(i+1)*50}</span><button onclick="showToast('Added!')" class="btn-primary text-xs px-2 py-1">Buy</button></div></div>`).join('')}
    </div>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  const sellHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Sell — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen">
<nav class="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between">
  <a href="../index.html" class="text-lg font-bold text-indigo-400">${brand.fullName}</a>
  <div class="hidden md:flex gap-6 text-sm">
    <a href="listings.html" class="nav-link">Browse</a>
    <a href="sell.html" class="nav-link active">Sell</a>
    <a href="dashboard.html" class="nav-link">Dashboard</a>
  </div>
</nav>
<main class="pt-20 max-w-lg mx-auto px-6 py-8">
  <h1 class="text-2xl font-bold mb-6">Post a Listing</h1>
  <div class="card">
    <form onsubmit="postListing(event)" class="space-y-4">
      <div><label class="text-xs text-slate-400 mb-1 block">Title</label><input type="text" placeholder="What are you selling?" required/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Category</label><select required><option value="">Select category</option><option>Electronics</option><option>Fashion</option><option>Home & Garden</option><option>Vehicles</option></select></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Price ($)</label><input type="number" placeholder="0.00" required/></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Description</label><textarea rows="4" placeholder="Describe your item..."></textarea></div>
      <div><label class="text-xs text-slate-400 mb-1 block">Condition</label><select><option>New</option><option>Like New</option><option>Good</option><option>Fair</option></select></div>
      <button type="submit" id="post-btn" class="btn-primary w-full py-3">Post Listing</button>
    </form>
  </div>
</main>
<script src="../script.js"><\/script>
<script>function postListing(e){e.preventDefault();const btn=document.getElementById('post-btn');btn.textContent='Posting...';btn.disabled=true;setTimeout(()=>{showToast('Listing posted!');window.location.href='listings.html'},1200)}<\/script>
</body></html>`

  const dashboardHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Dashboard — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-slate-950 text-white min-h-screen">
<nav class="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between">
  <a href="../index.html" class="text-lg font-bold text-indigo-400">${brand.fullName}</a>
  <div class="hidden md:flex gap-6 text-sm">
    <a href="listings.html" class="nav-link">Browse</a>
    <a href="sell.html" class="nav-link">Sell</a>
    <a href="dashboard.html" class="nav-link active">Dashboard</a>
  </div>
</nav>
<main class="pt-20 max-w-5xl mx-auto px-6 py-8">
  <h1 class="text-2xl font-bold mb-6">My Dashboard</h1>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="card text-center"><p class="text-2xl font-bold text-indigo-400">8</p><p class="text-slate-400 text-xs mt-1">Active Listings</p></div>
    <div class="card text-center"><p class="text-2xl font-bold text-indigo-400">$1,240</p><p class="text-slate-400 text-xs mt-1">Total Sales</p></div>
    <div class="card text-center"><p class="text-2xl font-bold text-indigo-400">24</p><p class="text-slate-400 text-xs mt-1">Messages</p></div>
    <div class="card text-center"><p class="text-2xl font-bold text-indigo-400">4.8★</p><p class="text-slate-400 text-xs mt-1">Rating</p></div>
  </div>
  <div class="card"><h2 class="font-semibold mb-4">My Listings</h2>
    <table><thead><tr><th>Item</th><th>Price</th><th>Views</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>
      <tr><td class="font-medium">MacBook Pro</td><td>$1,200</td><td>142</td><td><span class="badge badge-green">Active</span></td><td><button class="text-indigo-400 text-xs hover:underline">Edit</button></td></tr>
      <tr><td class="font-medium">Leather Jacket</td><td>$85</td><td>67</td><td><span class="badge badge-green">Active</span></td><td><button class="text-indigo-400 text-xs hover:underline">Edit</button></td></tr>
    </tbody></table>
  </div>
</main>
<script src="../script.js"><\/script></body></html>`

  return {
    files: {
      'index.html': indexHtml,
      'pages/listings.html': listingsHtml,
      'pages/sell.html': sellHtml,
      'pages/dashboard.html': dashboardHtml,
      'styles.css': sharedCss(),
      'script.js': sharedJs(brand),
    },
    entrypoint: 'index.html',
    description: `${brand.fullName} marketplace — home, listings, sell, dashboard`,
  }
}

// ── E-commerce Full Multi-page Fallback ───────────────────────────────────────
export function generateEcommerceFullFallback(brand: Brand): FallbackResult {
  const indexHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${brand.fullName}</title><meta name="description" content="${brand.metaDescription}"/>
<script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="styles.css"/></head>
<body class="bg-white text-gray-900 min-h-screen">
<nav class="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-50 shadow-sm">
  <span class="text-xl font-bold text-indigo-600">${brand.fullName}</span>
  <div class="flex gap-6 text-sm items-center">
    <a href="pages/products.html" class="hover:text-indigo-600 transition">Products</a>
    <a href="pages/cart.html" class="hover:text-indigo-600 transition">Cart</a>
    <a href="pages/account.html" class="hover:text-indigo-600 transition">Account</a>
  </div>
</nav>
<section class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-24 text-center px-6">
  <h1 class="text-5xl font-bold mb-4">${brand.fullName}</h1>
  <p class="text-xl text-indigo-100 mb-8">${brand.tagline}</p>
  <a href="pages/products.html" class="px-8 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition inline-block shadow-lg">Shop Now</a>
</section>
<section class="max-w-5xl mx-auto px-6 py-16">
  <h2 class="text-2xl font-bold mb-8">Featured Products</h2>
  <div class="grid md:grid-cols-4 gap-6">
    ${[
      { name: 'Premium Headphones', price: 129, emoji: '🎧' },
      { name: 'Smart Watch', price: 249, emoji: '⌚' },
      { name: 'Wireless Speaker', price: 89, emoji: '🔊' },
      { name: 'Laptop Stand', price: 49, emoji: '💻' },
    ].map(p => `<div class="border rounded-2xl overflow-hidden hover:shadow-xl transition"><div class="h-40 bg-gray-50 flex items-center justify-center text-5xl">${p.emoji}</div><div class="p-4"><h3 class="font-semibold text-sm mb-2">${p.name}</h3><div class="flex justify-between items-center"><span class="font-bold text-indigo-600">$${p.price}</span><a href="pages/products.html" class="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500 transition">View</a></div></div></div>`).join('')}
  </div>
</section>
<footer class="border-t px-6 py-8 text-center text-gray-500 text-sm bg-gray-50">
  <p class="font-bold text-gray-900 mb-1">${brand.fullName}</p>
  <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
</footer>
<script src="script.js"><\/script></body></html>`

  const productsHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Products — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-white text-gray-900 min-h-screen">
<nav class="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-50 shadow-sm">
  <a href="../index.html" class="text-xl font-bold text-indigo-600">${brand.fullName}</a>
  <div class="flex gap-6 text-sm items-center">
    <a href="products.html" class="font-semibold text-indigo-600">Products</a>
    <a href="cart.html" class="hover:text-indigo-600">Cart <span id="cart-badge" class="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">0</span></a>
    <a href="account.html" class="hover:text-indigo-600">Account</a>
  </div>
</nav>
<main class="max-w-5xl mx-auto px-6 py-8">
  <div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">All Products</h1>
    <select onchange="sortProducts(this.value)" class="border rounded-lg px-3 py-2 text-sm"><option>Sort: Featured</option><option>Price: Low to High</option><option>Price: High to Low</option></select>
  </div>
  <div class="grid md:grid-cols-4 gap-6" id="products-grid">
    ${[
      { name: 'Premium Headphones', price: 129, emoji: '🎧', cat: 'Electronics' },
      { name: 'Smart Watch', price: 249, emoji: '⌚', cat: 'Electronics' },
      { name: 'Wireless Speaker', price: 89, emoji: '🔊', cat: 'Electronics' },
      { name: 'Laptop Stand', price: 49, emoji: '💻', cat: 'Accessories' },
      { name: 'Mechanical Keyboard', price: 159, emoji: '⌨️', cat: 'Electronics' },
      { name: 'USB-C Hub', price: 39, emoji: '🔌', cat: 'Accessories' },
      { name: 'Webcam HD', price: 79, emoji: '📷', cat: 'Electronics' },
      { name: 'Mouse Pad XL', price: 29, emoji: '🖱️', cat: 'Accessories' },
    ].map(p => `<div class="border rounded-2xl overflow-hidden hover:shadow-xl transition" data-price="${p.price}"><div class="h-40 bg-gray-50 flex items-center justify-center text-5xl">${p.emoji}</div><div class="p-4"><span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${p.cat}</span><h3 class="font-semibold text-sm mt-2 mb-2">${p.name}</h3><div class="flex justify-between items-center"><span class="font-bold text-indigo-600">$${p.price}</span><button onclick="addToCart('${p.name}',${p.price})" class="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500 transition">Add to Cart</button></div></div></div>`).join('')}
  </div>
</main>
<script src="../script.js"><\/script>
<script>
let cart=JSON.parse(localStorage.getItem('cart')||'[]');
document.getElementById('cart-badge').textContent=cart.length;
function addToCart(name,price){cart.push({name,price});localStorage.setItem('cart',JSON.stringify(cart));document.getElementById('cart-badge').textContent=cart.length;showToast(name+' added to cart!')}
function sortProducts(v){const grid=document.getElementById('products-grid');const items=[...grid.children];if(v.includes('Low'))items.sort((a,b)=>+a.dataset.price-+b.dataset.price);else if(v.includes('High'))items.sort((a,b)=>+b.dataset.price-+a.dataset.price);items.forEach(i=>grid.appendChild(i))}
<\/script></body></html>`

  const cartHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Cart — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-white text-gray-900 min-h-screen">
<nav class="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-50 shadow-sm">
  <a href="../index.html" class="text-xl font-bold text-indigo-600">${brand.fullName}</a>
  <div class="flex gap-6 text-sm"><a href="products.html" class="hover:text-indigo-600">Products</a><a href="cart.html" class="font-semibold text-indigo-600">Cart</a><a href="account.html" class="hover:text-indigo-600">Account</a></div>
</nav>
<main class="max-w-3xl mx-auto px-6 py-8">
  <h1 class="text-2xl font-bold mb-6">Your Cart</h1>
  <div id="cart-content"></div>
</main>
<script src="../script.js"><\/script>
<script>
const cart=JSON.parse(localStorage.getItem('cart')||'[]');
const el=document.getElementById('cart-content');
if(!cart.length){el.innerHTML='<div class="text-center py-16 text-gray-400"><p class="text-5xl mb-4">🛒</p><p class="text-lg">Your cart is empty</p><a href=\\"products.html\\" class=\\"inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition\\">Shop Now</a></div>'}
else{const total=cart.reduce((s,i)=>s+i.price,0);el.innerHTML='<div class=\\"border rounded-2xl overflow-hidden mb-6\\"><table class=\\"w-full\\"><thead class=\\"bg-gray-50\\"><tr><th class=\\"text-left p-4 text-sm\\">Item</th><th class=\\"text-right p-4 text-sm\\">Price</th><th class=\\"p-4\\"></th></tr></thead><tbody>'+cart.map((i,idx)=>'<tr class=\\"border-t\\"><td class=\\"p-4 font-medium\\">'+i.name+'</td><td class=\\"p-4 text-right text-indigo-600 font-bold\\">$'+i.price+'</td><td class=\\"p-4 text-center\\"><button onclick=\\"removeItem('+idx+')\\" class=\\"text-red-400 hover:text-red-600 text-xs\\">Remove</button></td></tr>').join('')+'</tbody></table></div><div class=\\"flex justify-between items-center p-4 bg-gray-50 rounded-2xl\\"><div><p class=\\"text-sm text-gray-500\\">Total</p><p class=\\"text-2xl font-bold text-indigo-600\\">$'+total+'</p></div><a href=\\"checkout.html\\" class=\\"px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition\\">Checkout →</a></div>'}
function removeItem(i){cart.splice(i,1);localStorage.setItem('cart',JSON.stringify(cart));location.reload()}
<\/script></body></html>`

  const checkoutHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Checkout — ${brand.fullName}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="../styles.css"/></head>
<body class="bg-white text-gray-900 min-h-screen">
<nav class="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-50 shadow-sm">
  <a href="../index.html" class="text-xl font-bold text-indigo-600">${brand.fullName}</a>
</nav>
<main class="max-w-lg mx-auto px-6 py-8">
  <h1 class="text-2xl font-bold mb-6">Checkout</h1>
  <div class="border rounded-2xl p-6 mb-6">
    <h2 class="font-semibold mb-4">Shipping Information</h2>
    <form onsubmit="placeOrder(event)" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500 mb-1 block">First Name</label><input type="text" class="border rounded-xl px-3 py-2 text-sm w-full" required/></div>
        <div><label class="text-xs text-gray-500 mb-1 block">Last Name</label><input type="text" class="border rounded-xl px-3 py-2 text-sm w-full" required/></div>
      </div>
      <div><label class="text-xs text-gray-500 mb-1 block">Address</label><input type="text" class="border rounded-xl px-3 py-2 text-sm w-full" required/></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500 mb-1 block">City</label><input type="text" class="border rounded-xl px-3 py-2 text-sm w-full" required/></div>
        <div><label class="text-xs text-gray-500 mb-1 block">ZIP</label><input type="text" class="border rounded-xl px-3 py-2 text-sm w-full" required/></div>
      </div>
      <div><label class="text-xs text-gray-500 mb-1 block">Card Number</label><input type="text" placeholder="4242 4242 4242 4242" class="border rounded-xl px-3 py-2 text-sm w-full" required/></div>
      <button type="submit" id="order-btn" class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition">Place Order</button>
    </form>
  </div>
</main>
<script src="../script.js"><\/script>
<script>function placeOrder(e){e.preventDefault();const btn=document.getElementById('order-btn');btn.textContent='Processing...';btn.disabled=true;setTimeout(()=>{localStorage.removeItem('cart');btn.textContent='✓ Order Placed!';btn.style.background='#22c55e'},1500)}<\/script>
</body></html>`

  return {
    files: {
      'index.html': indexHtml,
      'pages/products.html': productsHtml,
      'pages/cart.html': cartHtml,
      'pages/checkout.html': checkoutHtml,
      'styles.css': sharedCss(),
      'script.js': sharedJs(brand),
    },
    entrypoint: 'index.html',
    description: `${brand.fullName} e-commerce store — home, products, cart, checkout`,
  }
}
