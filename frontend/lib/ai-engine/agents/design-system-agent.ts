// Design System Generator Agent
// Generates a complete design system: colors, typography, spacing, components

export interface DesignSystemSpec {
  primaryColor: string
  style: 'modern' | 'minimal' | 'corporate' | 'playful' | 'dark'
  fonts: string[]
  projectName: string
}

export function designSystemPrompt(spec: DesignSystemSpec): string {
  const styleGuides: Record<string, string> = {
    modern: 'glassmorphism, gradients, subtle shadows, rounded corners, micro-animations',
    minimal: 'clean whitespace, thin borders, muted colors, simple typography, no decorations',
    corporate: 'professional blues/grays, structured layouts, clear hierarchy, conservative spacing',
    playful: 'bright colors, rounded shapes, fun animations, emoji accents, bold typography',
    dark: 'dark backgrounds, neon accents, high contrast, glow effects, terminal aesthetic',
  }

  return `You are BuildForge DesignSystemAgent — generate a complete design system.

Style: ${spec.style} — ${styleGuides[spec.style] ?? styleGuides.modern}
Primary color: ${spec.primaryColor}
Fonts: ${spec.fonts.join(', ')}

Generate these files:
1. styles/design-system.css — CSS custom properties for the entire design system
2. styles/components.css — Reusable component styles
3. lib/design-tokens.ts — TypeScript design tokens
4. components/ui/design-system.tsx — React component showcase

OUTPUT FORMAT — return ONLY this exact JSON:
{
  "files": {
    "styles/design-system.css": "...",
    "styles/components.css": "...",
    "lib/design-tokens.ts": "...",
    "components/ui/design-system.tsx": "..."
  },
  "description": "Design system generated"
}

The CSS must include:
- --color-primary, --color-secondary, --color-accent, --color-background, --color-surface, --color-text
- --font-sans, --font-mono, --font-display
- --spacing-xs through --spacing-2xl (4px grid)
- --radius-sm through --radius-full
- --shadow-sm through --shadow-2xl
- --transition-fast, --transition-normal, --transition-slow
- Dark mode variants using @media (prefers-color-scheme: dark)
- Tailwind CSS @layer components for reusable classes`
}

export function designSystemUserMessage(spec: DesignSystemSpec): string {
  return `Generate a complete ${spec.style} design system for "${spec.projectName}" using ${spec.primaryColor} as the primary color.

Include all CSS custom properties, TypeScript tokens, and a component showcase.`
}
