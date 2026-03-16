'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Command, Zap, Loader2, X, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { detectCommandType } from '@/lib/services/ai/command'

interface Props {
  files: Record<string, string>
  onFilesUpdate: (updated: Record<string, string>, description: string) => void
  isOpen: boolean
  onClose: () => void
}

const QUICK_COMMANDS = [
  'add dark mode toggle',
  'add login system',
  'add payment page',
  'add admin dashboard',
  'add contact form',
  'make UI more modern',
  'add loading animations',
  'add newsletter signup',
]

const COMMAND_TYPE_COLORS: Record<string, string> = {
  add_auth: 'text-blue-400',
  add_payments: 'text-green-400',
  add_database: 'text-purple-400',
  add_page: 'text-cyan-400',
  add_component: 'text-pink-400',
  change_style: 'text-orange-400',
  fix_bug: 'text-red-400',
  general: 'text-violet-400',
}

export function CommandBar({ files, onFilesUpdate, isOpen, onClose }: Props) {
  const [command, setCommand] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(QUICK_COMMANDS)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!isOpen) return
        onClose()
      }
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleSubmit = useCallback(async (cmd: string) => {
    if (!cmd.trim() || isProcessing) return
    if (Object.keys(files).length === 0) {
      toast.error('Generate a project first')
      return
    }

    setIsProcessing(true)
    const toastId = toast.loading(`Running: "${cmd}"`)

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, files }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      const merged = { ...files, ...data.updatedFiles, ...data.newFiles }
      const changedCount = Object.keys(data.updatedFiles ?? {}).length + Object.keys(data.newFiles ?? {}).length

      if (changedCount > 0) {
        onFilesUpdate(merged, data.description)
        toast.success(data.description ?? `Applied: ${cmd}`, { id: toastId })
      } else {
        toast.warning('No changes were made', { id: toastId })
      }

      setCommand('')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Command failed', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }, [files, isProcessing, onFilesUpdate, onClose])

  if (!isOpen) return null

  const commandType = command.trim() ? detectCommandType(command) : null
  const typeColor = commandType ? COMMAND_TYPE_COLORS[commandType] ?? 'text-violet-400' : ''

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Command className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit(command)
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Type a command... (e.g. add dark mode, add login system)"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          ) : command ? (
            <button onClick={() => setCommand('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Command type hint */}
        {commandType && command.trim() && (
          <div className={`px-4 py-1.5 text-xs border-b border-white/5 ${typeColor}`}>
            {commandType.replace(/_/g, ' ')} detected
          </div>
        )}

        {/* Suggestions */}
        <div className="py-2 max-h-64 overflow-y-auto">
          {command.trim() ? (
            <button
              onClick={() => handleSubmit(command)}
              disabled={isProcessing}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
            >
              <Zap className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm flex-1">{command}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ) : (
            <>
              <p className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Quick Commands</p>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => handleSubmit(s)}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition text-left"
                >
                  <span className="text-xs text-muted-foreground w-4">⚡</span>
                  <span className="text-sm">{s}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>↵ to run · Esc to close</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  )
}
