'use client'

import { useState } from 'react'
import { Palette, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  files: Record<string, string>
  onFilesUpdate: (files: Record<string, string>, description: string) => void
}

const DESIGN_PRESETS = [
  { label: 'Modern', instruction: 'make UI modern with clean whitespace and subtle shadows' },
  { label: 'Bold', instruction: 'make UI bold with strong typography and vivid colors' },
  { label: 'Minimal', instruction: 'make UI ultra-minimal with maximum whitespace' },
  { label: 'Dark', instruction: 'apply dark theme with neon accents and glassmorphism' },
  { label: 'Elegant', instruction: 'make UI elegant with refined typography and muted palette' },
  { label: 'Playful', instruction: 'make UI playful with bright colors and rounded shapes' },
]

export function UIDesignerPanel({ files, onFilesUpdate }: Props) {
  const [instruction, setInstruction] = useState('')
  const [isDesigning, setIsDesigning] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [lastTokens, setLastTokens] = useState<{ primaryColor: string; style: string } | null>(null)

  const handleDesign = async (inst: string) => {
    if (!inst.trim()) return
    if (Object.keys(files).length === 0) { toast.error('Generate a project first'); return }

    setIsDesigning(true)
    const toastId = toast.loading('Redesigning UI...')
    try {
      const res = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, instruction: inst }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const updatedFiles = { ...files, ...data.files }
      onFilesUpdate(updatedFiles, `UI redesigned: ${inst}`)
      setLastTokens(data.designTokens)
      toast.success(`UI updated — ${data.changes?.length ?? 0} changes`, { id: toastId })
      setInstruction('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Design failed', { id: toastId })
    } finally {
      setIsDesigning(false)
    }
  }

  return (
    <div className="border-t border-border/30">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Palette className="h-3 w-3" />
          AI UI Designer
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-2 pb-2 space-y-2">
          {lastTokens && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30 border border-border/30">
              <div className="h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: lastTokens.primaryColor }} />
              <span className="text-[10px] text-muted-foreground capitalize">{lastTokens.style} style applied</span>
            </div>
          )}

          {/* Style presets */}
          <div className="flex flex-wrap gap-1">
            {DESIGN_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => handleDesign(p.instruction)}
                disabled={isDesigning}
                className="px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] transition disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom instruction */}
          <div className="flex gap-1.5">
            <input
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleDesign(instruction) }}
              placeholder="Describe design changes..."
              className="flex-1 px-2 py-1.5 text-[10px] rounded-lg bg-muted/30 border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <Button
              size="sm"
              className="h-7 px-2 text-[10px] gap-1 shrink-0"
              onClick={() => handleDesign(instruction)}
              disabled={isDesigning || !instruction.trim()}
            >
              {isDesigning ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
