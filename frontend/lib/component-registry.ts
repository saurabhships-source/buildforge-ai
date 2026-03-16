// AI Component Registry — stores reusable components so agents can
// reference existing components instead of regenerating duplicates.

export interface RegistryComponent {
  id: string
  name: string           // e.g. "Navbar", "PricingCard"
  category: ComponentCategory
  description: string
  tags: string[]
  content: string        // the actual file content
  filename: string       // canonical filename e.g. "components/Navbar.js"
  usageCount: number
  createdAt: string
}

export type ComponentCategory =
  | 'navigation'
  | 'hero'
  | 'pricing'
  | 'dashboard'
  | 'auth'
  | 'forms'
  | 'cards'
  | 'charts'
  | 'tables'
  | 'modals'
  | 'layout'
  | 'misc'

const STORAGE_KEY = 'buildforge_component_registry'

function load(): RegistryComponent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RegistryComponent[]) : []
  } catch { return [] }
}

function save(components: RegistryComponent[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(components)) } catch { /* quota */ }
}

export const componentRegistry = {
  getAll(): RegistryComponent[] {
    return load()
  },

  findByName(name: string): RegistryComponent | undefined {
    return load().find(c => c.name.toLowerCase() === name.toLowerCase())
  },

  findByCategory(category: ComponentCategory): RegistryComponent[] {
    return load().filter(c => c.category === category)
  },

  search(query: string): RegistryComponent[] {
    const q = query.toLowerCase()
    return load().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some(t => t.includes(q))
    )
  },

  register(component: Omit<RegistryComponent, 'id' | 'usageCount' | 'createdAt'>): RegistryComponent {
    const components = load()
    const existing = components.findIndex(c => c.name.toLowerCase() === component.name.toLowerCase())
    const entry: RegistryComponent = {
      ...component,
      id: existing >= 0 ? components[existing].id : `comp-${Date.now()}`,
      usageCount: existing >= 0 ? components[existing].usageCount : 0,
      createdAt: existing >= 0 ? components[existing].createdAt : new Date().toISOString(),
    }
    if (existing >= 0) components[existing] = entry
    else components.push(entry)
    save(components)
    return entry
  },

  incrementUsage(id: string): void {
    const components = load()
    const c = components.find(c => c.id === id)
    if (c) { c.usageCount++; save(components) }
  },

  remove(id: string): void {
    save(load().filter(c => c.id !== id))
  },

  /** Extract components from generated files and auto-register them */
  extractFromFiles(files: Record<string, string>): void {
    for (const [filename, content] of Object.entries(files)) {
      const name = extractComponentName(filename, content)
      if (!name) continue
      const category = inferCategory(name, filename)
      this.register({
        name,
        category,
        description: `Auto-extracted from ${filename}`,
        tags: [category, name.toLowerCase()],
        content,
        filename,
      })
    }
  },

  /** Build a context string for AI prompts listing available components */
  buildContextForAI(): string {
    const components = load()
    if (components.length === 0) return ''
    const lines = ['AVAILABLE COMPONENTS (reuse instead of regenerating):']
    for (const c of components.slice(0, 20)) {
      lines.push(`  - ${c.name} (${c.category}): ${c.filename} — ${c.description}`)
    }
    return lines.join('\n')
  },
}

function extractComponentName(filename: string, content: string): string | null {
  // From filename: components/Navbar.js → Navbar
  const fileMatch = filename.match(/components\/([A-Z][a-zA-Z0-9]+)\.[jt]sx?$/)
  if (fileMatch) return fileMatch[1]
  // From export default function/class
  const exportMatch = content.match(/export\s+default\s+(?:function|class)\s+([A-Z][a-zA-Z0-9]+)/)
  if (exportMatch) return exportMatch[1]
  return null
}

function inferCategory(name: string, filename: string): ComponentCategory {
  const n = name.toLowerCase()
  const f = filename.toLowerCase()
  if (/nav|header|menu|topbar/.test(n + f)) return 'navigation'
  if (/hero|banner|jumbotron/.test(n + f)) return 'hero'
  if (/pric|plan|tier|billing/.test(n + f)) return 'pricing'
  if (/dashboard|admin|panel/.test(n + f)) return 'dashboard'
  if (/auth|login|signup|register/.test(n + f)) return 'auth'
  if (/form|input|field/.test(n + f)) return 'forms'
  if (/card|tile/.test(n + f)) return 'cards'
  if (/chart|graph|plot/.test(n + f)) return 'charts'
  if (/table|grid|list/.test(n + f)) return 'tables'
  if (/modal|dialog|drawer/.test(n + f)) return 'modals'
  if (/layout|container|wrapper/.test(n + f)) return 'layout'
  return 'misc'
}
