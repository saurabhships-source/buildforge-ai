// Fallback project generator — produces a working project without any AI call.
// Used when AI generation fails, times out, or API keys are missing.
// NOTE: Never inject debug/error text into generated HTML. Log server-side only.

import type { ProjectFiles } from './tool-adapters/base-adapter'
import { generateProjectTitle } from '@/lib/brand-generator'
import { generateSaasFallback, generateCrmFallback, generateDashboardFallback } from './fallback-multipage'
import { generateMatrimonyFallback, generateMarketplaceFallback, generateEcommerceFullFallback } from './fallback-multipage-extra'

export interface FallbackResult {
  files: ProjectFiles
  entrypoint: string
  description: string
}

function isLandingPageOnly(prompt: string): boolean {
  const p = prompt.toLowerCase()
  return /\b(landing page|marketing page|marketing site|portfolio|personal site|coming soon|one.?page|single.?page|static site)\b/.test(p)
}

export function generateFallbackProject(prompt: string, reason = 'AI unavailable'): FallbackResult {
  // Server-side only — never surfaces in generated HTML
  console.warn(`[BuildForge] AI fallback triggered: ${reason}`)

  const brand = generateProjectTitle(prompt)
  const p = prompt.toLowerCase()

  // Full-app fallbacks for complex app types (when not explicitly a landing page)
  if (!isLandingPageOnly(prompt)) {
    if (/saas|platform|software|subscription|startup/.test(p)) return generateSaasFallback(brand)
    if (/crm|customer relation|contact management|lead/.test(p)) return generateCrmFallback(brand)
    if (/dashboard|admin panel|analytics|management system/.test(p)) return generateDashboardFallback(brand)
    if (/matrimon|dating|match|marriage|wedding platform/.test(p)) return generateMatrimonyFallback(brand)
    if (/marketplace|classifieds|listing|directory/.test(p)) return generateMarketplaceFallback(brand)
    if (/shop|store|ecommerce|e-commerce|product|buy|cart/.test(p)) return generateEcommerceFullFallback(brand)
  }

  // Single-page fallbacks
  if (/restaurant|cafe|bistro|food|menu|dining|eatery|pizz|sushi|burger/.test(p))
    return generateRestaurantFallback(brand)
  if (/portfolio|personal site|my work|showcase|freelance/.test(p))
    return generatePortfolioFallback(brand)
  if (/shop|store|ecommerce|e-commerce|product|buy|cart/.test(p))
    return generateEcommerceFallback(brand)
  if (/blog|article|post|writing|newsletter/.test(p))
    return generateBlogFallback(brand)
  if (/gym|fitness|yoga|workout|training/.test(p))
    return generateFitnessFallback(brand)
  if (/agency|creative|design|marketing/.test(p))
    return generateAgencyFallback(brand)
  return generateGenericFallback(brand)
}

