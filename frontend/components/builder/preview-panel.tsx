'use client'

import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react'
import { RefreshCw, Monitor, Smartphone, Loader2, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProjectFiles } from '@/lib/builder-types'

/** Debounce a value — prevents iframe thrashing on rapid file changes */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

interface Props {
  files: ProjectFiles
  entryFile: string
  isGenerating: boolean
  onDownloadZip?: () => void
  onAutoFix?: (error: string) => void
}

type ViewMode = 'desktop' | 'mobile'

// Error reporter script injected into every preview iframe
const ERROR_REPORTER = `<script>
window.onerror = function(msg, src, line, col, err) {
  window.parent.postMessage({ type: 'PREVIEW_ERROR', error: (err ? err.message : msg) + (src ? ' (' + src.split('/').pop() + ':' + line + ')' : '') }, '*');
  return false;
};
window.addEventListener('unhandledrejection', function(e) {
  window.parent.postMessage({ type: 'PREVIEW_ERROR', error: 'Unhandled promise: ' + (e.reason?.message || e.reason) }, '*');
});
</script>`
function isReactProject(files: ProjectFiles): boolean {
  return Object.keys(files).some(k => k.endsWith('.tsx') || k.endsWith('.jsx'))
    || Object.values(files).some(v => v.includes('import React') || v.includes("from 'react'") || v.includes('from "react"'))
}

