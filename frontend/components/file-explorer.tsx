'use client'

import { useState, useCallback } from 'react'
import { File, Folder, Trash2, Edit2, Check, X, ChevronRight, ChevronDown } from 'lucide-react'

interface FileExplorerProps {
  files: Record<string, string>
  activeFile: string | null
  onFileSelect: (path: string) => void
  onFileDelete: (path: string) => void
  onFileRename: (oldPath: string, newPath: string) => void
}

interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[]
}

function buildTree(files: Record<string, string>): TreeNode[] {
  const root: TreeNode[] = []
  const dirs = new Map<string, TreeNode>()

  const getOrCreateDir = (parts: string[], upTo: number): TreeNode[] => {
    if (upTo === 0) return root
    const dirPath = parts.slice(0, upTo).join('/')
    if (dirs.has(dirPath)) return dirs.get(dirPath)!.children
    const parent = getOrCreateDir(parts, upTo - 1)
    const node: TreeNode = { name: parts[upTo - 1], path: dirPath, isDir: true, children: [] }
    dirs.set(dirPath, node)
    parent.push(node)
    return node.children
  }

  for (const path of Object.keys(files).sort()) {
    const parts = path.split('/')
    const parent = getOrCreateDir(parts, parts.length - 1)
    parent.push({ name: parts[parts.length - 1], path, isDir: false, children: [] })
  }

  return root
}

function TreeItem({
  node, activeFile, depth, onSelect, onDelete, onRename,
}: {
  node: TreeNode
  activeFile: string | null
  depth: number
  onSelect: (path: string) => void
  onDelete: (path: string) => void
  onRename: (old: string, next: string) => void
}) {
  const [open, setOpen] = useState(depth < 2)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(node.name)

  const commitRename = useCallback(() => {
    if (editName.trim() && editName !== node.name) {
      const newPath = node.path.replace(new RegExp(`${node.name}$`), editName.trim())
      onRename(node.path, newPath)
    }
    setEditing(false)
  }, [editName, node, onRename])

  const indent = depth * 12

  if (node.isDir) {
    return (
      <div>
        <div
          className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 cursor-pointer rounded text-sm text-gray-400 hover:text-white transition"
          style={{ paddingLeft: indent + 8 }}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
          <Folder className="w-3 h-3 shrink-0 text-yellow-400" />
          <span className="truncate">{node.name}</span>
        </div>
        {open && node.children.map(child => (
          <TreeItem key={child.path} node={child} activeFile={activeFile} depth={depth + 1}
            onSelect={onSelect} onDelete={onDelete} onRename={onRename} />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`group flex items-center gap-1 px-2 py-1 rounded text-sm cursor-pointer transition ${
        activeFile === node.path ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
      style={{ paddingLeft: indent + 8 }}
      onClick={() => !editing && onSelect(node.path)}
    >
      <File className="w-3 h-3 shrink-0" />
      {editing ? (
        <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false) }}
            className="flex-1 bg-gray-700 text-white text-xs px-1 rounded outline-none"
          />
          <button onClick={commitRename}><Check className="w-3 h-3 text-green-400" /></button>
          <button onClick={() => setEditing(false)}><X className="w-3 h-3 text-red-400" /></button>
        </div>
      ) : (
        <>
          <span className="flex-1 truncate">{node.name}</span>
          <div className="hidden group-hover:flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setEditing(true); setEditName(node.name) }}
              className="p-0.5 hover:text-white transition">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(node.path)}
              className="p-0.5 hover:text-red-400 transition">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function FileExplorer({ files, activeFile, onFileSelect, onFileDelete, onFileRename }: FileExplorerProps) {
  const tree = buildTree(files)

  return (
    <div className="h-full bg-gray-950 border-r border-white/10 overflow-y-auto">
      <div className="px-3 py-2 border-b border-white/10">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Files</span>
      </div>
      <div className="py-1">
        {tree.map(node => (
          <TreeItem key={node.path} node={node} activeFile={activeFile} depth={0}
            onSelect={onFileSelect} onDelete={onFileDelete} onRename={onFileRename} />
        ))}
      </div>
    </div>
  )
}