function seoHead(brand: ReturnType<typeof generateProjectTitle>): string {
  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brand.fullName}</title>
  <meta name="description" content="${brand.metaDescription}" />
  <meta property="og:title" content="${brand.fullName}" />
  <meta property="og:description" content="${brand.metaDescription}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${brand.fullName}" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="styles.css" />`
}

function generateRestaurantFallback(brand: ReturnType<typeof generateProjectTitle>): FallbackResult {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${seoHead(brand)}
</head>
<body class="bg-stone-950 text-white font-sans">
  <nav id="navbar" class="fixed top-0 w-full z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between">
    <a href="#" class="text-2xl font-bold text-amber-400 tracking-tight">🍽 ${brand.fullName}</a>
    <div class="hidden md:flex gap-8 text-sm text-stone-300">
      <a href="#menu" class="hover:text-amber-400 transition">Menu</a>
      <a href="#about" class="hover:text-amber-400 transition">About</a>
      <a href="#gallery" class="hover:text-amber-400 transition">Gallery</a>
      <a href="#reserve" class="hover:text-amber-400 transition">Reserve</a>
    </div>
    <a href="#reserve" class="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20">Book a Table</a>
    <button id="menu-toggle" class="md:hidden text-white text-2xl">☰</button>
  </nav>
  <div id="mobile-menu" class="hidden fixed top-16 left-0 w-full bg-stone-950/95 backdrop-blur z-40 flex flex-col gap-4 px-6 py-6 text-stone-300 text-sm border-b border-stone-800">
    <a href="#menu" class="hover:text-amber-400 transition">Menu</a>
    <a href="#about" class="hover:text-amber-400 transition">About</a>
    <a href="#gallery" class="hover:text-amber-400 transition">Gallery</a>
    <a href="#reserve" class="hover:text-amber-400 transition">Reserve</a>
  </div>

  <section class="relative h-screen flex items-center justify-center text-center" style="background: linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.75)), url('${brand.heroImage}') center/cover no-repeat fixed;">
    <div class="max-w-3xl px-6 animate-fade-up">
      <p class="text-amber-400 text-sm tracking-[0.3em] uppercase mb-5 font-medium">Fine Dining Experience</p>
      <h1 class="text-6xl md:text-7xl font-bold mb-6 leading-tight">${brand.fullName}</h1>
      <p class="text-xl text-stone-300 mb-10 max-w-xl mx-auto leading-relaxed">${brand.tagline}</p>
      <div class="flex gap-4 justify-center flex-wrap">
        <a href="#reserve" class="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition shadow-xl shadow-amber-500/30 text-sm">Reserve a Table</a>
        <a href="#menu" class="px-8 py-3.5 border border-white/30 hover:bg-white/10 rounded-xl transition text-sm backdrop-blur-sm">View Menu</a>
      </div>
    </div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <div class="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2"><div class="w-1 h-2 bg-white/60 rounded-full"></div></div>
    </div>
  </section>

  <section id="about" class="max-w-5xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
    <div>
      <p class="text-amber-400 text-xs tracking-widest uppercase mb-3 font-semibold">Our Story</p>
      <h2 class="text-4xl font-bold mb-6">Passion on Every Plate</h2>
      <p class="text-stone-400 leading-relaxed mb-4">At ${brand.fullName}, we believe dining is more than a meal — it's an experience. Our chefs source the finest local ingredients to craft dishes that celebrate flavor, tradition, and creativity.</p>
      <p class="text-stone-400 leading-relaxed mb-8">Every dish is prepared with care, every detail considered. From intimate dinners to special celebrations, we create memories that last.</p>
      <div class="grid grid-cols-3 gap-6 text-center">
        <div><p class="text-3xl font-bold text-amber-400">15+</p><p class="text-stone-500 text-sm mt-1">Years of Excellence</p></div>
        <div><p class="text-3xl font-bold text-amber-400">50+</p><p class="text-stone-500 text-sm mt-1">Signature Dishes</p></div>
        <div><p class="text-3xl font-bold text-amber-400">4.9★</p><p class="text-stone-500 text-sm mt-1">Guest Rating</p></div>
      </div>
    </div>
    <div class="relative">
      <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80" alt="Chef preparing food" class="rounded-2xl w-full object-cover h-80 shadow-2xl" />
      <div class="absolute -bottom-4 -left-4 bg-amber-500 text-stone-950 px-5 py-3 rounded-xl font-bold text-sm shadow-lg">Est. 2009</div>
    </div>
  </section>

  <section id="menu" class="bg-stone-900/50 py-24">
    <div class="max-w-5xl mx-auto px-6">
      <p class="text-amber-400 text-xs tracking-widest uppercase mb-3 font-semibold text-center">Culinary Creations</p>
      <h2 class="text-4xl font-bold text-center mb-4">Our Menu</h2>
      <p class="text-stone-400 text-center mb-12">Crafted with the finest ingredients, inspired by tradition</p>
      <div class="flex gap-3 justify-center mb-10 flex-wrap">
        <button onclick="filterMenu('starters',this)" class="menu-tab active-tab px-5 py-2 rounded-full bg-amber-500 text-stone-950 font-semibold text-sm">Starters</button>
        <button onclick="filterMenu('mains',this)" class="menu-tab px-5 py-2 rounded-full border border-stone-700 text-stone-300 hover:border-amber-500 text-sm transition">Mains</button>
        <button onclick="filterMenu('desserts',this)" class="menu-tab px-5 py-2 rounded-full border border-stone-700 text-stone-300 hover:border-amber-500 text-sm transition">Desserts</button>
        <button onclick="filterMenu('drinks',this)" class="menu-tab px-5 py-2 rounded-full border border-stone-700 text-stone-300 hover:border-amber-500 text-sm transition">Drinks</button>
      </div>
      <div class="grid md:grid-cols-2 gap-5" id="menu-items">
        <div class="menu-item starters p-5 rounded-2xl bg-stone-900 border border-stone-800 flex justify-between items-start hover:border-amber-500/40 transition group">
          <div><h3 class="font-semibold mb-1 group-hover:text-amber-400 transition">Bruschetta al Pomodoro</h3><p class="text-stone-400 text-sm">Toasted sourdough, heirloom tomatoes, fresh basil, aged balsamic</p></div>
          <span class="text-amber-400 font-bold ml-4 shrink-0 text-lg">$14</span>
        </div>
        <div class="menu-item starters p-5 rounded-2xl bg-stone-900 border border-stone-800 flex justify-between items-start hover:border-amber-500/40 transition group">
          <div><h3 class="font-semibold mb-1 group-hover:text-amber-400 transition">Burrata &amp; Prosciutto</h3><p class="text-stone-400 text-sm">Creamy burrata, aged prosciutto di Parma, arugula, truffle oil</p></div>
          <span class="text-amber-400 font-bold ml-4 shrink-0 text-lg">$19</span>
        </div>
        <div class="menu-item mains hidden p-5 rounded-2xl bg-stone-900 border border-stone-800 flex justify-between items-start hover:border-amber-500/40 transition group">
          <div><h3 class="font-semibold mb-1 group-hover:text-amber-400 transition">Pan-Seared Salmon</h3><p class="text-stone-400 text-sm">Atlantic salmon, lemon beurre blanc, asparagus, wild rice</p></div>
          <span class="text-amber-400 font-bold ml-4 shrink-0 text-lg">$36</span>
        </div>
        <div class="menu-item mains hidden p-5 rounded-2xl bg-stone-900 border border-stone-800 flex justify-between items-start hover:border-amber-500/40 transition group">
          <div><h3 class="font-semibold mb-1 group-hover:text-amber-400 transition">Dry-Aged Ribeye 300g</h3><p class="text-stone-400 text-sm">28-day dry-aged prime cut, truffle butter, roasted potatoes, red wine jus</p></div>
          <span class="text-amber-400 font-bold ml-4 shrink-0 text-lg">$58</span>
        </div>
        <div class="menu-item desserts hidden p-5 rounded-2xl bg-stone-900 border border-stone-800 flex justify-between items-start hover:border-amber-500/40 transition group">
          <div><h3 class="font-semibold mb-1 group-hover:text-amber-400 transition">Tiramisu Classico</h3><p class="text-stone-400 text-sm">Mascarpone cream, espresso-soaked ladyfingers, Valrhona cocoa</p></div>
          <span class="text-amber-400 font-bold ml-4 shrink-0 text-lg">$14</span>
        </div>
        <div class="menu-item drinks hidden p-5 rounded-2xl bg-stone-900 border border-stone-800 flex justify-between items-start hover:border-amber-500/40 transition group">
          <div><h3 class="font-semibold mb-1 group-hover:text-amber-400 transition">Aperol Spritz</h3><p class="text-stone-400 text-sm">Aperol, Prosecco DOC, soda water, fresh orange</p></div>
          <span class="text-amber-400 font-bold ml-4 shrink-0 text-lg">$16</span>
        </div>
      </div>
    </div>
  </section>

  <section id="gallery" class="max-w-5xl mx-auto px-6 py-24">
    <p class="text-amber-400 text-xs tracking-widest uppercase mb-3 font-semibold text-center">Visual Journey</p>
    <h2 class="text-4xl font-bold text-center mb-12">Gallery</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80" class="rounded-xl w-full h-48 object-cover hover:scale-105 transition duration-300 cursor-pointer" alt="Dish" />
      <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80" class="rounded-xl w-full h-48 object-cover hover:scale-105 transition duration-300 cursor-pointer" alt="Dish" />
      <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" class="rounded-xl w-full h-48 object-cover hover:scale-105 transition duration-300 cursor-pointer" alt="Dish" />
      <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80" class="rounded-xl w-full h-48 object-cover hover:scale-105 transition duration-300 cursor-pointer" alt="Dish" />
      <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80" class="rounded-xl w-full h-48 object-cover hover:scale-105 transition duration-300 cursor-pointer" alt="Dish" />
      <img src="https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80" class="rounded-xl w-full h-48 object-cover hover:scale-105 transition duration-300 cursor-pointer" alt="Dish" />
    </div>
  </section>

  <section id="reserve" class="bg-stone-900/50 py-24">
    <div class="max-w-xl mx-auto px-6">
      <p class="text-amber-400 text-xs tracking-widest uppercase mb-3 font-semibold text-center">Reservations</p>
      <h2 class="text-4xl font-bold text-center mb-4">Book Your Table</h2>
      <p class="text-stone-400 text-center mb-10">Reserve your dining experience at ${brand.fullName}</p>
      <form class="space-y-4" onsubmit="submitReservation(event)">
        <div class="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Your Name" required class="px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 focus:border-amber-500 outline-none text-sm w-full transition" />
          <input type="email" placeholder="Email Address" required class="px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 focus:border-amber-500 outline-none text-sm w-full transition" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <input type="date" required class="px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 focus:border-amber-500 outline-none text-sm w-full transition" />
          <input type="time" required class="px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 focus:border-amber-500 outline-none text-sm w-full transition" />
        </div>
        <select class="px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 focus:border-amber-500 outline-none text-sm w-full transition">
          <option>1 Guest</option><option selected>2 Guests</option><option>3 Guests</option><option>4 Guests</option><option>5–6 Guests</option><option>7+ Guests (call us)</option>
        </select>
        <textarea placeholder="Special requests or dietary requirements..." rows="3" class="px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 focus:border-amber-500 outline-none text-sm w-full transition resize-none"></textarea>
        <button type="submit" id="reserve-btn" class="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/20 text-sm">Confirm Reservation</button>
      </form>
    </div>
  </section>

  <footer class="border-t border-stone-800 px-6 py-12">
    <div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
      <div>
        <p class="text-xl font-bold text-amber-400 mb-3">🍽 ${brand.fullName}</p>
        <p class="text-stone-400 text-sm leading-relaxed">${brand.tagline}</p>
      </div>
      <div>
        <p class="font-semibold mb-3 text-sm">Opening Hours</p>
        <div class="text-stone-400 text-sm space-y-1">
          <p>Tuesday – Friday: 12pm – 10pm</p>
          <p>Saturday – Sunday: 11am – 11pm</p>
          <p class="text-stone-600">Monday: Closed</p>
        </div>
      </div>
      <div>
        <p class="font-semibold mb-3 text-sm">Contact</p>
        <div class="text-stone-400 text-sm space-y-1">
          <p>📍 123 Gourmet Street, City</p>
          <p>📞 +1 (555) 123-4567</p>
          <p>✉️ hello@${brand.name.toLowerCase().replace(/\s/g,'')}.com</p>
        </div>
      </div>
    </div>
    <div class="max-w-5xl mx-auto mt-8 pt-8 border-t border-stone-800 text-center text-stone-600 text-xs">
      <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
    </div>
  </footer>
  <script src="script.js"><\/script>
</body>
</html>`

  const css = `* { box-sizing: border-box; }
@keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
.animate-fade-up { animation: fadeUp 0.8s ease-out; }
#navbar.scrolled { background: rgba(12,10,9,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.08); }
.menu-item { transition: transform 0.2s, box-shadow 0.2s; }
.menu-item:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(245,158,11,0.12); }
.active-tab { background: #f59e0b !important; color: #1c1917 !important; border-color: #f59e0b !important; }`

  const js = `// ${brand.fullName} — Interactive Logic
document.addEventListener('DOMContentLoaded', () => {
  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  // Mobile menu
  const toggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  toggle?.addEventListener('click', () => mobileMenu?.classList.toggle('hidden'));
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.add('hidden')));

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});

function filterMenu(cat, btn) {
  document.querySelectorAll('.menu-item').forEach(el => {
    el.classList.toggle('hidden', !el.classList.contains(cat));
  });
  document.querySelectorAll('.menu-tab').forEach(b => {
    b.className = 'menu-tab px-5 py-2 rounded-full border border-stone-700 text-stone-300 hover:border-amber-500 text-sm transition';
  });
  btn.className = 'menu-tab active-tab px-5 py-2 rounded-full bg-amber-500 text-stone-950 font-semibold text-sm';
}

function submitReservation(e) {
  e.preventDefault();
  const btn = document.getElementById('reserve-btn');
  btn.textContent = '✓ Reservation Confirmed!';
  btn.disabled = true;
  btn.style.cssText = 'background:#22c55e;color:#fff;cursor:default;';
}`

  return { files: { 'index.html': html, 'styles.css': css, 'script.js': js }, entrypoint: 'index.html', description: `${brand.fullName} restaurant website` }
}

