// Feature 10 — AI UI Designer
// Transforms UI based on natural language design instructions

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import type { ModelId } from '@/lib/ai-engine/model-router'

export interface UIDesignResult {
  files: Record<string, string>
  changes: string[]
  designTokens: {
    primaryColor: string
    fontFamily: string
    borderRadius: string
    style: string
  }
}

const UI_DESIGNER_SYSTEM = `You are an expert UI/UX designer and Tailwind CSS engineer.
Transform the provided HTML/CSS files based on the design instruction.

Return JSON:
{
  "files": { "filename": "complete updated content" },
  "changes": ["list of visual changes made"],
  "designTokens": {
    "primaryColor": "hex color",
    "fontFamily": "font name",
    "borderRadius": "rounded-xl",
    "style": "modern|minimal|bold|elegant|playful"
  }
}

Design principles:
- Use Tailwind CSS utility classes
- Apply consistent spacing (8px grid)
- Ensure WCAG AA color contrast
- Add smooth transitions and hover states
- Use modern typography (Inter, Geist, or system fonts via CDN)
- No markdown fences in response`

const STYLE_PRESETS: Record<string, string> = {
  modern: 'Clean, minimal, lots of whitespace, subtle shadows, rounded corners, gradient accents',
  bold: 'Strong typography, high contrast, vivid colors, large CTAs, impactful layout',
  elegant: 'Serif fonts, muted palette, refined spacing, luxury feel, subtle animations',
  minimal: 'Ultra-clean, monochrome, maximum whitespace, no decorations',
  playful: 'Bright colors, rounded shapes, fun animations, friendly typography',
  dark: 'Dark background, neon accents, glassmorphism, glow effects',
  corporate: 'Professional blues, clean grid, conservative typography, trust signals',
}

export async function designUI(
  files: Record<string, string>,
  instruction: string,
  modelId: ModelId = 'gemini_flash',
): Promise<UIDesignResult> {
  // Detect style preset from instruction
  const preset = Object.keys(STYLE_PRESETS).find(k => instruction.toLowerCase().includes(k))
  const styleContext = preset ? `\nStyle guide: ${STYLE_PRESETS[preset]}` : ''

  const filesContext = Object.entries(files)
    .map(([k, v]) => `=== ${k} ===\n${v.slice(0, 3000)}`)
    .join('\n\n')

  const prompt = `Design instruction: "${instruction}"${styleContext}

Files to redesign:
${filesContext}

Apply the design transformation. Return complete updated files.`

  try {
    const { text } = await generateText({
      model: getModel(modelId),
      system: UI_DESIGNER_SYSTEM,
      prompt,
      maxOutputTokens: 10000,
    })

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned) as UIDesignResult
    return {
      files: result.files ?? {},
      changes: result.changes ?? [instruction],
      designTokens: result.designTokens ?? {
        primaryColor: '#6366f1',
        fontFamily: 'Inter',
        borderRadius: 'rounded-xl',
        style: preset ?? 'modern',
      },
    }
  } catch (err) {
    console.warn('[ui-designer] AI failed:', err)
    return {
      files: {},
      changes: [],
      designTokens: { primaryColor: '#6366f1', fontFamily: 'Inter', borderRadius: 'rounded-xl', style: 'modern' },
    }
  }
}
