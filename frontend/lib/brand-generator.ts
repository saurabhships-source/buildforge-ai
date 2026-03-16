// Brand name generator — converts raw prompts into realistic business names
// "create a restaurant website" → "Bella Vista Restaurant"

interface BrandResult {
  name: string        // e.g. "Bella Vista"
  fullName: string    // e.g. "Bella Vista Restaurant"
  tagline: string     // e.g. "Fine dining, unforgettable moments"
  type: string        // e.g. "Restaurant"
  heroImage: string   // Unsplash URL relevant to the business type
  metaDescription: string
}

// Curated Unsplash photo IDs by category (stable, high-quality images)
const HERO_IMAGES: Record<string, string> = {
  restaurant:  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80',
  cafe:        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80',
  coffee:      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
  pizza:       'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=80',
  sushi:       'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1600&q=80',
  burger:      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1600&q=80',
  bakery:      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80',
  gym:         'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80',
  fitness:     'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80',
  yoga:        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1600&q=80',
  hotel:       'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80',
  spa:         'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80',
  salon:       'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80',
  agency:      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
  portfolio:   'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1600&q=80',
  tech:        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80',
  saas:        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80',
  ecommerce:   'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80',
  fashion:     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
  real_estate: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80',
  law:         'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80',
  medical:     'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=80',
  education:   'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80',
  music:       'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&q=80',
  photography: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1600&q=80',
  travel:      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80',
  default:     'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
}

// Brand name syllables by style
const PREFIXES = {
  elegant:  ['Bella', 'Nova', 'Aura', 'Lux', 'Vivo', 'Aria', 'Elara', 'Soleil', 'Lumina', 'Vela'],
  strong:   ['Iron', 'Peak', 'Apex', 'Forge', 'Titan', 'Bold', 'Core', 'Edge', 'Crest', 'Vex'],
  modern:   ['Pixel', 'Flux', 'Nexus', 'Zeno', 'Kova', 'Drift', 'Spark', 'Prism', 'Helix', 'Orbit'],
  natural:  ['Oak', 'Sage', 'Fern', 'Cedar', 'Moss', 'River', 'Stone', 'Bloom', 'Grove', 'Dew'],
  creative: ['Craft', 'Studio', 'Atelier', 'Canvas', 'Palette', 'Brush', 'Ink', 'Frame', 'Lens', 'Hue'],
}

const SUFFIXES: Record<string, string[]> = {
  restaurant: ['Bistro', 'Kitchen', 'Table', 'Grill', 'House', 'Garden', 'Terrace', 'Brasserie'],
  cafe:       ['Café', 'Roast', 'Brew', 'Cup', 'Bean', 'Press', 'Grind', 'Blend'],
  coffee:     ['Roast', 'Brew', 'Bean', 'Cup', 'Press', 'Grind', 'Blend', 'Café'],
  gym:        ['Fitness', 'Gym', 'Athletics', 'Performance', 'Training', 'Strength', 'Power'],
  fitness:    ['Fitness', 'Studio', 'Athletics', 'Performance', 'Training', 'Wellness'],
  yoga:       ['Yoga', 'Studio', 'Wellness', 'Flow', 'Balance', 'Mindful'],
  hotel:      ['Hotel', 'Suites', 'Resort', 'Inn', 'Lodge', 'Retreat', 'Residences'],
  spa:        ['Spa', 'Wellness', 'Retreat', 'Sanctuary', 'Serenity', 'Bliss'],
  salon:      ['Salon', 'Studio', 'Beauty', 'Style', 'Cuts', 'Lounge'],
  agency:     ['Agency', 'Studio', 'Creative', 'Digital', 'Labs', 'Works', 'Co'],
  tech:       ['Tech', 'Labs', 'Systems', 'Solutions', 'Digital', 'Software', 'AI'],
  saas:       ['App', 'Platform', 'Cloud', 'Suite', 'Hub', 'Base', 'Flow'],
  ecommerce:  ['Shop', 'Store', 'Market', 'Boutique', 'Co', 'Goods'],
  law:        ['Law', 'Legal', 'Counsel', 'Partners', 'Associates', 'Firm'],
  medical:    ['Health', 'Medical', 'Clinic', 'Care', 'Wellness', 'Practice'],
  education:  ['Academy', 'Institute', 'School', 'Learning', 'Education', 'Campus'],
  default:    ['Co', 'Studio', 'Labs', 'Works', 'Group', 'Hub'],
}

const TAGLINES: Record<string, string[]> = {
  restaurant:  ['Fine dining, unforgettable moments', 'Where every dish tells a story', 'Crafted with passion, served with love', 'Taste the difference'],
  cafe:        ['Your daily ritual, perfected', 'Where good days begin', 'Brewed with care, served with warmth'],
  coffee:      ['From bean to cup, perfected', 'Your perfect cup awaits', 'Roasted fresh, served with love'],
  gym:         ['Forge your best self', 'Where champions are made', 'Push beyond your limits', 'Train hard, live strong'],
  fitness:     ['Transform your body, elevate your life', 'Your fitness journey starts here', 'Move better, live better'],
  yoga:        ['Find your flow, find yourself', 'Balance body and mind', 'Breathe. Move. Transform.'],
  hotel:       ['Your home away from home', 'Luxury redefined', 'Where comfort meets elegance'],
  spa:         ['Restore. Renew. Rejuvenate.', 'Your sanctuary awaits', 'Escape the everyday'],
  agency:      ['We build brands that matter', 'Creative solutions, real results', 'Ideas that move people'],
  tech:        ['Building the future, today', 'Technology that works for you', 'Innovation at every layer'],
  saas:        ['Work smarter, not harder', 'The platform that grows with you', 'Simplify everything'],
  ecommerce:   ['Quality products, delivered fast', 'Shop smarter, live better', 'Everything you need, nothing you don\'t'],
  default:     ['Excellence in everything we do', 'Built for those who demand more', 'Where quality meets innovation'],
}

