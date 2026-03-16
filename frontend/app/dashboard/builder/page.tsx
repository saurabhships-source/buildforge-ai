'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { BuilderTopBar } from '@/components/builder/top-bar'
import { FileTreePanel } from '@/components/builder/file-tree-panel'
import { CodeEditorPanel } from '@/components/builder/code-editor-panel'
import { PreviewPanel } from '@/components/builder/preview-panel'
import { PromptPanel } from '@/components/builder/prompt-panel'
import type { ChatMessage } from '@/components/builder/prompt-panel'
import { PipelineLog } from '@/components/builder/pipeline-log'
import { CodebaseGraphPanel } from '@/components/builder/codebase-graph'
import { ProjectPlanModal } from '@/components/builder/project-plan-modal'
import { ScaffoldPanel } from '@/components/builder/scaffold-panel'
import { HealthPanel } from '@/components/builder/health-panel'
import { CommandBar } from '@/components/builder/command-bar'
import { ImprovePanel } from '@/components/builder/improve-panel'
import { PublishDialog } from '@/components/builder/publish-dialog'
import { promptHistory } from '@/lib/prompt-history'
import { VersionHistoryPanel } from '@/components/builder/version-history-panel'
import { PromptHistoryPanel } from '@/components/builder/prompt-history-panel'
import { AutonomousBuildModal, type AutonomousStep } from '@/components/builder/autonomous-build-modal'
import { UIDesignerPanel } from '@/components/builder/ui-designer-panel'
import dynamic from 'next/dynamic'

// Lazy-load heavy panels to reduce initial bundle
const FeatureInstallerPanel = dynamic(
  () => import('@/components/builder/feature-installer-panel').then(m => ({ default: m.FeatureInstallerPanel })),
  { ssr: false, loading: () => null }
)
const BuildTimelinePanel = dynamic(
  () => import('@/components/builder/build-timeline-panel').then(m => ({ default: m.BuildTimelinePanel })),
  { ssr: false, loading: () => null }
)
const MarketplacePanel = dynamic(
  () => import('@/components/builder/marketplace-panel').then(m => ({ default: m.MarketplacePanel })),
  { ssr: false, loading: () => null }
)
import { AgentActivityFeed } from '@/components/builder/agent-activity-feed'
import { BuildGraphViz } from '@/components/builder/build-graph-viz'
import type { GraphNode } from '@/components/builder/build-graph-viz'
import { ModelSettingsPanel } from '@/components/builder/model-settings-panel'
import { TemplatePanel } from '@/components/builder/template-panel'
import { trimChatHistory } from '@/lib/chat-summarizer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GenerationProgress, consumeGenerationStream } from '@/components/builder/generation-progress'
import { generateProjectTitle } from '@/lib/ai-engine/agents/builder-agent'
import { AIThinkingPanel } from '@/components/builder/ai-thinking-panel'
import { CacheIndicator } from '@/components/builder/cache-indicator'
import { UpgradeModal } from '@/components/upgrade-modal'
import { CREDIT_COSTS } from '@/lib/credits'
import type { ThinkingEvent } from '@/components/builder/ai-thinking-panel'
import type { StreamStep } from '@/components/builder/generation-progress'
import { componentRegistry } from '@/lib/component-registry'
import { saveBuildRun, loadBuildRuns, deleteBuildRun } from '@/lib/build-graph/timeline'
import { repoService } from '@/lib/hub/repo-service'
import type { PipelineStep } from '@/lib/ai-engine/orchestrator'
import type { CodebaseGraph } from '@/lib/codebase-intelligence'
import type { ProjectPlan } from '@/lib/ai-engine/agents/planner-agent'
import type { ScaffoldType } from '@/app/api/scaffold/route'
import type { AgentEvent } from '@/lib/agent-events'
import type { BuildRun, TimelineStep } from '@/lib/build-graph/types'

export type { AppType, ModelId, AgentType, ProjectFiles, Version } from '@/lib/builder-types'
import type { AppType, ModelId, AgentType, ProjectFiles, Version } from '@/lib/builder-types'

const STORAGE_KEY = 'buildforge_builder_state'

interface PersistedState {
  projectId: string | null
  projectName: string
  files: ProjectFiles
  versions: Version[]
  activeFile: string
}

function loadPersistedState(): Partial<PersistedState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedState) : {}
  } catch { return {} }
}

function savePersistedState(state: PersistedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* quota */ }
}

