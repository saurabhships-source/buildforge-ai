'use client'

import { useState } from 'react'
import { Copy, Check, Twitter, Linkedin, ExternalLink } from 'lucide-react'

interface SharePanelProps {
  deploymentUrl: string
  projectName: string
  onClose?: () => void
}

export function SharePanel({ deploymentUrl, projectName, onClose }: SharePanelProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(deploymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const encoded = encodeURIComponent(deploymentUrl)
  const text = encodeURIComponent(`Just built ${projectName} with @BuildForgeAI — check it out!`)

  const shareLinks = [
    {
      label: 'Twitter / X',
      icon: <Twitter className="w-4 h-4" />,
      href: `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`,
      color: 'hover:bg-sky-600/20 hover:text-sky-400',
    },
    {
      label: 'LinkedIn',
      icon: <Linkedin className="w-4 h-4" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      color: 'hover:bg-blue-600/20 hover:text-blue-400',
    },
    {
      label: 'Reddit',
      icon: <span className="text-sm font-bold">r/</span>,
      href: `https://reddit.com/submit?url=${encoded}&title=${text}`,
      color: 'hover:bg-orange-600/20 hover:text-orange-400',
    },
  ]

  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="text-2xl">🚀</div>
        <h2 className="text-lg font-bold text-white">App Deployed!</h2>
        <p className="text-sm text-gray-400">Your app is live and ready to share</p>
      </div>

      {/* URL */}
      <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
        <a
          href={deploymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-sm text-indigo-400 hover:text-indigo-300 truncate transition"
        >
          {deploymentUrl}
        </a>
        <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white transition" />
        </a>
        <button onClick={copy} className="p-1 hover:text-white transition text-gray-400">
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Share buttons */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Share</p>
        <div className="grid grid-cols-3 gap-2">
          {shareLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 text-gray-400 transition text-xs ${link.color}`}
            >
              {link.icon}
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-gray-400 hover:text-white transition"
        >
          Close
        </button>
      )}
    </div>
  )
}