type BusinessCategory = keyof typeof SUFFIXES

function detectCategory(prompt: string): BusinessCategory {
  const p = prompt.toLowerCase()
  if (/restaurant|bistro|dining|eatery|brasserie/.test(p)) return 'restaurant'
  if (/cafe|coffee shop/.test(p)) return 'cafe'
  if (/coffee|roast|espresso/.test(p)) return 'coffee'
  if (/gym|crossfit|weightlift/.test(p)) return 'gym'
  if (/fitness|workout|training|athletic/.test(p)) return 'fitness'
  if (/yoga|pilates|meditation/.test(p)) return 'yoga'
  if (/hotel|resort|inn|lodge|motel/.test(p)) return 'hotel'
  if (/spa|massage|wellness|beauty/.test(p)) return 'spa'
  if (/salon|barber|hair|nail/.test(p)) return 'salon'
  if (/agency|creative|design|marketing/.test(p)) return 'agency'
  if (/saas|platform|software|app|startup/.test(p)) return 'saas'
  if (/shop|store|ecommerce|boutique/.test(p)) return 'ecommerce'
  if (/law|legal|attorney|lawyer/.test(p)) return 'law'
  if (/medical|clinic|doctor|health/.test(p)) return 'medical'
  if (/school|academy|education|learning/.test(p)) return 'education'
  if (/tech|technology|digital|software/.test(p)) return 'tech'
  return 'default'
}

function detectHeroImageKey(prompt: string): string {
  const p = prompt.toLowerCase()
  const checks: [RegExp, string][] = [
    [/pizza/, 'pizza'],
    [/sushi|japanese/, 'sushi'],
    [/burger/, 'burger'],
    [/bakery|bread|pastry/, 'bakery'],
    [/restaurant|bistro|dining/, 'restaurant'],
    [/cafe|coffee shop/, 'cafe'],
    [/coffee|espresso|roast/, 'coffee'],
    [/yoga|pilates/, 'yoga'],
    [/gym|crossfit/, 'gym'],
    [/fitness|workout/, 'fitness'],
    [/hotel|resort/, 'hotel'],
    [/spa|massage/, 'spa'],
    [/salon|hair|barber/, 'salon'],
    [/photography|photographer/, 'photography'],
    [/music|band|musician/, 'music'],
    [/travel|tourism/, 'travel'],
    [/real estate|property/, 'real_estate'],
    [/law|legal/, 'law'],
    [/medical|clinic|doctor/, 'medical'],
    [/education|school|academy/, 'education'],
    [/fashion|clothing|apparel/, 'fashion'],
    [/ecommerce|shop|store/, 'ecommerce'],
    [/agency|creative|design/, 'agency'],
    [/portfolio|freelance/, 'portfolio'],
    [/saas|platform|software/, 'saas'],
    [/tech|technology/, 'tech'],
  ]
  for (const [re, key] of checks) {
    if (re.test(p)) return key
  }
  return 'default'
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Deterministic pick based on prompt hash (so same prompt = same brand)
function deterministicPick<T>(arr: T[], seed: string): T {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return arr[hash % arr.length]
}

export function generateProjectTitle(prompt: string): BrandResult {
  const category = detectCategory(prompt)
  const imageKey = detectHeroImageKey(prompt)

  // Choose prefix style based on category
  const prefixStyle: keyof typeof PREFIXES =
    ['restaurant', 'cafe', 'coffee', 'hotel', 'spa'].includes(category) ? 'elegant' :
    ['gym', 'fitness'].includes(category) ? 'strong' :
    ['agency', 'tech', 'saas'].includes(category) ? 'modern' :
    'elegant'

  const prefixes = PREFIXES[prefixStyle]
  const suffixList = SUFFIXES[category] ?? SUFFIXES.default
  const taglineList = TAGLINES[category] ?? TAGLINES.default

  const prefix = deterministicPick(prefixes, prompt)
  const suffix = deterministicPick(suffixList, prompt + 'suffix')
  const tagline = deterministicPick(taglineList, prompt + 'tagline')

  const name = prefix
  const fullName = `${prefix} ${suffix}`
  const heroImage = HERO_IMAGES[imageKey] ?? HERO_IMAGES.default

  // Build meta description
  const metaDescription = `${fullName} — ${tagline}. Visit us today and experience the difference.`

  return { name, fullName, tagline, type: suffix, heroImage, metaDescription }
}

// Inject brand into the system prompt context
export function getBrandContext(prompt: string): string {
  const brand = generateProjectTitle(prompt)
  return `
BRAND IDENTITY (use these throughout the entire website):
- Brand Name: "${brand.fullName}"
- Short Name: "${brand.name}"
- Tagline: "${brand.tagline}"
- Hero Image URL: "${brand.heroImage}"
- Meta Description: "${brand.metaDescription}"

CRITICAL RULES:
- Use "${brand.fullName}" as the site title, navbar logo, hero heading, footer name, and <title> tag
- NEVER use the user's raw prompt text as a title or heading
- The hero section background image MUST use: ${brand.heroImage}
- Include full SEO meta tags using the brand name and description
`
}

// Get just the hero image for a given prompt
export function getHeroImage(prompt: string): string {
  const key = detectHeroImageKey(prompt)
  return HERO_IMAGES[key] ?? HERO_IMAGES.default
}