// Detect if the project is React/TSX-based
// Build a self-contained HTML preview for HTML/CSS/JS projects
function buildHtmlPreview(files: ProjectFiles, entryFile: string): string {
  const safeEntry = (typeof files[entryFile] === 'string' && files[entryFile].trim())
    ? entryFile
    : Object.keys(files).find(k => k.endsWith('.html')) ?? Object.keys(files)[0] ?? ''

  const html = typeof files[safeEntry] === 'string' ? files[safeEntry] : ''
  if (!html.trim()) return '<html><body><p style="font-family:sans-serif;padding:2rem;color:#888">Empty file</p></body></html>'

  let result = html
  // Inject error reporter
  result = result.replace('<head>', `<head>${ERROR_REPORTER}`)

  // Inline styles.css
  if (files['styles.css']) {
    result = result.replace(
      /<link[^>]*href=["']styles\.css["'][^>]*>/gi,
      `<style>${files['styles.css']}</style>`
    )
    if (!result.includes('<style>')) {
      result = result.replace('</head>', `<style>${files['styles.css']}</style></head>`)
    }
  }

  // Inline any other CSS files referenced
  for (const [filename, content] of Object.entries(files)) {
    if (filename.endsWith('.css') && filename !== 'styles.css') {
      const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
      result = result.replace(
        new RegExp(`<link[^>]*href=["']${escaped}["'][^>]*>`, 'gi'),
        `<style>${content}</style>`
      )
    }
  }

  // Inline script.js
  if (files['script.js']) {
    result = result.replace(
      /<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi,
      `<script>${files['script.js']}</script>`
    )
  }

  // Inline any other JS files referenced
  for (const [filename, content] of Object.entries(files)) {
    if (filename.endsWith('.js') && filename !== 'script.js' && !filename.includes('node_modules')) {
      const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
      result = result.replace(
        new RegExp(`<script[^>]*src=["']${escaped}["'][^>]*><\\/script>`, 'gi'),
        `<script>${content}</script>`
      )
    }
  }

  return result
}


// Build a React sandbox preview using Babel standalone + importmap
function buildReactPreview(files: ProjectFiles): string {
  // Find the main entry component
  const entryKeys = ['app/page.tsx', 'src/App.tsx', 'App.tsx', 'src/app.tsx', 'app.tsx', 'index.tsx', 'src/index.tsx']
  const entryKey = entryKeys.find(k => files[k]) ?? Object.keys(files).find(k => k.endsWith('.tsx') || k.endsWith('.jsx')) ?? ''
  const entryContent = files[entryKey] ?? ''

  // Collect all component files
  const componentFiles = Object.entries(files).filter(([k]) =>
    (k.endsWith('.tsx') || k.endsWith('.jsx')) && k !== entryKey
  )

  // Get CSS content
  const cssContent = Object.entries(files)
    .filter(([k]) => k.endsWith('.css'))
    .map(([, v]) => v)
    .join('\n')

  // Build a script that registers all components and renders the app
  const componentScripts = componentFiles.map(([filename, content]) => {
    const name = filename.replace(/^.*\//, '').replace(/\.(tsx|jsx)$/, '')
    return `
      // === ${filename} ===
      try {
        const __mod_${name.replace(/[^a-zA-Z0-9_]/g, '_')} = Babel.transform(${JSON.stringify(content)}, {
          presets: ['react'],
          filename: '${filename}',
        }).code;
        eval(__mod_${name.replace(/[^a-zA-Z0-9_]/g, '_')});
      } catch(e) { console.warn('Component ${filename} failed:', e.message); }
    `
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  ${ERROR_REPORTER}
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Make React available globally for components
    window.React = React;
    window.useState = React.useState;
    window.useEffect = React.useEffect;
    window.useRef = React.useRef;
    window.useCallback = React.useCallback;
    window.useMemo = React.useMemo;
  </script>
  <script>
    ${componentScripts}
  </script>
  <script type="text/babel" data-presets="react">
    ${entryContent
      // Remove import statements (they're already loaded)
      .replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
      // Remove export default, keep the component
      .replace(/^export\s+default\s+/m, 'const __AppEntry = ')
      // Remove named exports
      .replace(/^export\s+/gm, '')
    }
    
    const AppToRender = typeof __AppEntry !== 'undefined' ? __AppEntry 
      : typeof App !== 'undefined' ? App 
      : () => React.createElement('div', { style: { padding: '2rem', fontFamily: 'sans-serif' } }, 'Component loaded');
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(AppToRender));
  </script>
</body>
</html>`
}

export const PreviewPanel = memo(function PreviewPanel({ files, entryFile, isGenerating, onDownloadZip, onAutoFix }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [key, setKey] = useState(0)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [isFixing, setIsFixing] = useState(false)

  const hasFiles = Object.keys(files).length > 0
  const isReact = hasFiles && isReactProject(files)

  // Debounce preview HTML — 300ms prevents iframe thrashing during streaming
  const previewHtml = useMemo(() => {
    if (!hasFiles) return ''
    return isReact ? buildReactPreview(files) : buildHtmlPreview(files, entryFile)
  }, [files, entryFile, hasFiles, isReact])

  const debouncedHtml = useDebounced(previewHtml, 300)

  // Update iframe via srcDoc (no full reload)
  useEffect(() => {
    if (iframeRef.current && debouncedHtml) {
      setRuntimeError(null)
      iframeRef.current.srcdoc = debouncedHtml
    }
  }, [debouncedHtml])

  // Listen for runtime errors from the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_ERROR') {
        setRuntimeError(e.data.error as string)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const handleAutoFix = useCallback(() => {
    if (!runtimeError || !onAutoFix) return
    setIsFixing(true)
    onAutoFix(runtimeError)
    setTimeout(() => setIsFixing(false), 3000)
  }, [runtimeError, onAutoFix])

  const handleOpenNewTab = useCallback(() => {
    const blob = new Blob([debouncedHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }, [debouncedHtml])

  const refresh = useCallback(() => { setKey(k => k + 1); setRuntimeError(null) }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden border-b border-border/50">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border/50 bg-card/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Preview</span>
          {isReact && hasFiles && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">React</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasFiles && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] gap-1"
              onClick={handleOpenNewTab}
              title="Open preview in new tab"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
          {onDownloadZip && hasFiles && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] gap-1"
              onClick={onDownloadZip}
              title="Download as ZIP"
            >
              <Download className="h-3 w-3" />
              ZIP
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-6 w-6 p-0', viewMode === 'desktop' && 'bg-muted')}
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-6 w-6 p-0', viewMode === 'mobile' && 'bg-muted')}
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Runtime error banner */}
        {runtimeError && (
          <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border-b border-red-500/20 text-xs text-red-500">
            <span className="flex-1 truncate">⚠ {runtimeError}</span>
            {onAutoFix && (
              <button
                onClick={handleAutoFix}
                disabled={isFixing}
                className="shrink-0 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors font-medium"
              >
                {isFixing ? 'Fixing...' : 'Auto-fix'}
              </button>
            )}
            <button onClick={() => setRuntimeError(null)} className="shrink-0 hover:text-red-400">✕</button>
          </div>
        )}

        {/* Preview content */}
      <div className="flex-1 overflow-hidden bg-muted/20 flex items-start justify-center p-2">
        {isGenerating && !hasFiles ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <p className="text-sm font-medium">Building your app...</p>
            <p className="text-xs text-muted-foreground mt-1">AI is generating your project</p>
          </div>
        ) : !hasFiles ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Monitor className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Preview will appear here</p>
          </div>
        ) : (
          <div
            className={cn(
              'h-full bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-300',
              viewMode === 'mobile' ? 'w-[375px]' : 'w-full'
            )}
          >
            <iframe
              key={key}
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full h-full"
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              title="App Preview"
            />
          </div>
        )}
      </div>
    </div>
  )
})
