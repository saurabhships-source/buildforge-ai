'use client'

import { useState } from 'react'
import { listTemplates } from '@/lib/templates/template-registry'
import { extractIntent, scoreTemplates } from '@/lib/templates/intent-extractor'
import type { SaaSTemplate } from '@/lib/templates/types'

interface TemplatePanelProps {
  currentPrompt?: string
  onSelectTemplate: (templateId: string, prompt: string) => void
  onClose: () => void
}

const COMPLEXITY_COLOR: Record<string, string> = {
  starter: 'text-green-400',
  standard: 'text-yellow-400',
  advanced: 'text-orange-400',
}

export function TemplatePanel({ currentPrompt, onSelectTemplate, onClose }: TemplatePanelProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SaaSTemplate | null>(null)
  const [customPrompt, setCustomPrompt] = useState(currentPrompt ?? '')

  const templates = listTemplates()

  // Score templates against current prompt if available
  const scored = currentPrompt
    ? (() => {
        const intent = extractIntent(currentPrompt)
        const scores = scoreTemplates(intent)
        return new Map(scores.map(s => [s.templateId, Math.round(s.confidence * 100)]))
      })()
    : new Map<string, number>()

  const filtered = templates.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.some(tag => tag.includes(search.toLowerCase()))
  )

  function handleUse() {
    if (!selected) return
    const prompt = customPrompt.trim() || `Build a ${selected.name}: ${selected.description}`
    onSelectTemplate(selected.id, prompt)
    onClose()
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white/80">SaaS Templates</span>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 text-xs">✕</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Template list */}
        <div className="w-56 border-r border-white/10 flex flex-col">
          <div className="p-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/30 outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(t => {
              const score = scored.get(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`w-full text-left px-3 py-2 hover:bg-white/5 transition-colors ${selected?.id === t.id ? 'bg-white/10' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white/90 truncate">{t.name}</div>
                      <div className={`text-[10px] ${COMPLEXITY_COLOR[t.complexity]}`}>{t.complexity}</div>
                    </div>
                    {score !== undefined && score > 0 && (
                      <span className="text-[10px] text-indigo-400 font-mono">{score}%</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selected.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{selected.name}</div>
                    <div className="text-xs text-white/50">{selected.description}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Modules</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.modules.map(m => (
                      <span key={m} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px]">{m}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Stack</div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {Object.entries(selected.stack).map(([k, v]) => (
                      <div key={k} className="flex gap-1">
                        <span className="text-white/40">{k}:</span>
                        <span className="text-white/80">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-white/5 text-white/50 rounded text-[10px]">{tag}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Estimated files</div>
                  <div className="text-xs text-white/70">~{selected.estimatedFiles} files</div>
                </div>

                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Customize prompt</div>
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder={`Build a ${selected.name}...`}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-white/30 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-3 border-t border-white/10">
                <button
                  onClick={handleUse}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition-colors"
                >
                  Generate with {selected.name} template →
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30 text-xs">
              Select a template to preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