function generateFitnessFallback(brand: ReturnType<typeof generateProjectTitle>): FallbackResult {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${seoHead(brand)}
</head>
<body class="bg-gray-950 text-white font-sans">
  <nav class="fixed top-0 w-full z-50 bg-gray-950/90 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
    <a href="#" class="text-xl font-black tracking-tight">💪 ${brand.fullName}</a>
    <div class="hidden md:flex gap-8 text-sm text-gray-400">
      <a href="#programs" class="hover:text-white transition">Programs</a>
      <a href="#trainers" class="hover:text-white transition">Trainers</a>
      <a href="#pricing" class="hover:text-white transition">Pricing</a>
      <a href="#join" class="hover:text-white transition">Join</a>
    </div>
    <a href="#join" class="px-5 py-2 bg-red-600 hover:bg-red-500 font-bold rounded-xl text-sm transition">Start Free Trial</a>
  </nav>
  <section class="relative h-screen flex items-center justify-center text-center" style="background: linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.8)), url('${brand.heroImage}') center/cover no-repeat fixed;">
    <div class="max-w-3xl px-6">
      <p class="text-red-500 text-xs tracking-[0.3em] uppercase mb-4 font-bold">Transform Your Body</p>
      <h1 class="text-6xl md:text-7xl font-black mb-6 leading-none">${brand.fullName}</h1>
      <p class="text-xl text-gray-300 mb-10">${brand.tagline}</p>
      <div class="flex gap-4 justify-center flex-wrap">
        <a href="#join" class="px-8 py-3.5 bg-red-600 hover:bg-red-500 font-bold rounded-xl transition shadow-xl shadow-red-600/30 text-sm">Start Free Trial</a>
        <a href="#programs" class="px-8 py-3.5 border border-white/30 hover:bg-white/10 rounded-xl transition text-sm">View Programs</a>
      </div>
    </div>
  </section>
  <section id="programs" class="max-w-5xl mx-auto px-6 py-24">
    <h2 class="text-4xl font-black text-center mb-12">Training Programs</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/50 transition">
        <div class="text-4xl mb-4">🏋️</div>
        <h3 class="text-xl font-bold mb-2">Strength Training</h3>
        <p class="text-gray-400 text-sm mb-4">Build muscle, increase power, and transform your physique with our proven strength programs.</p>
        <p class="text-red-500 font-bold">5 days/week · All levels</p>
      </div>
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/50 transition">
        <div class="text-4xl mb-4">🏃</div>
        <h3 class="text-xl font-bold mb-2">HIIT Cardio</h3>
        <p class="text-gray-400 text-sm mb-4">High-intensity interval training to burn fat, boost metabolism, and improve endurance.</p>
        <p class="text-red-500 font-bold">3 days/week · Intermediate</p>
      </div>
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/50 transition">
        <div class="text-4xl mb-4">🧘</div>
        <h3 class="text-xl font-bold mb-2">Recovery &amp; Mobility</h3>
        <p class="text-gray-400 text-sm mb-4">Improve flexibility, prevent injury, and optimize recovery with guided mobility sessions.</p>
        <p class="text-red-500 font-bold">Daily · All levels</p>
      </div>
    </div>
  </section>
  <section id="pricing" class="bg-white/5 py-24">
    <div class="max-w-4xl mx-auto px-6">
      <h2 class="text-4xl font-black text-center mb-12">Membership Plans</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl border border-white/10 text-center">
          <h3 class="font-bold mb-2">Starter</h3>
          <p class="text-4xl font-black my-4">$29<span class="text-lg font-normal text-gray-400">/mo</span></p>
          <ul class="text-gray-400 text-sm space-y-2 mb-6 text-left">
            <li>✓ Gym access (off-peak)</li><li>✓ 2 group classes/week</li><li>✓ Locker room access</li>
          </ul>
          <a href="#join" class="block py-2.5 border border-white/20 hover:bg-white/10 rounded-xl text-sm transition">Get Started</a>
        </div>
        <div class="p-6 rounded-2xl border-2 border-red-500 text-center relative">
          <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">Most Popular</span>
          <h3 class="font-bold mb-2">Pro</h3>
          <p class="text-4xl font-black my-4">$59<span class="text-lg font-normal text-gray-400">/mo</span></p>
          <ul class="text-gray-400 text-sm space-y-2 mb-6 text-left">
            <li>✓ Unlimited gym access</li><li>✓ Unlimited group classes</li><li>✓ 1 PT session/month</li><li>✓ Nutrition guidance</li>
          </ul>
          <a href="#join" class="block py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold transition">Get Started</a>
        </div>
        <div class="p-6 rounded-2xl border border-white/10 text-center">
          <h3 class="font-bold mb-2">Elite</h3>
          <p class="text-4xl font-black my-4">$99<span class="text-lg font-normal text-gray-400">/mo</span></p>
          <ul class="text-gray-400 text-sm space-y-2 mb-6 text-left">
            <li>✓ Everything in Pro</li><li>✓ 4 PT sessions/month</li><li>✓ Custom meal plan</li><li>✓ Priority booking</li>
          </ul>
          <a href="#join" class="block py-2.5 border border-white/20 hover:bg-white/10 rounded-xl text-sm transition">Get Started</a>
        </div>
      </div>
    </div>
  </section>
  <section id="join" class="max-w-lg mx-auto px-6 py-24 text-center">
    <h2 class="text-4xl font-black mb-4">Start Your Free Trial</h2>
    <p class="text-gray-400 mb-8">7 days free — no credit card required</p>
    <form onsubmit="joinNow(event)" class="space-y-4">
      <input type="text" placeholder="Full Name" required class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-red-500 outline-none text-sm transition" />
      <input type="email" placeholder="Email Address" required class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-red-500 outline-none text-sm transition" />
      <button type="submit" id="join-btn" class="w-full py-3.5 bg-red-600 hover:bg-red-500 font-bold rounded-xl transition text-sm">Start Free Trial →</button>
    </form>
  </section>
  <footer class="border-t border-white/10 px-6 py-8 text-center text-gray-600 text-sm">
    <p class="text-white font-bold mb-1">💪 ${brand.fullName}</p>
    <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
  </footer>
  <script src="script.js"><\/script>
</body>
</html>`
  const css = `* { box-sizing: border-box; } @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } } section { animation: fadeUp 0.7s ease-out; }`
  const js = `document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', e => { e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }); }); });
