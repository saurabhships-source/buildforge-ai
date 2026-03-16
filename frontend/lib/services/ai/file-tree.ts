// File Tree Generator — converts a ProjectPlan into a list of file paths
import type { ProjectPlan } from './planner'

export interface FileTreeNode {
  path: string
  type: 'file' | 'folder'
  children?: FileTreeNode[]
}

/** Generate a flat list of file paths from a project plan */
export function generateFileTree(plan: ProjectPlan): string[] {
  const files: string[] = []

  // Always include core files
  files.push('index.html', 'styles.css', 'script.js')

  // Add page-specific files for multi-page apps
  if (plan.pages.length > 1) {
    for (const page of plan.pages) {
      if (page.route === '/') continue // already index.html
      const slug = page.route.replace(/^\//, '').replace(/\//g, '-').replace(/\[.*?\]/g, 'detail')
      if (slug) files.push(`${slug}.html`)
    }
  }

  // Add component files for larger apps
  if (['saas', 'dashboard', 'ecommerce'].includes(plan.appType)) {
    files.push('components.js')
  }

  // Add data/config files
  if (plan.features.some(f => /database|data|api/.test(f))) {
    files.push('data.js')
  }

  return files
}

/** Build a nested tree structure for the file explorer UI */
export function buildFileTree(filePaths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = []
  const folderMap = new Map<string, FileTreeNode>()

  for (const path of filePaths) {
    const parts = path.split('/')
    if (parts.length === 1) {
      root.push({ path, type: 'file' })
    } else {
      const folderPath = parts.slice(0, -1).join('/')
      if (!folderMap.has(folderPath)) {
        const folder: FileTreeNode = { path: folderPath, type: 'folder', children: [] }
        folderMap.set(folderPath, folder)
        root.push(folder)
      }
      folderMap.get(folderPath)!.children!.push({ path, type: 'file' })
    }
  }

  return root
}

/** Get language from file extension */
export function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    html: 'html', css: 'css', json: 'json', md: 'markdown',
    py: 'python', sql: 'sql', sh: 'bash',
  }
  return map[ext] ?? 'plaintext'
}
