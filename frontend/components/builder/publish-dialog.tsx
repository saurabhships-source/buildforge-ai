'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Globe, Lock, Share2, Twitter, Linkedin, Copy, Check, X } from 'lucide-react'

interface PublishDialogProps {
  open: boolean
  projectName: string
  projectId: string | null
  onPublish: (isPublic: boolean) => void
  onClose: () => void
}

export function PublishDialog({ open, projectName, projectId, onPublish, onClose }: PublishDialogProps) {
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [published, setPublished] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const shareUrl = projectId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apps/${projectId}` : ''

  function handlePublish() {
    onPublish(visibility === 'public')
    if (visibility === 'public') setPublished(true)
    else onClose()
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Link copied')
    })
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just built "${projectName}" with BuildForge AI ⚡`)}&url=${encodeURIComponent(shareUrl)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`I built "${projectName}" with AI`)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {!published ? (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Publish to Gallery</h2>
                <p className="text-xs text-muted-foreground">Share your creation with the community</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-medium text-foreground">{projectName}</span> is ready to share.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => setVisibility('public')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  visibility === 'public'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <Globe className={`h-5 w-5 ${visibility === 'public' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Public</span>
                <span className="text-[10px] text-muted-foreground text-center">Visible in gallery, can be remixed</span>
              </button>
              <button
                onClick={() => setVisibility('private')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  visibility === 'private'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <Lock className={`h-5 w-5 ${visibility === 'private' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Private</span>
                <span className="text-[10px] text-muted-foreground text-center">Only you can see this project</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePublish}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {visibility === 'public' ? 'Publish to Gallery' : 'Save as Private'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="font-semibold text-base mb-1">Published!</h2>
              <p className="text-xs text-muted-foreground">Your app is live in the gallery</p>
            </div>

            {shareUrl && (
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50 mb-4">
                <span className="flex-1 text-xs text-muted-foreground truncate">{shareUrl}</span>
                <button onClick={copyLink} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center mb-3">Share it</p>
            <div className="flex gap-2 justify-center mb-4">
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg text-xs font-medium transition-colors border border-sky-500/20">
                <Twitter className="h-3.5 w-3.5" /> Twitter
              </a>
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-xs font-medium transition-colors border border-blue-600/20">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </a>
              <a href={redditUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-xs font-medium transition-colors border border-orange-500/20">
                🤖 Reddit
              </a>
            </div>

            <div className="flex gap-2">
              {projectId && (
                <a href={`/apps/${projectId}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium text-center transition-colors border border-primary/20">
                  View in Gallery
                </a>
              )}
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