function joinNow(e) { e.preventDefault(); const btn = document.getElementById('join-btn'); btn.textContent = '✓ Welcome to ${brand.fullName}!'; btn.disabled = true; btn.style.background = '#22c55e'; }`
  return { files: { 'index.html': html, 'styles.css': css, 'script.js': js }, entrypoint: 'index.html', description: `${brand.fullName} fitness website` }
}

function generateAgencyFallback(brand: ReturnType<typeof generateProjectTitle>): FallbackResult {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${seoHead(brand)}
</head>
<body class="bg-gray-950 text-white font-sans">
  <nav class="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
    <a href="#" class="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">✦ ${brand.fullName}</a>
    <div class="hidden md:flex gap-8 text-sm text-gray-400">
      <a href="#work" class="hover:text-white transition">Work</a>
      <a href="#services" class="hover:text-white transition">Services</a>
      <a href="#about" class="hover:text-white transition">About</a>
      <a href="#contact" class="hover:text-white transition">Contact</a>
    </div>
    <a href="#contact" class="px-5 py-2 bg-violet-600 hover:bg-violet-500 font-semibold rounded-xl text-sm transition">Let's Talk</a>
  </nav>
  <section class="min-h-screen flex items-center justify-center text-center px-6 pt-20" style="background: radial-gradient(ellipse at top, rgba(124,58,237,0.15) 0%, transparent 60%), #030712;">
    <div class="max-w-4xl">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs mb-8 font-medium">✦ Creative Digital Agency</div>
      <h1 class="text-6xl md:text-8xl font-black mb-6 leading-none tracking-tight">${brand.fullName}</h1>
      <p class="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">${brand.tagline}</p>
      <div class="flex gap-4 justify-center flex-wrap">
        <a href="#work" class="px-8 py-3.5 bg-violet-600 hover:bg-violet-500 font-bold rounded-xl transition shadow-xl shadow-violet-600/30 text-sm">View Our Work</a>
        <a href="#contact" class="px-8 py-3.5 border border-white/20 hover:bg-white/5 rounded-xl transition text-sm">Start a Project</a>
      </div>
      <div class="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
        <div><p class="text-3xl font-black text-violet-400">120+</p><p class="text-gray-500 text-xs mt-1">Projects Delivered</p></div>
        <div><p class="text-3xl font-black text-violet-400">98%</p><p class="text-gray-500 text-xs mt-1">Client Satisfaction</p></div>
        <div><p class="text-3xl font-black text-violet-400">8yr</p><p class="text-gray-500 text-xs mt-1">In Business</p></div>
      </div>
    </div>
  </section>
  <section id="services" class="max-w-5xl mx-auto px-6 py-24">
    <h2 class="text-4xl font-black text-center mb-12">What We Do</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition group">
        <div class="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl mb-4 group-hover:bg-violet-500/30 transition">🎨</div>
        <h3 class="font-bold mb-2">Brand Identity</h3>
        <p class="text-gray-400 text-sm">Logo design, visual systems, brand guidelines, and identity packages that make you unforgettable.</p>
      </div>
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition group">
        <div class="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-xl mb-4 group-hover:bg-pink-500/30 transition">💻</div>
        <h3 class="font-bold mb-2">Web Development</h3>
        <p class="text-gray-400 text-sm">High-performance websites and web apps built with modern tech stacks and pixel-perfect design.</p>
      </div>
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition group">
        <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl mb-4 group-hover:bg-blue-500/30 transition">📱</div>
        <h3 class="font-bold mb-2">Digital Marketing</h3>
        <p class="text-gray-400 text-sm">SEO, paid ads, social media strategy, and content marketing that drives real growth.</p>
      </div>
    </div>
  </section>
  <section id="contact" class="bg-white/5 py-24">
    <div class="max-w-xl mx-auto px-6 text-center">
      <h2 class="text-4xl font-black mb-4">Start a Project</h2>
      <p class="text-gray-400 mb-10">Tell us about your vision and we'll make it reality</p>
      <form onsubmit="sendMessage(event)" class="space-y-4 text-left">
        <div class="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Your Name" required class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none text-sm w-full transition" />
          <input type="email" placeholder="Email" required class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none text-sm w-full transition" />
        </div>
        <input type="text" placeholder="Project type (e.g. Website, Brand, App)" class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none text-sm w-full transition" />
        <textarea placeholder="Tell us about your project..." rows="4" class="px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none text-sm w-full transition resize-none"></textarea>
        <button type="submit" id="contact-btn" class="w-full py-3.5 bg-violet-600 hover:bg-violet-500 font-bold rounded-xl transition text-sm">Send Message →</button>
      </form>
    </div>
  </section>
  <footer class="border-t border-white/10 px-6 py-8 text-center text-gray-600 text-sm">
    <p class="text-white font-bold mb-1">✦ ${brand.fullName}</p>
    <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
  </footer>
  <script src="script.js"><\/script>
</body>
</html>`
  const css = `* { box-sizing: border-box; } @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } } section { animation: fadeUp 0.7s ease-out; }`
  const js = `document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', e => { e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }); }); });
function sendMessage(e) { e.preventDefault(); const btn = document.getElementById('contact-btn'); btn.textContent = '✓ Message Sent!'; btn.disabled = true; btn.style.background = '#22c55e'; }`
  return { files: { 'index.html': html, 'styles.css': css, 'script.js': js }, entrypoint: 'index.html', description: `${brand.fullName} agency website` }
}

