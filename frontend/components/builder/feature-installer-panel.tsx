'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Puzzle, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react'

interface FeatureInstallerPanelProps {
  files: Record<string, string>
  projectName: string
  onFilesUpdate: (files: Record<string, string>, description: string) => void
}

const QUICK_FEATURES = [
  { id: 'authentication', label: '🔐 Auth', desc: 'Login & signup' },
  { id: 'payments', label: '💳 Payments', desc: 'Stripe checkout' },
  { id: 'analytics', label: '📊 Analytics', desc: 'Usage tracking' },
  { id: 'dark-mode', label: '🌙 Dark Mode', desc: 'Theme toggle' },
  { id: 'contact-form', label: '📬 Contact', desc: 'Contact form' },
  { id: 'newsletter', label: '📧 Newsletter', desc: 'Email signup' },
  { id: 'blog', label: '📝 Blog', desc: 'Blog system' },
  { id: 'search', label: '🔍 Search', desc: 'Full-text search' },
  { id: 'admin-dashboard', label: '🛡 Admin', desc: 'Admin panel' },
  { id: 'chat', label: '💬 Chat', desc: 'Live chat' },
  { id: 'maps', label: '🗺 Maps', desc: 'Map integration' },
  { id: 'file-upload', label: '📁 Upload', desc: 'File upload' },
]

export function FeatureInstallerPanel({ files, projectName, onFilesUpdate }: FeatureInstallerPanelProps) {
  const [open, setOpen] = useState(false)
  const [installing, setInstalling] = useState<string | null>(null)
  const [installed, setInstalled] = useState<Set<string>>(new Set())
  const [customCommand, setCustomCommand] = useState('')

  const hasFiles = Object.keys(files).length > 0

  async function install(featureId: string, label: string) {
    if (!hasFiles) { toast.error('Generate a project first'); return }
    setInstalling(featureId)
    try {
      const res = await fetch('/api/install-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId, files, projectName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Install failed')
      onFilesUpdate(data.files, data.description ?? `${label} installed`)
      setInstalled(prev => new Set(prev).add(featureId))
      toast.success(`${label} installed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Install failed')
    } finally {
      setInstalling(null)
    }
  }

  async function handleCustomCommand() {
    if (!customCommand.trim()) return
    if (!hasFiles) { toast.error('Generate a project first'); return }
    setInstalling('custom')
    try {
      const res = await fetch('/api/install-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: customCommand, files, projectName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Command failed')
      if (data.files) {
        onFilesUpdate(data.files, data.description ?? customCommand)
        toast.success(data.description ?? 'Feature installed')
      } else {
        toast.info(data.message ?? 'No changes made')
      }
      setCustomCommand('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Command failed')
    } finally {
      setInstalling(null)
    }
  }

  return (
    <div className="border-t border-border/30">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Puzzle className="h-3 w-3" />
          Feature Installer
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="px-2 pb-2 space-y-2">
          {/* Custom command input */}
          <div className="flex gap-1">
            <input
              value={customCommand}
              onChange={e => setCustomCommand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomCommand()}
              placeholder="add authentication..."
              className="flex-1 px-2 py-1 text-[10px] bg-muted/30 border border-border/30 rounded focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
            />
            <button
              onClick={handleCustomCommand}
              disabled={!customCommand.trim() || installing === 'custom'}
              className="px-2 py-1 text-[10px] bg-primary/20 hover:bg-primary/30 text-primary rounded border border-primary/30 disabled:opacity-40 transition-colors"
            >
              {installing === 'custom' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
            </button>
          </div>

          {/* Quick feature buttons */}
          <div className="grid grid-cols-2 gap-1">
            {QUICK_FEATURES.map(f => {
              const isInstalling = installing === f.id
              const isInstalled = installed.has(f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => install(f.id, f.label)}
                  disabled={!!installing || isInstalled}
                  title={f.desc}
                  className={`flex items-center gap-1 px-2 py-1.5 text-[10px] rounded border transition-colors text-left ${
                    isInstalled
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:opacity-40'
                  }`}
                >
                  {isInstalling ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin shrink-0" />
                  ) : isInstalled ? (
                    <Check className="h-2.5 w-2.5 shrink-0" />
                  ) : null}
                  <span className="truncate">{f.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
