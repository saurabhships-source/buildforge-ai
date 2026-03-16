'use client'

import { useState, useRef } from 'react'
import {
  FileCode, FileText, ChevronRight, ChevronDown, History, RotateCcw,
  Clock, Plus, Trash2, Pencil, Check, X, FolderPlus,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProjectFiles, Version } from '@/lib/builder-types'

interface FileNode {
  name: string
  path: string
  isDir: boolean
  children?: FileNode[]
}

function buildTree(files: ProjectFiles): FileNode[] {
  const root: FileNode[] = []
  const dirs: Record<string, FileNode> = {}
  for (const path of Object.keys(files).sort()) {
    const parts = path.split('/')
    if (parts.length === 1) {
      root.push({ name: path, path, isDir: false })
    } else {
      const dirName = parts[0]
      if (!dirs[dirName]) {
        const dir: FileNode = { name: dirName, path: dirName, isDir: true, children: [] }
        dirs[dirName] = dir
        root.push(dir)
      }
      dirs[dirName].children!.push({ name: parts.slice(1).join('/'), path, isDir: false })
    }
  }
  return root
}

function getFileColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const colors: Record<string, string> = {
    html: 'text-orange-500', css: 'text-blue-500', js: 'text-yellow-500',
    ts: 'text-blue-600', tsx: 'text-cyan-500', jsx: 'text-cyan-400',
    json: 'text-green-500', md: 'text-gray-400', sql: 'text-purple-400',
    prisma: 'text-indigo-400',
  }
  return colors[ext ?? ''] ?? 'text-muted-foreground'
}

interface Props {
  files: ProjectFiles
  activeFile: string
  dirtyFiles: Set<string>
  versions: Version[]
  onFileSelect: (path: string) => void
  onRestoreVersion: (versionId: string) => void
  onCreateFile?: (path: string, content?: string) => void
  onDeleteFile?: (path: string) => void
  onRenameFile?: (oldPath: string, newPath: string) => void
}

export function FileTreePanel({
  files, activeFile, dirtyFiles, versions,
  onFileSelect, onRestoreVersion, onCreateFile, onDeleteFile, onRenameFile,
}: Props) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [showVersions, setShowVersions] = useState(false)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [showNewFile, setShowNewFile] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const newFileInputRef = useRef<HTMLInputElement>(null)

  const tree = buildTree(files)
  const hasFiles = Object.keys(files).length > 0

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const n = new Set(prev)
      n.has(path) ? n.delete(path) : n.add(path)
      return n
    })
  }

  const startRename = (path: string) => {
    setRenamingPath(path)
    setRenameValue(path.split('/').pop() ?? path)
    setTimeout(() => renameInputRef.current?.select(), 50)
  }

  const commitRename = (oldPath: string) => {
    if (!renameValue.trim() || renameValue === oldPath.split('/').pop()) {
      setRenamingPath(null)
      return
    }
    const parts = oldPath.split('/')
    parts[parts.length - 1] = renameValue.trim()
    const newPath = parts.join('/')
    onRenameFile?.(oldPath, newPath)
    setRenamingPath(null)
  }

  const commitNewFile = () => {
    if (!newFileName.trim()) { setShowNewFile(false); return }
    onCreateFile?.(newFileName.trim(), '')
    setNewFileName('')
    setShowNewFile(false)
  }

  const renderNode = (node: FileNode, depth = 0) => {
    if (node.isDir) {
      const expanded = expandedDirs.has(node.path)
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleDir(node.path)}
            className="flex items-center gap-1.5 w-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
            style={{ paddingLeft: `${8 + depth * 12}px` }}
          >
            {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
            <span className="font-medium">{node.name}/</span>
          </button>
          {expanded && node.children?.map(child => renderNode(child, depth + 1))}
        </div>
      )
    }

    const isDirty = dirtyFiles.has(node.path)
    const isActive = activeFile === node.path
    const isRenaming = renamingPath === node.path

    return (
      <div
        key={node.path}
        className={cn(
          'group flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded transition-colors',
          isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <FileCode className={cn('h-3 w-3 shrink-0', getFileColor(node.name))} />
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename(node.path)
              if (e.key === 'Escape') setRenamingPath(null)
            }}
            onBlur={() => commitRename(node.path)}
            className="flex-1 bg-background border border-primary/50 rounded px-1 text-xs outline-none"
            autoFocus
          />
        ) : (
          <button
            className="flex-1 text-left truncate"
            onClick={() => onFileSelect(node.path)}
          >
            {node.name}
          </button>
        )}
        {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />}
        {!isRenaming && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            {onRenameFile && (
              <button onClick={() => startRename(node.path)} className="p-0.5 hover:text-foreground rounded">
                <Pencil className="h-2.5 w-2.5" />
              </button>
            )}
            {onDeleteFile && (
              <button onClick={() => onDeleteFile(node.path)} className="p-0.5 hover:text-red-500 rounded">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-52 shrink-0 border-r border-border/50 flex flex-col bg-card/30">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Files</span>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] h-4">{Object.keys(files).length}</Badge>
          {onCreateFile && (
            <button
              onClick={() => { setShowNewFile(true); setTimeout(() => newFileInputRef.current?.focus(), 50) }}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
              title="New file"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {showNewFile && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50 bg-muted/30">
          <FileCode className="h-3 w-3 text-muted-foreground shrink-0" />
          <input
            ref={newFileInputRef}
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitNewFile()
              if (e.key === 'Escape') { setShowNewFile(false); setNewFileName('') }
            }}
            placeholder="filename.tsx"
            className="flex-1 bg-transparent text-xs outline-none border-b border-primary/50"
          />
          <button onClick={commitNewFile} className="text-green-500 hover:text-green-400"><Check className="h-3 w-3" /></button>
          <button onClick={() => { setShowNewFile(false); setNewFileName('') }} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="py-1">
          {!hasFiles ? (
            <div className="px-3 py-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No files yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Generate a project to see files</p>
            </div>
          ) : (
            tree.map(node => renderNode(node))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50">
        <button
          onClick={() => setShowVersions(!showVersions)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            History
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] h-4">{versions.length}</Badge>
            {showVersions ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </div>
        </button>
        {showVersions && (
          <ScrollArea className="max-h-48">
            <div className="pb-2">
              {versions.length === 0 ? (
                <p className="text-[10px] text-muted-foreground px-3 py-2">No versions yet</p>
              ) : (
                versions.map(v => (
                  <div key={v.id} className="px-3 py-1.5 group hover:bg-muted/50 rounded mx-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] h-4 px-1">v{v.versionNum}</Badge>
                        <span className="text-[10px] text-muted-foreground capitalize">{v.agent}</span>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => onRestoreVersion(v.id)}
                        title="Restore this version"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{v.prompt}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                      <span className="text-[9px] text-muted-foreground/50">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