function generatePortfolioFallback(brand: ReturnType<typeof generateProjectTitle>): FallbackResult {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${seoHead(brand)}
</head>
<body class="bg-gray-950 text-white font-sans">
  <nav class="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
    <span class="font-bold">${brand.fullName}</span>
    <div class="flex gap-6 text-sm text-gray-400">
      <a href="#about" class="hover:text-white transition">About</a>
      <a href="#projects" class="hover:text-white transition">Projects</a>
      <a href="#contact" class="hover:text-white transition">Contact</a>
    </div>
  </nav>
  <section class="min-h-screen flex items-center justify-center text-center px-6 pt-20">
    <div>
      <div class="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 mx-auto mb-8 flex items-center justify-center text-5xl shadow-2xl shadow-violet-500/30">👤</div>
      <h1 class="text-5xl font-bold mb-4">${brand.fullName}</h1>
      <p class="text-xl text-gray-400 mb-8">${brand.tagline}</p>
      <div class="flex gap-4 justify-center flex-wrap">
        <a href="#projects" class="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition">View Work</a>
        <a href="#contact" class="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-xl transition">Contact Me</a>
      </div>
    </div>
  </section>
  <section id="projects" class="max-w-5xl mx-auto px-6 py-24">
    <h2 class="text-3xl font-bold mb-12 text-center">Featured Projects</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-violet-500/50 transition">
        <div class="h-44 bg-gradient-to-br from-violet-900 to-pink-900 flex items-center justify-center text-5xl">🛒</div>
        <div class="p-5"><h3 class="font-semibold mb-2">E-Commerce Platform</h3><p class="text-gray-400 text-sm">Full-stack store with cart, payments, and admin dashboard.</p></div>
      </div>
      <div class="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-violet-500/50 transition">
        <div class="h-44 bg-gradient-to-br from-blue-900 to-cyan-900 flex items-center justify-center text-5xl">🤖</div>
        <div class="p-5"><h3 class="font-semibold mb-2">AI Dashboard</h3><p class="text-gray-400 text-sm">Real-time analytics with AI-powered insights and charts.</p></div>
      </div>
      <div class="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-violet-500/50 transition">
        <div class="h-44 bg-gradient-to-br from-green-900 to-teal-900 flex items-center justify-center text-5xl">📱</div>
        <div class="p-5"><h3 class="font-semibold mb-2">Mobile App</h3><p class="text-gray-400 text-sm">Cross-platform React Native app with 10k+ downloads.</p></div>
      </div>
    </div>
  </section>
  <section id="contact" class="max-w-lg mx-auto px-6 py-24 text-center">
    <h2 class="text-3xl font-bold mb-4">Get In Touch</h2>
    <p class="text-gray-400 mb-8">Available for freelance and full-time opportunities</p>
    <a href="mailto:hello@example.com" class="px-8 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition inline-block">Send Email</a>
  </section>
  <footer class="border-t border-white/10 px-6 py-8 text-center text-gray-600 text-sm">
    <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
  </footer>
  <script src="script.js"><\/script>
</body>
</html>`
  const css = `* { box-sizing: border-box; } @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } } section { animation: fadeUp 0.6s ease-out; }`
  const js = `document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', e => { e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }); }); });`
  return { files: { 'index.html': html, 'styles.css': css, 'script.js': js }, entrypoint: 'index.html', description: `${brand.fullName} portfolio` }
}

