'use client'

import { useEffect, useRef, useState } from 'react'
import { Save, FileCode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  filename: string
  content: string
  isDirty: boolean
  isGenerating: boolean
  onEdit: (content: string) => void
  onSave: () => void
}

function getLanguageClass(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    html: 'language-html',
    css: 'language-css',
    js: 'language-javascript',
    ts: 'language-typescript',
    json: 'language-json',
    md: 'language-markdown',
  }
  return map[ext ?? ''] ?? 'language-plaintext'
}

function getFileColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const colors: Record<string, string> = {
    html: 'text-orange-400',
    css: 'text-blue-400',
    js: 'text-yellow-400',
    ts: 'text-blue-500',
    json: 'text-green-400',
  }
  return colors[ext ?? ''] ?? 'text-muted-foreground'
}

export function CodeEditorPanel({ filename, content, isDirty, isGenerating, onEdit, onSave }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [lineCount, setLineCount] = useState(1)

  useEffect(() => {
    setLineCount(content.split('\n').length)
  }, [content])

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty) onSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDirty, onSave])

  // Handle Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newValue = content.slice(0, start) + '  ' + content.slice(end)
      onEdit(newValue)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  if (!filename) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117] text-muted-foreground">
        <div className="text-center">
          <FileCode className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select a file to edit</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-white/10 bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className={cn('h-3.5 w-3.5', getFileColor(filename))} />
          <span className="text-xs text-[#c9d1d9] font-mono">{filename}</span>
          {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Unsaved changes" />}
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-1.5 text-xs text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Generating...</span>
            </div>
          )}
          {isDirty && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-[#c9d1d9] hover:text-white hover:bg-white/10 gap-1"
              onClick={onSave}
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden flex">
        {/* Line numbers */}
        <div className="w-10 shrink-0 bg-[#0d1117] border-r border-white/5 overflow-hidden">
          <div className="pt-3 pb-3">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="text-right pr-2 text-[11px] text-[#484f58] font-mono leading-5 select-none">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => onEdit(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 bg-[#0d1117] text-[#c9d1d9] font-mono text-[13px] leading-5 p-3 resize-none outline-none overflow-auto"
          style={{ tabSize: 2 }}
          placeholder={isGenerating ? 'Generating...' : 'Start editing...'}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 h-6 bg-[#161b22] border-t border-white/10 shrink-0">
        <span className="text-[10px] text-[#484f58] font-mono">{getLanguageClass(filename).replace('language-', '')}</span>
        <span className="text-[10px] text-[#484f58] font-mono">{lineCount} lines · {content.length} chars</span>
      </div>
    </div>
  )
}