async function downloadAsZip(files: ProjectFiles, projectName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).JSZip) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
      s.onload = () => resolve(); s.onerror = () => reject(new Error('JSZip load failed'))
      document.head.appendChild(s)
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zip = new (window as any).JSZip()
  for (const [f, c] of Object.entries(files)) zip.file(f, c)
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${projectName.toLowerCase().replace(/\s+/g, '-') || 'project'}.zip`
  a.click(); URL.revokeObjectURL(url)
}

function isEditRequest(prompt: string, hasFiles: boolean): boolean {
  if (!hasFiles) return false
  return /\b(add|change|update|fix|make|remove|delete|modify|improve|refactor|rename|replace|insert|style|color|font|layout|responsive|mobile|dark mode|animation|hover|click|button|form|nav|footer|header|section|page)\b/i.test(prompt)
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground text-sm">Loading builder…</div>}>
      <BuilderPageInner />
    </Suspense>
  )
}

function BuilderPageInner() {
  const { user, isLoading: authLoading, refreshUser } = useAuth()
  const refreshUserRef = useRef(refreshUser)
  refreshUserRef.current = refreshUser
  const searchParams = useSearchParams()

  const persisted = useRef(loadPersistedState())

  const [projectId, setProjectId] = useState<string | null>(persisted.current.projectId ?? null)
  const [projectName, setProjectName] = useState(persisted.current.projectName ?? 'Untitled Project')
  const [appType, setAppType] = useState<AppType>('website')
  const [selectedModel, setSelectedModel] = useState<ModelId>('gemini_flash')
  const [files, setFiles] = useState<ProjectFiles>(persisted.current.files ?? {})
  const [activeFile, setActiveFile] = useState<string>(persisted.current.activeFile ?? 'index.html')
  const [versions, setVersions] = useState<Version[]>(persisted.current.versions ?? [])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [agentUsed, setAgentUsed] = useState<AgentType | null>(null)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [editedFiles, setEditedFiles] = useState<ProjectFiles>({})
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set())
  const [autonomousMode, setAutonomousMode] = useState(false)
  const [localAIMode, setLocalAIMode] = useState(false)
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([])
  const [showPipeline, setShowPipeline] = useState(false)
  const [codebaseGraph, setCodebaseGraph] = useState<CodebaseGraph | null>(null)
  const [showGraph, setShowGraph] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  // Plan modal state
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<ProjectPlan | null>(null)
  const [isPlanLoading, setIsPlanLoading] = useState(false)
  const pendingPromptRef = useRef<string>('')
  // Build graph / agent activity
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([])
  const [showActivityFeed, setShowActivityFeed] = useState(false)
  const [buildGraphMode, setBuildGraphMode] = useState<'fast' | 'full' | 'maintenance' | 'saas'>('fast')
  const [isImproving, setIsImproving] = useState(false)
  // Hub integration
  const [hubRepoId, setHubRepoId] = useState<string | null>(null)
  // Cache state
  const [lastCacheHit, setLastCacheHit] = useState<{ level: 1 | 2; similarity: number } | null>(null)
  // Command bar + improve panel
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [showImprovePanel, setShowImprovePanel] = useState(false)
  const [showTemplatePanel, setShowTemplatePanel] = useState(false)
  // Publish dialog
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  // Timeline + graph viz
  const [buildRuns, setBuildRuns] = useState<BuildRun[]>(() => {
    if (typeof window === 'undefined') return []
    try { return loadBuildRuns() } catch { return [] }
  })
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [isReplaying, setIsReplaying] = useState(false)
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([])
  const [showGraphViz, setShowGraphViz] = useState(false)

  // Streaming generation state
  const [streamSteps, setStreamSteps] = useState<StreamStep[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamFileCount, setStreamFileCount] = useState(0)
  const [thinkingEvents, setThinkingEvents] = useState<ThinkingEvent[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  // Autonomous build modal
  const [showAutonomousModal, setShowAutonomousModal] = useState(false)
  const [autonomousSteps, setAutonomousSteps] = useState<AutonomousStep[]>([])

  const projectIdRef = useRef<string | null>(projectId)
  projectIdRef.current = projectId
  const currentFilesRef = useRef<ProjectFiles>({})
  const currentFiles = { ...files, ...editedFiles }
  currentFilesRef.current = currentFiles

  const entryFile = currentFiles['index.html'] ? 'index.html'
    : currentFiles['app/page.tsx'] ? 'app/page.tsx'
    : Object.keys(currentFiles)[0] ?? ''

  useEffect(() => {
    if (Object.keys(files).length === 0) return
    savePersistedState({ projectId, projectName, files, versions, activeFile })
  }, [projectId, projectName, files, versions, activeFile])

  // ── Plan flow ──────────────────────────────────────────────────────────────
  const fetchPlan = useCallback(async (prompt: string) => {
    setIsPlanLoading(true)
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modelId: selectedModel }),
      })
      const data = await res.json()
      setCurrentPlan(data.plan)
    } catch {
      toast.error('Failed to generate plan')
    } finally {
      setIsPlanLoading(false)
    }
  }, [selectedModel])

  const handlePromptSubmit = useCallback(async (prompt: string, forceAgent?: AgentType, startupMode?: boolean) => {
    if (!prompt.trim()) return
    // Skip plan for edits, quick actions, startup mode, or autonomous mode
    const hasExisting = Object.keys(currentFilesRef.current).length > 0
    const skipPlan = hasExisting || forceAgent || startupMode || autonomousMode
    if (!skipPlan) {
      pendingPromptRef.current = prompt
      setPlanModalOpen(true)
      fetchPlan(prompt)
      return
    }
    handleGenerate(prompt, forceAgent, startupMode)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autonomousMode, fetchPlan])

  const handlePlanApprove = useCallback((plan: ProjectPlan) => {
    setPlanModalOpen(false)
    setCurrentPlan(plan)
    handleGenerate(pendingPromptRef.current, undefined, false, plan)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Core generation ────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (
    prompt: string,
    forceAgent?: AgentType,
    startupMode?: boolean,
    plan?: ProjectPlan,
  ) => {
    if (!prompt.trim()) return
    if (authLoading) toast.info('Loading your account…')
    const creditCostNeeded = startupMode ? CREDIT_COSTS.startupGenerator : autonomousMode ? CREDIT_COSTS.autonomousPipeline : CREDIT_COSTS.generateProject
    if (user && !user.isAdmin && user.creditsRemaining < creditCostNeeded) { setShowUpgradeModal(true); return }

    // Cancel any in-flight request
    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const userMsg: ChatMessage = { role: 'user', content: prompt, timestamp: new Date().toISOString() }
    setChatHistory(prev => [...trimChatHistory(prev), userMsg])
    setIsGenerating(true); setAgentUsed(null)
    setLastCacheHit(null)
    setGenerationStatus('Initializing...')
    if (autonomousMode || startupMode) { setShowPipeline(true); setPipelineSteps([]) }

    const hasExistingFiles = Object.keys(currentFilesRef.current).length > 0
    const usePatchMode = hasExistingFiles && !forceAgent && !autonomousMode && !startupMode && isEditRequest(prompt, hasExistingFiles)

    try {
      if (usePatchMode) {
        // ── PATCH MODE (non-streaming, fast) ──────────────────────────────
        setGenerationStatus('Analyzing changes...')
        const res = await fetch('/api/patch', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, existingFiles: currentFilesRef.current, projectId: projectIdRef.current ?? undefined, modelId: selectedModel }),
          signal: abortController.signal,
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 402) { setShowUpgradeModal(true); return }
          throw new Error((data.error as string) ?? `Server ${res.status}`)
        }
        const patch = data.patch as { updates: ProjectFiles; newFiles: ProjectFiles; deletedFiles: string[] }
        const updated = { ...currentFilesRef.current }
        if (patch?.updates) Object.assign(updated, patch.updates)
        if (patch?.newFiles) Object.assign(updated, patch.newFiles)
        if (patch?.deletedFiles) patch.deletedFiles.forEach(k => delete updated[k])
        setFiles(updated); setEditedFiles({}); setDirtyFiles(new Set()); setAgentUsed('builder')

        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: (data.patch as { description?: string })?.description ?? 'Patch applied',
          timestamp: new Date().toISOString(), isPatch: true,
        }])
        if (data.versionId) {
          setVersions(prev => [{ id: data.versionId as string, versionNum: data.versionNum as number ?? 1, prompt, agent: 'builder', createdAt: new Date().toISOString() }, ...prev])
        }
        toast.success('Patch applied')
      } else {
        // ── STREAMING GENERATION ──────────────────────────────────────────
        setIsStreaming(true)
        setStreamSteps([])
        setStreamFileCount(0)
        setThinkingEvents([])

        const enrichedPrompt = plan
          ? `${prompt}\n\nProject Plan:\n- Pages: ${plan.pages.join(', ')}\n- Components: ${plan.components.join(', ')}\n- Style: ${plan.designSystem.style} ${plan.designSystem.primaryColor}\n- App type: ${plan.appType}`
          : prompt

        const streamBody = {
          prompt: enrichedPrompt,
          appType: plan?.appType ?? appType,
          projectId: projectIdRef.current ?? undefined,
          modelId: selectedModel,
          forceAgent,
          existingFiles: hasExistingFiles ? currentFilesRef.current : undefined,
          autonomousMode,
          localAIMode,
          startupMode: startupMode ?? false,
        }

        const streamedFiles: ProjectFiles = {}
        let completedData: Record<string, unknown> | null = null

        for await (const event of consumeGenerationStream(streamBody, abortController.signal)) {
          if (abortController.signal.aborted) break

          if (event.type === 'thinking' && (event as unknown as ThinkingEvent).agent) {
            const te = event as unknown as ThinkingEvent
            setThinkingEvents(prev => [...prev, { agent: te.agent, message: te.message ?? '', timestamp: new Date().toISOString() }])
          }

          if (event.type === 'progress' && event.step) {
            setGenerationStatus(event.message ?? '')
            setStreamSteps(prev => {
              const existing = prev.find(s => s.id === event.step)
              if (existing) {
                return prev.map(s => s.id === event.step ? { ...s, status: 'active' as const, message: event.message } : s.status === 'active' ? { ...s, status: 'done' as const } : s)
              }
              // Mark previous active as done
              const updated = prev.map(s => s.status === 'active' ? { ...s, status: 'done' as const } : s)
              return [...updated, { id: event.step!, label: event.message ?? event.step!, status: 'active' as const, message: event.message }]
            })
          }

          if (event.type === 'file_update' && event.file && event.content !== undefined) {
            streamedFiles[event.file] = event.content
            setStreamFileCount(Object.keys(streamedFiles).length)
            // Update files incrementally so preview refreshes live
            setFiles({ ...streamedFiles })
          }

          if (event.type === 'complete') {
            completedData = event as unknown as Record<string, unknown>
            // Mark all steps done
            setStreamSteps(prev => prev.map(s => ({ ...s, status: 'done' as const })))
          }

          if (event.type === 'error') {
            const errMsg = event.message ?? 'Stream error'
            if (errMsg.toLowerCase().includes('insufficient credits') || errMsg.toLowerCase().includes('run out of credits')) {
              setShowUpgradeModal(true); return
            }
            throw new Error(errMsg)
          }
        }

        if (completedData) {
          const data = completedData
          const finalFiles = (data.files as ProjectFiles) ?? streamedFiles
          if (Object.keys(finalFiles).length === 0) throw new Error('No files generated')

          setFiles(finalFiles); setEditedFiles({}); setDirtyFiles(new Set())
          componentRegistry.extractFromFiles(finalFiles)
          setAgentUsed((data.agent as AgentType) ?? 'builder')

          if (!projectIdRef.current && data.projectId) {
            projectIdRef.current = data.projectId as string
            setProjectId(data.projectId as string)
            setProjectName(plan?.projectName ?? generateProjectTitle(prompt).fullName)
          }
          if (data.versionId) {
            setVersions(prev => [{ id: data.versionId as string, versionNum: (data.versionNum as number) ?? 1, prompt, agent: (data.agent as AgentType) ?? 'builder', createdAt: new Date().toISOString() }, ...prev])
          }
          const entry = (data.entrypoint as string) ?? 'index.html'
          setActiveFile((finalFiles)[entry] ? entry : Object.keys(finalFiles)[0] ?? 'index.html')
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: (data.description as string) ?? `Generated by ${(data.agent as string) ?? 'builder'}Agent`,
            timestamp: new Date().toISOString(), agent: (data.agent as AgentType) ?? 'builder',
          }])
          if (data.error) toast.warning(`Fallback used. ${data.error}`)
          else if (data.cacheHit) {
            setLastCacheHit({ level: data.cacheLevel as 1 | 2, similarity: data.cacheSimilarity as number })
            toast.success(`Cache hit (L${data.cacheLevel}) — instant result, no credits used`)
          }
          else {
            toast.success(startupMode ? 'Startup generated' : autonomousMode ? 'Pipeline complete' : `Done — ${(data.agent as string) ?? 'builder'}Agent`)
            // Show publish dialog after first generation
            if (!projectIdRef.current || !hubRepoId) setShowPublishDialog(true)
          }
          // Save to prompt history (localStorage)
          promptHistory.add({
            prompt,
            projectId: (data.projectId as string) ?? projectIdRef.current ?? undefined,
            projectName: plan?.projectName ?? generateProjectTitle(prompt).fullName,
            appType: plan?.appType ?? appType,
          })
          // Save to DB-backed prompt history
          const savedProjectId = (data.projectId as string) ?? projectIdRef.current
          if (savedProjectId) {
            fetch(`/api/projects/${savedProjectId}/prompt-history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                model: selectedModel,
                resultSummary: (data.description as string) ?? undefined,
                versionId: (data.versionId as string) ?? undefined,
              }),
            }).catch(() => {})
          }
        }
      }
      setTimeout(() => refreshUserRef.current(), 1500)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Generation failed'
      toast.error(msg)
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${msg}`, timestamp: new Date().toISOString() }])
    } finally {
      setIsGenerating(false)
      setIsStreaming(false)
      setGenerationStatus('')
      // Keep steps visible for 3s then clear
      setTimeout(() => setStreamSteps([]), 3000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appType, selectedModel, autonomousMode, localAIMode, user?.creditsRemaining, authLoading])

  // ── Scaffold (database / auth / api / design-system) ──────────────────────
  const handleScaffold = useCallback(async (type: ScaffoldType) => {
    if (!currentPlan && type !== 'design-system') { toast.error('Generate a project first'); return }
    toast.loading(`Generating ${type}...`, { id: 'scaffold' })
    try {
      const res = await fetch('/api/scaffold', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          projectName: projectName,
          modelId: selectedModel,
          tables: currentPlan?.database?.tables,
          dbTarget: 'prisma',
          authProvider: currentPlan?.authentication?.provider ?? 'clerk',
          apis: currentPlan?.apis,
          designSpec: currentPlan ? {
            primaryColor: currentPlan.designSystem.primaryColor,
            style: currentPlan.designSystem.style,
            fonts: currentPlan.designSystem.fonts,
            projectName,
          } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFiles(prev => ({ ...prev, ...data.files }))
      toast.success(`${type} scaffolded — ${Object.keys(data.files).length} files added`, { id: 'scaffold' })
      const firstNew = Object.keys(data.files)[0]
      if (firstNew) setActiveFile(firstNew)
      setTimeout(() => refreshUserRef.current(), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scaffold failed', { id: 'scaffold' })
    }
  }, [currentPlan, projectName, selectedModel, refreshUserRef])

  // ── Auto-fix (self-healing preview) ───────────────────────────────────────
  const handleAutoFix = useCallback(async (error: string) => {
    if (Object.keys(currentFilesRef.current).length === 0) return
    toast.loading('AI is fixing the error...', { id: 'autofix' })
    try {
      const res = await fetch('/api/fix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error, files: currentFilesRef.current, modelId: selectedModel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFiles(data.files); setEditedFiles({}); setDirtyFiles(new Set())
      toast.success(`Fixed: ${data.rootCause ?? 'error resolved'}`, { id: 'autofix' })
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `Auto-fixed: ${data.rootCause ?? data.description ?? 'runtime error resolved'}`,
        timestamp: new Date().toISOString(),
      }])
      setTimeout(() => refreshUserRef.current(), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Auto-fix failed', { id: 'autofix' })
    }
  }, [selectedModel, refreshUserRef])

  // ── File CRUD ──────────────────────────────────────────────────────────────
  const handleCreateFile = useCallback((path: string, content = '') => {
    setFiles(prev => ({ ...prev, [path]: content }))
    setActiveFile(path)
    toast.success(`Created ${path}`)
  }, [])

  const handleDeleteFile = useCallback((path: string) => {
    setFiles(prev => { const n = { ...prev }; delete n[path]; return n })
    setEditedFiles(prev => { const n = { ...prev }; delete n[path]; return n })
    setDirtyFiles(prev => { const n = new Set(prev); n.delete(path); return n })
    if (activeFile === path) {
      const remaining = Object.keys(currentFilesRef.current).filter(k => k !== path)
      setActiveFile(remaining[0] ?? '')
    }
    toast.success(`Deleted ${path}`)
  }, [activeFile])

  const handleRenameFile = useCallback((oldPath: string, newPath: string) => {
    setFiles(prev => {
      const n = { ...prev }
      n[newPath] = n[oldPath]; delete n[oldPath]; return n
    })
    if (activeFile === oldPath) setActiveFile(newPath)
    toast.success(`Renamed to ${newPath}`)
  }, [activeFile])

  const handleFileEdit = useCallback((filename: string, content: string) => {
    setEditedFiles(prev => ({ ...prev, [filename]: content }))
    setDirtyFiles(prev => new Set(prev).add(filename))
  }, [])

  const handleSaveFile = useCallback((filename: string) => {
    setFiles(prev => ({ ...prev, [filename]: editedFiles[filename] ?? prev[filename] }))
    setEditedFiles(prev => { const n = { ...prev }; delete n[filename]; return n })
    setDirtyFiles(prev => { const n = new Set(prev); n.delete(filename); return n })
    toast.success(`Saved ${filename}`)
  }, [editedFiles])

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`)
      const data = await res.json()
      setFiles(data.files); setEditedFiles({}); setDirtyFiles(new Set())
      toast.success(`Restored v${data.versionNum}`)
    } catch { toast.error('Failed to restore version') }
  }, [projectId])

  const handleDownloadZip = useCallback(async () => {
    if (Object.keys(currentFilesRef.current).length === 0) return
    try {
      toast.loading('Preparing ZIP...', { id: 'zip' })
      await downloadAsZip(currentFilesRef.current, projectName)
      toast.success('Downloaded!', { id: 'zip' })
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Download failed', { id: 'zip' }) }
  }, [projectName])

  const handleGitHubImport = useCallback(async (repoUrl: string) => {
    if (!repoUrl.trim()) return
    setIsGenerating(true); setShowPipeline(true); setPipelineSteps([])
    toast.loading('Importing...', { id: 'import' })
    try {
      const res = await fetch('/api/github/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFiles(data.files); setEditedFiles({}); setDirtyFiles(new Set())
      if (data.pipelineSteps) setPipelineSteps(data.pipelineSteps)
      projectIdRef.current = data.projectId; setProjectId(data.projectId)
      setProjectName(repoUrl.split('/').slice(-2).join('/'))
      const entry = data.entrypoint ?? 'index.html'
      setActiveFile(data.files[entry] ? entry : Object.keys(data.files)[0] ?? 'index.html')
      toast.success(`Imported ${data.importedFileCount} files`, { id: 'import' })
      setTimeout(() => refreshUserRef.current(), 1500)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Import failed', { id: 'import' }) }
    finally { setIsGenerating(false) }
  }, [refreshUserRef])

  const handleDeploy = useCallback(async (provider: 'vercel' | 'netlify') => {
    if (!projectIdRef.current || Object.keys(currentFilesRef.current).length === 0) { toast.error('Generate a project first'); return }
    toast.loading(`Deploying to ${provider}...`, { id: 'deploy' })
    try {
      const res = await fetch(`/api/deploy/${provider}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectIdRef.current, files: currentFilesRef.current, projectName: projectName.toLowerCase().replace(/\s+/g, '-'), siteName: projectName.toLowerCase().replace(/\s+/g, '-') }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeployUrl(data.url)
      toast.success(`Deployed! ${data.url}`, { id: 'deploy' })
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Deploy failed', { id: 'deploy' }) }
  }, [projectName])

  const handleGitHubExport = useCallback(async (repoName: string, isPrivate: boolean) => {
    if (!projectIdRef.current || Object.keys(currentFilesRef.current).length === 0) { toast.error('Generate a project first'); return }
    toast.loading('Exporting...', { id: 'github' })
    try {
      const res = await fetch('/api/github/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectIdRef.current, repoName, isPrivate, files: currentFilesRef.current }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Exported to ${data.repoUrl}`, { id: 'github' })
      window.open(data.repoUrl, '_blank')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Export failed', { id: 'github' }) }
  }, [])

  const handleAnalyzeCodebase = useCallback(async () => {
    if (Object.keys(currentFilesRef.current).length === 0) return
    try {
      const res = await fetch('/api/github/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: currentFilesRef.current }),
      })
      const data = await res.json()
      if (data.analysis?.graph) { setCodebaseGraph(data.analysis.graph); setShowGraph(true) }
    } catch { /* non-critical */ }
  }, [])

  // ── Build Graph (multi-agent pipeline) ────────────────────────────────────
  const handleBuildGraph = useCallback(async (prompt: string, mode: 'fast' | 'full' | 'maintenance' | 'saas' = 'fast') => {
    if (!prompt.trim()) return
    const bgCost = mode === 'maintenance' ? CREDIT_COSTS.improveCode : mode === 'full' || mode === 'saas' ? CREDIT_COSTS.autonomousPipeline : CREDIT_COSTS.generateProject
    if (user && !user.isAdmin && user.creditsRemaining < bgCost) { setShowUpgradeModal(true); return }
    setIsGenerating(true); setGenerationStatus('Running build graph...')
    setShowActivityFeed(true); setAgentEvents([])
    setShowPipeline(false)
    const userMsg: ChatMessage = { role: 'user', content: prompt, timestamp: new Date().toISOString() }
    setChatHistory(prev => [...trimChatHistory(prev), userMsg])
    try {
      const res = await fetch('/api/build-graph', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt, appType, modelId: selectedModel,
          existingFiles: mode === 'maintenance' ? currentFilesRef.current : undefined,
          projectId: projectIdRef.current ?? undefined,
          mode,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Server ${res.status}`)
      if (data.files && Object.keys(data.files).length > 0) {
        setFiles(data.files); setEditedFiles({}); setDirtyFiles(new Set())
        componentRegistry.extractFromFiles(data.files)
      }
      if (data.events) setAgentEvents(data.events)
      if (data.nodes) {
        setPipelineSteps(data.nodes.map((n: { type: string; status: string; description?: string; changes: string[]; durationMs?: number }) => ({
          agent: n.type, status: n.status, description: n.description ?? '', changes: n.changes, durationMs: n.durationMs,
        })))
        setGraphNodes(data.nodes.map((n: { id: string; type: string; label: string; status: string; dependencies?: string[]; durationMs?: number; description?: string }) => ({
          id: n.id, type: n.type, label: n.label, status: n.status as GraphNode['status'],
          dependencies: n.dependencies ?? [], durationMs: n.durationMs, description: n.description,
        })))
        setShowGraphViz(true)
      }
      // Save timeline
      if (data.timeline) {
        saveBuildRun(data.timeline)
        setBuildRuns(loadBuildRuns())
        // Auto-update hub repo if one exists
        if (hubRepoId && data.files && Object.keys(data.files as Record<string,string>).length > 0) {
          repoService.updateRepo(hubRepoId, {
            files: data.files as Record<string, string>,
            prompt,
            agent: 'builder',
            buildRun: data.timeline,
            templateId: data.templateId as string | undefined,
            architectureSpec: data.architecture,
            modules: data.modules as string[] | undefined,
          })
        }
      }
      if (!projectIdRef.current && data.projectId) {
        projectIdRef.current = data.projectId; setProjectId(data.projectId)
        setProjectName(generateProjectTitle(prompt).fullName)
      }
      if (data.versionId) {
        setVersions(prev => [{ id: data.versionId, versionNum: data.versionNum ?? 1, prompt, agent: 'builder', createdAt: new Date().toISOString() }, ...prev])
      }
      const entry = currentFilesRef.current['index.html'] ? 'index.html' : Object.keys(currentFilesRef.current)[0] ?? 'index.html'
      setActiveFile(entry)
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Build graph complete — ${data.nodes?.filter((n: { status: string }) => n.status === 'completed').length ?? 0} agents ran`, timestamp: new Date().toISOString() }])
      toast.success(`Build graph complete (${(data.totalDurationMs / 1000).toFixed(1)}s)`)
      setTimeout(() => refreshUserRef.current(), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Build graph failed')
    } finally { setIsGenerating(false); setGenerationStatus('') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appType, selectedModel, user?.creditsRemaining])

  // ── Autonomous Improvement Loop ────────────────────────────────────────────
  const handleImprove = useCallback(async () => {
    if (Object.keys(currentFilesRef.current).length === 0) { toast.error('Generate a project first'); return }
    if (user && !user.isAdmin && user.creditsRemaining < 3) { toast.error('Need at least 3 credits'); return }
    setIsImproving(true); setGenerationStatus('Running improvement loop...')
    toast.loading('Autonomous improvement running...', { id: 'improve' })
    try {
      const res = await fetch('/api/improve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: currentFilesRef.current, prompt: projectName, modelId: selectedModel, projectId: projectIdRef.current }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.files) { setFiles(data.files); setEditedFiles({}); setDirtyFiles(new Set()) }
      toast.success(`Improved: ${data.initialScore} → ${data.finalScore} score`, { id: 'improve' })
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Autonomous improvement: score ${data.initialScore} → ${data.finalScore} (${data.iterations?.length ?? 0} iterations)`, timestamp: new Date().toISOString() }])
      setTimeout(() => refreshUserRef.current(), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Improvement failed', { id: 'improve' })
    } finally { setIsImproving(false); setGenerationStatus('') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName, selectedModel, user?.creditsRemaining])

  // ── Autonomous Build pipeline ─────────────────────────────────────────────
  const handleAutonomousBuild = useCallback(async (idea: string) => {
    if (!idea.trim()) return
    if (user && !user.isAdmin && user.creditsRemaining < CREDIT_COSTS.autonomousPipeline) {
      setShowUpgradeModal(true); return
    }
    const steps: AutonomousStep[] = [
      { id: 'analyze', label: 'Analyzing idea', description: 'Understanding requirements and scope', status: 'active' },
      { id: 'spec', label: 'Designing architecture', description: 'Creating product specification', status: 'pending' },
      { id: 'database', label: 'Generating database', description: 'Schema and data models', status: 'pending' },
      { id: 'backend', label: 'Generating backend', description: 'API routes and server logic', status: 'pending' },
      { id: 'frontend', label: 'Generating frontend', description: 'UI components and pages', status: 'pending' },
      { id: 'deploy', label: 'Preparing deployment', description: 'Config and environment setup', status: 'pending' },
    ]
    setAutonomousSteps([...steps])

    const markStep = (id: string, status: AutonomousStep['status']) => {
      setAutonomousSteps(prev => prev.map(s => {
        if (s.id === id) return { ...s, status }
        if (status === 'active') return s.status === 'active' ? { ...s, status: 'done' as const } : s
        return s
      }))
    }

    // Step 1: analyze → spec
    markStep('spec', 'active')
    await new Promise(r => setTimeout(r, 800))

    // Step 2: run the full autonomous pipeline via existing generate
    markStep('database', 'active')
    await handleGenerate(idea, undefined, false, undefined)

    // Mark remaining steps done
    steps.forEach(s => markStep(s.id, 'done'))
    setShowAutonomousModal(false)
    setAutonomousSteps([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.creditsRemaining, user?.isAdmin, handleGenerate])

  // ── Timeline step replay ──────────────────────────────────────────────────
  const handleReplayStep = useCallback((files: Record<string, string>, step: TimelineStep, _run: BuildRun) => {
    setIsReplaying(true)
    setActiveStepId(step.id)
    setFiles(files); setEditedFiles({}); setDirtyFiles(new Set())
    const entry = files['index.html'] ? 'index.html' : files['app/page.tsx'] ? 'app/page.tsx' : Object.keys(files)[0] ?? ''
    setActiveFile(entry)
    toast.success(`Restored to Step ${step.stepNum}: ${step.agent}Agent`)
    setTimeout(() => setIsReplaying(false), 500)
  }, [])

  const handleBranchFromStep = useCallback((files: Record<string, string>, step: TimelineStep, _run: BuildRun) => {
    setFiles(files); setEditedFiles({}); setDirtyFiles(new Set())
    setActiveStepId(null)
    setProjectId(null); projectIdRef.current = null
    setProjectName(`Branch from Step ${step.stepNum}`)
    setVersions([])
    const entry = files['index.html'] ? 'index.html' : Object.keys(files)[0] ?? ''
    setActiveFile(entry)
    toast.success(`Branched from Step ${step.stepNum} — new project started`)
  }, [])

  const handleClearRuns = useCallback(() => {
    buildRuns.forEach(r => deleteBuildRun(r.buildId))
    setBuildRuns([])
    setActiveStepId(null)
    toast.success('Build history cleared')
  }, [buildRuns])

  // ── Hub integration ────────────────────────────────────────────────────────
  // ⌘K keyboard shortcut for command bar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandBarOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  const handleSaveToHub = useCallback(() => {
    if (Object.keys(currentFilesRef.current).length === 0) { toast.error('Generate a project first'); return }
    const ownerId = user?.id ?? 'anonymous'
    const ownerName = user?.name ?? 'anonymous'
    const lastRun = buildRuns[0] ?? undefined
    if (hubRepoId) {
      const updated = repoService.updateRepo(hubRepoId, {
        files: currentFilesRef.current,
        prompt: chatHistory.findLast(m => m.role === 'user')?.content ?? projectName,
        agent: agentUsed ?? 'builder',
        buildRun: lastRun,
      })
      if (updated) toast.success('Hub repo updated')
    } else {
      const repo = repoService.createRepo({
        name: projectName,
        description: chatHistory.find(m => m.role === 'user')?.content?.slice(0, 120) ?? projectName,
        ownerId,
        ownerName,
        appType,
        files: currentFilesRef.current,
        prompt: chatHistory.findLast(m => m.role === 'user')?.content ?? projectName,
        agent: agentUsed ?? 'builder',
        buildRun: lastRun,
        projectId: projectIdRef.current ?? undefined,
      })
      setHubRepoId(repo.id)
      toast.success('Saved to Hub', { action: { label: 'View', onClick: () => window.open(`/hub/${repo.id}`, '_blank') } })
    }
  }, [user, hubRepoId, projectName, appType, agentUsed, buildRuns, chatHistory])

  const handlePublishToGallery = useCallback(() => {
    if (Object.keys(currentFilesRef.current).length === 0) { toast.error('Generate a project first'); return }
    // Ensure saved to hub first
    const ownerId = user?.id ?? 'anonymous'
    const ownerName = user?.name ?? 'anonymous'
    const lastRun = buildRuns[0] ?? undefined
    let repoId = hubRepoId
    if (!repoId) {
      const repo = repoService.createRepo({
        name: projectName,
        description: chatHistory.find(m => m.role === 'user')?.content?.slice(0, 120) ?? projectName,
        ownerId, ownerName, appType,
        files: currentFilesRef.current,
        prompt: chatHistory.findLast(m => m.role === 'user')?.content ?? projectName,
        agent: agentUsed ?? 'builder',
        buildRun: lastRun,
        projectId: projectIdRef.current ?? undefined,
      })
      repoId = repo.id
      setHubRepoId(repo.id)
    }
    const published = repoService.publishRepo(repoId, {
      tags: [appType === 'saas' ? 'SaaS' : appType === 'dashboard' ? 'Dashboard' : appType === 'ai_app' ? 'AI App' : 'Tool'],
    })
    if (published) {
      toast.success('Published to Gallery', {
        action: { label: 'View', onClick: () => window.open(`/apps/${repoId}`, '_blank') },
      })
    }
  }, [user, hubRepoId, projectName, appType, agentUsed, buildRuns, chatHistory])

  const handleCommandResult = useCallback((updatedFiles: Record<string, string>, description: string) => {
    setFiles(updatedFiles)
    setEditedFiles({})
    setDirtyFiles(new Set())
    setChatHistory(prev => [...prev, { role: 'assistant', content: description, timestamp: new Date().toISOString(), agent: 'builder' as AgentType }])
  }, [])

  // Load hub repo or restore on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const restoreRaw = localStorage.getItem('buildforge_hub_restore')
    if (restoreRaw) {
      try {
        const { files: restoredFiles, repoId } = JSON.parse(restoreRaw) as { files: Record<string, string>; repoId?: string }
        localStorage.removeItem('buildforge_hub_restore')
        if (restoredFiles && Object.keys(restoredFiles).length > 0) {
          setFiles(restoredFiles); setEditedFiles({}); setDirtyFiles(new Set())
          if (repoId) setHubRepoId(repoId)
          const entry = restoredFiles['index.html'] ? 'index.html' : Object.keys(restoredFiles)[0] ?? ''
          setActiveFile(entry)
          toast.success('Restored from Hub')
        }
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load project from ?project= query param
  useEffect(() => {
    const projectParam = searchParams.get('project')
    if (!projectParam || projectParam === projectIdRef.current) return

    const loadProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectParam}`)
        if (!res.ok) return
        const data = await res.json()
        projectIdRef.current = data.id
        setProjectId(data.id)
        setProjectName(data.name)
        if (data.appType) setAppType(data.appType as AppType)
        // Track as recently opened
        fetch(`/api/projects/${projectParam}/open`, { method: 'POST' }).catch(() => {})

        // Load latest version files if available
        if (data.versions && data.versions.length > 0) {
          const latest = data.versions[0]
          if (latest.files && Object.keys(latest.files).length > 0) {
            setFiles(latest.files)
            setEditedFiles({})
            setDirtyFiles(new Set())
            const entry = latest.files['index.html'] ? 'index.html' : Object.keys(latest.files)[0] ?? ''
            setActiveFile(entry)
          }
          setVersions(data.versions.map((v: { id: string; versionNum: number; prompt: string; agent: string; createdAt: string }) => ({
            id: v.id, versionNum: v.versionNum, prompt: v.prompt, agent: v.agent as AgentType, createdAt: v.createdAt,
          })))
        }
      } catch { /* silent — project may not exist in DB */ }
    }
    loadProject()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Load hub repo from ?hub= query param
  useEffect(() => {
    const hubId = searchParams.get('hub')
    if (!hubId) return
    const repo = repoService.loadRepo(hubId)
    if (!repo) return
    setFiles(repo.files); setEditedFiles({}); setDirtyFiles(new Set())
    setProjectName(repo.name)
    setHubRepoId(repo.id)
    if (repo.buildRuns.length > 0) {
      repo.buildRuns.forEach(r => saveBuildRun(r))
      setBuildRuns(loadBuildRuns())
    }
    const entry = repo.files['index.html'] ? 'index.html' : Object.keys(repo.files)[0] ?? ''
    setActiveFile(entry)
    toast.success(`Loaded "${repo.name}" from Hub`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasFiles = Object.keys(currentFiles).length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <BuilderTopBar
        projectName={projectName}
        projectId={projectId}
        appType={appType}
        selectedModel={selectedModel}
        agentUsed={agentUsed}
        isGenerating={isGenerating}
        hasFiles={hasFiles}
        deployUrl={deployUrl}
        credits={user?.isAdmin ? Infinity : (user?.creditsRemaining ?? (authLoading ? -1 : 0))}
        autonomousMode={autonomousMode}
        localAIMode={localAIMode}
        buildGraphMode={buildGraphMode}
        isImproving={isImproving}
        onAppTypeChange={setAppType}
        onModelChange={setSelectedModel}
        onDeploy={handleDeploy}
        onGitHubExport={handleGitHubExport}
        onGitHubImport={handleGitHubImport}
        onAutonomousModeChange={setAutonomousMode}
        onLocalAIModeChange={setLocalAIMode}
        onAnalyzeCodebase={hasFiles ? handleAnalyzeCodebase : undefined}
        onBuildGraphModeChange={setBuildGraphMode}
        onRunBuildGraph={() => {
          const lastPrompt = chatHistory.findLast(m => m.role === 'user')?.content ?? projectName
          handleBuildGraph(lastPrompt, buildGraphMode as 'fast' | 'full' | 'maintenance')
        }}
        onImprove={handleImprove}
        onSaveToHub={handleSaveToHub}
        hubRepoId={hubRepoId}
        onPublishToGallery={handlePublishToGallery}
        isPublic={hubRepoId ? repoService.loadRepo(hubRepoId)?.visibility === 'public' : false}
        onToggleVisibility={(pub) => {
          if (hubRepoId) {
            if (!pub) repoService.setTemplate(hubRepoId, false)
            else repoService.publishRepo(hubRepoId)
          }
        }}
        onProjectChange={(id, name) => {
          projectIdRef.current = id
          setProjectId(id)
          setProjectName(name)
          // Clear current state for new project
          setFiles({})
          setEditedFiles({})
          setDirtyFiles(new Set())
          setVersions([])
          setChatHistory([])
          setAgentUsed(null)
          setDeployUrl(null)
        }}
        onProjectNameChange={setProjectName}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-52 shrink-0 border-r border-border/50 overflow-hidden">
          {showTemplatePanel ? (
            <div className="flex-1 overflow-hidden">
              <TemplatePanel
                currentPrompt={chatHistory.findLast(m => m.role === 'user')?.content}
                onSelectTemplate={(templateId, prompt) => {
                  setShowTemplatePanel(false)
                  handleBuildGraph(prompt, 'saas')
                }}
                onClose={() => setShowTemplatePanel(false)}
              />
            </div>
          ) : (
            <>
              <div className="px-2 pt-2">
                <button
                  onClick={() => setShowTemplatePanel(true)}
                  className="w-full py-1.5 text-[10px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded border border-indigo-500/30 transition-colors"
                >
                  🏗 SaaS Templates
                </button>
              </div>
              <FileTreePanel
            files={currentFiles}
            activeFile={activeFile}
            dirtyFiles={dirtyFiles}
            versions={versions}
            onFileSelect={setActiveFile}
            onRestoreVersion={handleRestoreVersion}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />
          <ScaffoldPanel
            plan={currentPlan}
            isGenerating={isGenerating}
            onScaffold={handleScaffold}
          />
          <HealthPanel
            files={currentFiles}
            isGenerating={isGenerating}
          />
          <MarketplacePanel />
          <BuildTimelinePanel
            runs={buildRuns}
            activeStepId={activeStepId}
            isReplaying={isReplaying}
            onReplayStep={handleReplayStep}
            onBranchFromStep={handleBranchFromStep}
            onClearRuns={handleClearRuns}
          />
          <ModelSettingsPanel
            localAIMode={localAIMode}
            onLocalAIModeChange={setLocalAIMode}
          />
          {/* AI Improve Panel */}
          <div className="border-t border-border/30">
            <button
              onClick={() => setShowImprovePanel(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">✨ AI Improve</span>
              <span className="text-[9px] opacity-50">{showImprovePanel ? '▲' : '▼'}</span>
            </button>
            {showImprovePanel && (
              <ImprovePanel
                activeFile={activeFile}
                fileContent={currentFiles[activeFile] ?? ''}
                onFileUpdate={(path, content) => {
                  setFiles(prev => ({ ...prev, [path]: content }))
                  setEditedFiles(prev => { const n = { ...prev }; delete n[path]; return n })
                  setDirtyFiles(prev => { const n = new Set(prev); n.delete(path); return n })
                }}
              />
            )}
          </div>
          {/* AI UI Designer */}
          <UIDesignerPanel
            files={currentFiles}
            onFilesUpdate={(updatedFiles, description) => {
              setFiles(updatedFiles)
              setEditedFiles({})
              setDirtyFiles(new Set())
              setChatHistory(prev => [...prev, { role: 'assistant', content: description, timestamp: new Date().toISOString(), agent: 'builder' as AgentType }])
            }}
          />
          {/* Version History */}
          {projectId && (
            <VersionHistoryPanel
              projectId={projectId}
              files={currentFiles}
              onRestore={(restoredFiles, commit) => {
                setFiles(restoredFiles)
                setEditedFiles({})
                setDirtyFiles(new Set())
                const entry = restoredFiles['index.html'] ? 'index.html' : Object.keys(restoredFiles)[0] ?? ''
                setActiveFile(entry)
                setChatHistory(prev => [...prev, { role: 'assistant', content: `Restored to v${commit.versionNum}: ${commit.message}`, timestamp: new Date().toISOString() }])
              }}
            />
          )}
          {/* Prompt History */}
          <PromptHistoryPanel
            projectId={projectId}
            onRestoreVersion={handleRestoreVersion}
            onReusePrompt={(prompt) => handlePromptSubmit(prompt)}
            onForkFromPrompt={(prompt) => {
              // Start a new project from this prompt
              setProjectId(null)
              projectIdRef.current = null
              setProjectName('Untitled Project')
              setFiles({})
              setEditedFiles({})
              setDirtyFiles(new Set())
              setVersions([])
              handlePromptSubmit(prompt)
            }}
          />
          {/* Feature Installer */}
          <FeatureInstallerPanel
            files={currentFiles}
            projectName={projectName}
            onFilesUpdate={(updatedFiles, description) => {
              setFiles(updatedFiles)
              setEditedFiles({})
              setDirtyFiles(new Set())
              setChatHistory(prev => [...prev, { role: 'assistant', content: description, timestamp: new Date().toISOString(), agent: 'builder' as AgentType }])
            }}
          />
            </>
          )}
        </div>

        <CodeEditorPanel
          filename={activeFile}
          content={currentFiles[activeFile] ?? ''}
          isDirty={dirtyFiles.has(activeFile)}
          isGenerating={isGenerating}
          onEdit={(content: string) => handleFileEdit(activeFile, content)}
          onSave={() => handleSaveFile(activeFile)}
        />

        <div className="flex flex-col w-[420px] shrink-0 border-l border-border/50 overflow-hidden">
          {showGraph && codebaseGraph && (
            <div className="shrink-0 border-b border-border/50 max-h-72 overflow-y-auto bg-card/20">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-card/50">
                <span className="text-xs font-medium">Codebase Intelligence</span>
                <button onClick={() => setShowGraph(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <CodebaseGraphPanel graph={codebaseGraph} />
            </div>
          )}

          <ErrorBoundary label="Preview" compact>
            <PreviewPanel
              files={currentFiles}
              entryFile={entryFile}
              isGenerating={isGenerating}
              onDownloadZip={hasFiles ? handleDownloadZip : undefined}
              onAutoFix={handleAutoFix}
            />
          </ErrorBoundary>

          {showPipeline && pipelineSteps.length > 0 && (
            <div className="shrink-0 border-t border-border/50 p-2 max-h-56 overflow-y-auto">
              <PipelineLog steps={pipelineSteps} isRunning={isGenerating} />
            </div>
          )}

          {showGraphViz && graphNodes.length > 0 && (
            <div className="shrink-0 border-b border-border/50 max-h-64 overflow-y-auto">
              <BuildGraphViz nodes={graphNodes} />
            </div>
          )}

          {showActivityFeed && (
            <div className="shrink-0 border-b border-border/50 max-h-56 overflow-y-auto">
              <AgentActivityFeed
                events={agentEvents}
                isRunning={isGenerating}
              />
            </div>
          )}

          {/* Streaming generation progress */}
          {(isStreaming || streamSteps.length > 0) && (
            <div className="shrink-0 border-b border-border/50 p-2 space-y-2">
              <GenerationProgress
                steps={streamSteps}
                isStreaming={isStreaming}
                fileCount={streamFileCount}
              />
              <AIThinkingPanel events={thinkingEvents} isStreaming={isStreaming} />
            </div>
          )}

          {/* Cache hit indicator */}
          {lastCacheHit && !isGenerating && (
            <div className="shrink-0 px-3 py-1.5 border-b border-border/30 flex items-center gap-2 bg-green-500/5">
              <CacheIndicator cacheHit cacheLevel={lastCacheHit.level} cacheSimilarity={lastCacheHit.similarity} />
              <span className="text-xs text-muted-foreground">Result served from cache — no credits used</span>
            </div>
          )}

          <PromptPanel
            isGenerating={isGenerating}
            hasFiles={hasFiles}
            autonomousMode={autonomousMode}
            chatHistory={chatHistory}
            generationStatus={generationStatus}
            onGenerate={handlePromptSubmit}
            onCancel={() => { abortControllerRef.current?.abort(); setIsGenerating(false); setIsStreaming(false); setGenerationStatus('') }}
          />
          {/* ⌘K trigger button */}
          {hasFiles && (
            <div className="shrink-0 border-t border-border/30 px-3 py-1.5 space-y-1.5">
              <button
                onClick={() => setShowAutonomousModal(true)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-xs text-violet-300 transition-colors"
              >
                <span className="flex items-center gap-2">⚡ Autonomous Build</span>
                <span className="text-[10px] opacity-60">20 cr</span>
              </button>
              <button
                onClick={() => setCommandBarOpen(true)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/30 text-xs text-muted-foreground transition-colors"
              >
                <span className="flex items-center gap-2">⚡ AI Commands</span>
                <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/50 text-[10px] font-mono">⌘K</kbd>
              </button>
            </div>
          )}
        </div>
      </div>

      <ProjectPlanModal
        open={planModalOpen}
        plan={currentPlan}
        isLoading={isPlanLoading}
        onApprove={handlePlanApprove}
        onRegenerate={() => fetchPlan(pendingPromptRef.current)}
        onClose={() => setPlanModalOpen(false)}
      />

      {/* ⌘K Command Bar overlay */}
      <CommandBar
        files={currentFiles}
        onFilesUpdate={handleCommandResult}
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
      />

      {/* Publish Dialog */}
      <PublishDialog
        open={showPublishDialog}
        projectName={projectName}
        projectId={projectId}
        onPublish={(isPublic) => {
          if (isPublic) handlePublishToGallery()
          else handleSaveToHub()
          setShowPublishDialog(false)
        }}
        onClose={() => setShowPublishDialog(false)}
      />

      {/* Upgrade Modal — shown when credits are insufficient */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Autonomous Build Modal */}
      <AutonomousBuildModal
        open={showAutonomousModal}
        isRunning={isGenerating && autonomousSteps.length > 0}
        steps={autonomousSteps.length > 0 ? autonomousSteps : undefined}
        onStart={(idea) => {
          setAutonomousMode(true)
          handleAutonomousBuild(idea)
        }}
        onClose={() => setShowAutonomousModal(false)}
      />
    </div>
  )
}
