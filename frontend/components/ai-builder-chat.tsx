'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { getCommandSuggestions } from '@/lib/services/ai/command'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'pending' | 'done' | 'error'
}

interface AiBuilderChatProps {
  projectId: string
  files: Record<string, string>
  onFilesUpdated: (files: Record<string, string>) => void
}

export function AiBuilderChat({ projectId, files, onFilesUpdated }: AiBuilderChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'What would you like to build or change? Try: "add Stripe payments", "improve UI design", or "add admin dashboard".' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const suggestions = getCommandSuggestions(files)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendCommand = useCallback(async (command: string) => {
    if (!command.trim() || loading) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: command }
    const assistantMsg: Message = { id: `a-${Date.now()}`, role: 'assistant', content: 'Working on it...', status: 'pending' }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/builder/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, files, projectId }),
      })
      const json = await res.json()

      if (json.success) {
        onFilesUpdated(json.data.files)
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: `Done: ${json.data.description}`, status: 'done' }
            : m
        ))
      } else {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: `Error: ${json.error}`, status: 'error' }
            : m
        ))
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: 'Request failed. Please try again.', status: 'error' }
          : m
      ))
    } finally {
      setLoading(false)
    }
  }, [loading, files, projectId, onFilesUpdated])

  return (
    <div className="flex flex-col h-full bg-gray-950 border-l border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-medium text-white">AI Builder</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-200'
            }`}>
              {msg.status === 'pending' && (
                <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              )}
              {msg.status === 'done' && (
                <CheckCircle className="w-3 h-3 text-green-400 inline mr-1" />
              )}
              {msg.status === 'error' && (
                <AlertCircle className="w-3 h-3 text-red-400 inline mr-1" />
              )}
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {!loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {suggestions.slice(0, 3).map(s => (
            <button
              key={s}
              onClick={() => sendCommand(s)}
              className="text-xs px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <form
          onSubmit={e => { e.preventDefault(); sendCommand(input) }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a feature, change design..."
            disabled={loading}
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </form>
      </div>
    </div>
  )
}
