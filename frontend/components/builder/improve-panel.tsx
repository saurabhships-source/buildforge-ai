'use client'

import { useState } from 'react'
import { Wand2, Loader2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Props {
  activeFile: string
  fileContent: string
  onFileUpdate: (path: string, content: string) => void
}

const QUICK_IMPROVEMENTS = [
  'make UI more modern and polished',
  'add smooth animations and transitions',
  'improve mobile responsiveness',
  'add dark mode support',
  'improve typography and spacing',
  'add hover effects to buttons',
]

export function ImprovePanel({ activeFile, fileContent, onFileUpdate }: Props) {
  const [instruction, setInstruction] = useState('')
  const [isImproving, setIsImproving] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [isExplaining, setIsExplaining] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const handleImprove = async (inst: string) => {
    if (!fileContent) { toast.error('No file selected'); return }
    setIsImproving(true)
    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'improve', fileContent, filePath: activeFile, instruction: inst }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onFileUpdate(activeFile, data.content)
      toast.success(data.summary ?? 'Improvement applied')
      setInstruction('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Improvement failed')
    } finally {
      setIsImproving(false)
    }
  }

  const handleExplain = async () => {
    if (!fileContent) { toast.error('No file selected'); return }
    setIsExplaining(true)
    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'explain', fileContent, filePath: activeFile }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExplanation(data.explanation)
      setShowExplanation(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Explanation failed')
    } finally {
      setIsExplaining(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">AI Improve</span>
        {activeFile && <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-auto truncate max-w-[120px]">{activeFile}</Badge>}
      </div>

      {/* Quick improvements */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_IMPROVEMENTS.map(q => (
          <button
            key={q}
            onClick={() => handleImprove(q)}
            disabled={isImproving}
            className="px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] transition disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Custom instruction */}
      <div className="space-y-2">
        <Textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder="Describe what to improve..."
          className="text-xs resize-none h-16 bg-muted/30"
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleImprove(instruction) }}
        />
        <Button
          size="sm"
          className="w-full h-7 text-xs gap-1.5"
          onClick={() => handleImprove(instruction)}
          disabled={isImproving || !instruction.trim()}
        >
          {isImproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
          {isImproving ? 'Improving...' : 'Improve with AI'}
        </Button>
      </div>

      {/* Explain code */}
      <div className="border-t border-border/30 pt-3 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs gap-1.5"
          onClick={handleExplain}
          disabled={isExplaining || !fileContent}
        >
          {isExplaining ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
          {isExplaining ? 'Explaining...' : 'Explain Code'}
        </Button>

        {explanation && (
          <div className="rounded-lg bg-muted/30 border border-border/30">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium"
              onClick={() => setShowExplanation(v => !v)}
            >
              <span className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3" />Explanation</span>
              {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showExplanation && (
              <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">{explanation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