function generateEcommerceFallback(brand: ReturnType<typeof generateProjectTitle>): FallbackResult {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${seoHead(brand)}
</head>
<body class="bg-white text-gray-900 font-sans">
  <nav class="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-50 shadow-sm">
    <span class="text-xl font-bold">${brand.fullName}</span>
    <div class="flex gap-6 text-sm items-center">
      <a href="#products" class="hover:text-indigo-600 transition">Products</a>
      <button onclick="toggleCart()" class="relative text-xl">🛒<span id="cart-count" class="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">0</span></button>
    </div>
  </nav>
  <section class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-24 text-center px-6">
    <h1 class="text-5xl font-bold mb-4">${brand.fullName}</h1>
    <p class="text-xl text-indigo-100 mb-8">${brand.tagline}</p>
    <a href="#products" class="px-8 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition inline-block shadow-lg">Shop Now</a>
  </section>
  <section id="products" class="max-w-5xl mx-auto px-6 py-16">
    <h2 class="text-2xl font-bold mb-8">Featured Products</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="border rounded-2xl overflow-hidden hover:shadow-xl transition group"><div class="h-48 bg-gray-100 flex items-center justify-center text-6xl group-hover:bg-indigo-50 transition">🎧</div><div class="p-4"><h3 class="font-semibold mb-1">Premium Headphones</h3><div class="flex justify-between items-center mt-3"><span class="text-indigo-600 font-bold text-lg">$129</span><button onclick="addToCart('Premium Headphones',129)" class="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition font-medium">Add to Cart</button></div></div></div>
      <div class="border rounded-2xl overflow-hidden hover:shadow-xl transition group"><div class="h-48 bg-gray-100 flex items-center justify-center text-6xl group-hover:bg-indigo-50 transition">⌚</div><div class="p-4"><h3 class="font-semibold mb-1">Smart Watch</h3><div class="flex justify-between items-center mt-3"><span class="text-indigo-600 font-bold text-lg">$249</span><button onclick="addToCart('Smart Watch',249)" class="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition font-medium">Add to Cart</button></div></div></div>
      <div class="border rounded-2xl overflow-hidden hover:shadow-xl transition group"><div class="h-48 bg-gray-100 flex items-center justify-center text-6xl group-hover:bg-indigo-50 transition">🔊</div><div class="p-4"><h3 class="font-semibold mb-1">Wireless Speaker</h3><div class="flex justify-between items-center mt-3"><span class="text-indigo-600 font-bold text-lg">$89</span><button onclick="addToCart('Wireless Speaker',89)" class="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition font-medium">Add to Cart</button></div></div></div>
    </div>
  </section>
  <div id="cart-sidebar" class="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 p-6 flex flex-col">
    <div class="flex justify-between items-center mb-6"><h2 class="text-lg font-bold">Your Cart</h2><button onclick="toggleCart()" class="text-gray-400 hover:text-gray-600 text-xl">✕</button></div>
    <div id="cart-items" class="space-y-3 flex-1 overflow-auto text-sm text-gray-700"></div>
    <div class="border-t pt-4 mt-4"><div class="flex justify-between font-bold text-lg mb-4"><span>Total</span><span id="cart-total" class="text-indigo-600">$0</span></div><button class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition">Checkout →</button></div>
  </div>
  <footer class="border-t px-6 py-8 text-center text-gray-500 text-sm bg-gray-50">
    <p class="font-bold text-gray-900 mb-1">${brand.fullName}</p>
    <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
  </footer>
  <script src="script.js"><\/script>
</body>
</html>`
  const css = `* { box-sizing: border-box; } #cart-sidebar.open { transform: translateX(0) !important; }`
  const js = `let cart = [], total = 0;
function addToCart(name, price) {
  cart.push({name, price}); total += price;
  document.getElementById('cart-count').textContent = cart.length;
  document.getElementById('cart-total').textContent = '$' + total;
  document.getElementById('cart-items').innerHTML = cart.map(i => '<div class="flex justify-between py-2 border-b"><span>' + i.name + '</span><span class="font-semibold text-indigo-600">$' + i.price + '</span></div>').join('');
  document.getElementById('cart-sidebar').classList.add('open');
}
function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('open'); }`
  return { files: { 'index.html': html, 'styles.css': css, 'script.js': js }, entrypoint: 'index.html', description: `${brand.fullName} store` }
}

function generateBlogFallback(brand: ReturnType<typeof generateProjectTitle>): FallbackResult {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${seoHead(brand)}
</head>
<body class="bg-gray-50 text-gray-900 font-sans">
  <nav class="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
    <span class="text-xl font-bold">${brand.fullName}</span>
    <div class="flex gap-6 text-sm text-gray-600">
      <a href="#" class="hover:text-gray-900 transition">Home</a>
      <a href="#articles" class="hover:text-gray-900 transition">Articles</a>
      <a href="#" class="hover:text-gray-900 transition">About</a>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-6 py-12">
    <div class="mb-12 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl">
      <span class="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">Featured</span>
      <h1 class="text-3xl font-bold mt-4 mb-3">The Future of Web Development in ${new Date().getFullYear()}</h1>
      <p class="text-blue-100 mb-4 leading-relaxed">Exploring the trends shaping how we build for the web — from AI-assisted coding to edge computing and beyond.</p>
      <div class="flex items-center gap-3 text-sm text-blue-200"><span>${new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}</span><span>·</span><span>5 min read</span></div>
    </div>
    <h2 id="articles" class="text-2xl font-bold mb-6">Latest Articles</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <article class="bg-white rounded-2xl border hover:shadow-lg transition p-6 cursor-pointer group"><div class="h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center text-4xl group-hover:from-blue-50 group-hover:to-indigo-100 transition">📝</div><h2 class="font-bold mb-2 group-hover:text-blue-600 transition">Getting Started with TypeScript</h2><p class="text-gray-500 text-sm mb-3">A practical guide for JavaScript developers making the switch.</p><span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">4 min read</span></article>
      <article class="bg-white rounded-2xl border hover:shadow-lg transition p-6 cursor-pointer group"><div class="h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center text-4xl group-hover:from-blue-50 group-hover:to-indigo-100 transition">🎨</div><h2 class="font-bold mb-2 group-hover:text-blue-600 transition">CSS Grid vs Flexbox</h2><p class="text-gray-500 text-sm mb-3">When to use each layout system and why it matters for your projects.</p><span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">3 min read</span></article>
      <article class="bg-white rounded-2xl border hover:shadow-lg transition p-6 cursor-pointer group"><div class="h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center text-4xl group-hover:from-blue-50 group-hover:to-indigo-100 transition">⚛️</div><h2 class="font-bold mb-2 group-hover:text-blue-600 transition">React Server Components</h2><p class="text-gray-500 text-sm mb-3">Understanding the new paradigm for server-side rendering in React.</p><span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">6 min read</span></article>
      <article class="bg-white rounded-2xl border hover:shadow-lg transition p-6 cursor-pointer group"><div class="h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center text-4xl group-hover:from-blue-50 group-hover:to-indigo-100 transition">🤖</div><h2 class="font-bold mb-2 group-hover:text-blue-600 transition">Building with AI APIs</h2><p class="text-gray-500 text-sm mb-3">Integrating LLMs into your web applications effectively and safely.</p><span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">5 min read</span></article>
    </div>
  </main>
  <footer class="border-t px-6 py-8 text-center text-gray-500 text-sm bg-white">
    <p class="font-bold text-gray-900 mb-1">${brand.fullName}</p>
    <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
  </footer>
  <script src="script.js"><\/script>
</body>
</html>`
  const css = `* { box-sizing: border-box; } @keyframes fadeIn { from { opacity:0; } to { opacity:1; } } main { animation: fadeIn 0.5s ease; }`
  const js = `console.log('${brand.fullName} loaded');`
  return { files: { 'index.html': html, 'styles.css': css, 'script.js': js }, entrypoint: 'index.html', description: `${brand.fullName} blog` }
}

function generateGenericFallback(brand: ReturnType<typeof generateProjectTitle>): FallbackResult {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${seoHead(brand)}
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white font-sans">
  <nav class="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-slate-900/80 backdrop-blur z-50">
    <span class="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">${brand.fullName}</span>
    <div class="flex gap-3">
      <a href="#features" class="px-4 py-1.5 rounded-lg border border-white/20 text-sm hover:bg-white/10 transition">Features</a>
      <a href="#contact" class="px-4 py-1.5 rounded-lg bg-purple-600 text-sm hover:bg-purple-500 transition font-semibold">Get Started</a>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-6 py-24 text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs mb-8 font-medium">✨ ${brand.type}</div>
    <h1 class="text-6xl font-bold mb-6 leading-tight">${brand.fullName}</h1>
    <p class="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">${brand.tagline}</p>
    <div class="flex gap-4 justify-center flex-wrap">
      <a href="#features" class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold transition shadow-xl shadow-purple-600/30">Explore Features</a>
      <a href="#contact" class="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition">Learn More</a>
    </div>
  </main>
  <section id="features" class="max-w-5xl mx-auto px-6 py-16">
    <h2 class="text-3xl font-bold text-center mb-12">Why Choose ${brand.name}</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition"><div class="text-3xl mb-3">⚡</div><h3 class="font-semibold mb-2">Lightning Fast</h3><p class="text-slate-400 text-sm">Optimized for performance from day one. Built to scale with your needs.</p></div>
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition"><div class="text-3xl mb-3">🔒</div><h3 class="font-semibold mb-2">Secure by Default</h3><p class="text-slate-400 text-sm">Enterprise-grade security built in. Your data is always protected.</p></div>
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition"><div class="text-3xl mb-3">🚀</div><h3 class="font-semibold mb-2">Ready to Deploy</h3><p class="text-slate-400 text-sm">One-click deploy to Vercel, Netlify, or any cloud provider.</p></div>
    </div>
  </section>
  <section id="contact" class="max-w-lg mx-auto px-6 py-16 text-center">
    <h2 class="text-3xl font-bold mb-4">Get Started Today</h2>
    <p class="text-slate-400 mb-8">Join thousands of users who trust ${brand.fullName}</p>
    <form onsubmit="subscribe(event)" class="flex gap-3 max-w-sm mx-auto">
      <input type="email" placeholder="Enter your email" required class="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-purple-500 outline-none text-sm transition" />
      <button type="submit" id="sub-btn" class="px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold text-sm transition whitespace-nowrap">Get Started</button>
    </form>
  </section>
  <footer class="border-t border-white/10 px-6 py-8 text-center text-slate-500 text-sm">
    <p class="text-purple-400 font-semibold mb-1">${brand.fullName}</p>
    <p>© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
  </footer>
  <script src="script.js"><\/script>
</body>
</html>`
  const css = `* { box-sizing: border-box; } @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } } main { animation: fadeIn 0.6s ease-out; } button, a { cursor: pointer; }`
  const js = `document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', e => { e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }); }); });
function subscribe(e) { e.preventDefault(); const btn = document.getElementById('sub-btn'); btn.textContent = '✓ Subscribed!'; btn.disabled = true; btn.style.background = '#22c55e'; }`
  return { files: { 'index.html': html, 'styles.css': css, 'script.js': js }, entrypoint: 'index.html', description: `${brand.fullName} website` }
}

// Validate and sanitize a files object — ensures all values are non-empty strings
export function sanitizeFiles(files: unknown): ProjectFiles {
  if (!files || typeof files !== 'object' || Array.isArray(files)) return {}
  const result: ProjectFiles = {}
  for (const [k, v] of Object.entries(files as Record<string, unknown>)) {
    if (typeof k === 'string' && k.trim()) {
      result[k] = typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v ?? '')
    }
  }
  return result
}
