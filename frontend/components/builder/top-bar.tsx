'use client'

import { useState } from 'react'
import { Sparkles, Github, Rocket, ExternalLink, ChevronDown, Zap, Bot, Download, Cpu, GitGraph, Globe2, BookMarked, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ProjectSwitcher } from '@/components/builder/project-switcher'
import type { AppType, ModelId, AgentType } from '@/lib/builder-types'

const APP_TYPES: { value: AppType; label: string; emoji: string }[] = [
  { value: 'website', label: 'Website', emoji: '🌐' },
  { value: 'tool', label: 'Tool', emoji: '🔧' },
  { value: 'saas', label: 'SaaS', emoji: '🚀' },
  { value: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { value: 'ai_app', label: 'AI App', emoji: '🤖' },
  { value: 'crm', label: 'CRM', emoji: '👥' },
  { value: 'internal_tool', label: 'Internal Tool', emoji: '⚙️' },
]

const MODELS: { value: ModelId; label: string; badge: string }[] = [
  { value: 'gpt4o', label: 'GPT-4o', badge: 'Pro' },
  { value: 'gpt4o_mini', label: 'GPT-4o Mini', badge: 'Fast' },
  { value: 'gemini_flash', label: 'Gemini Flash', badge: 'Free' },
  { value: 'gemini_pro', label: 'Gemini Pro', badge: 'Free' },
  { value: 'groq_llama3', label: 'Llama 3 (Groq)', badge: 'Free' },
  { value: 'groq_mixtral', label: 'Mixtral (Groq)', badge: 'Free' },
  { value: 'deepseek_coder', label: 'DeepSeek Coder', badge: 'Local' },
  { value: 'codellama', label: 'Code Llama', badge: 'Local' },
  { value: 'llama3', label: 'Llama 3', badge: 'Local' },
  { value: 'mistral', label: 'Mistral 7B', badge: 'Local' },
  { value: 'mixtral', label: 'Mixtral 8x7B', badge: 'Local' },
  { value: 'phi3', label: 'Phi-3 Mini', badge: 'Local' },
  { value: 'gemma', label: 'Gemma 2B', badge: 'Local' },
  { value: 'qwen2', label: 'Qwen2', badge: 'Local' },
  { value: 'ollama', label: 'Ollama (Auto)', badge: 'Local' },
  { value: 'lmstudio', label: 'LM Studio', badge: 'Local' },
]

const AGENT_COLORS: Record<string, string> = {
  builder: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  refactor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  ui: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  ux: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  deploy: 'bg-green-500/10 text-green-600 border-green-500/20',
  debug: 'bg-red-500/10 text-red-600 border-red-500/20',
  security: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  github: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

interface Props {
  projectName: string
  projectId: string | null
  appType: AppType
  selectedModel: ModelId
  agentUsed: AgentType | null
  isGenerating: boolean
  hasFiles: boolean
  deployUrl: string | null
  credits: number
  autonomousMode: boolean
  localAIMode: boolean
  buildGraphMode: 'fast' | 'full' | 'maintenance' | 'saas'
  isImproving: boolean
  onAppTypeChange: (t: AppType) => void
  onModelChange: (m: ModelId) => void
  onDeploy: (provider: 'vercel' | 'netlify') => void
  onGitHubExport: (repoName: string, isPrivate: boolean) => void
  onGitHubImport: (repoUrl: string) => void
  onAutonomousModeChange: (v: boolean) => void
  onLocalAIModeChange: (v: boolean) => void
  onAnalyzeCodebase?: () => void
  onBuildGraphModeChange: (m: 'fast' | 'full' | 'maintenance' | 'saas') => void
  onRunBuildGraph: () => void
  onImprove: () => void
  onSaveToHub?: () => void
  onPublishToGallery?: () => void
  hubRepoId?: string | null
  isPublic?: boolean
  onToggleVisibility?: (pub: boolean) => void
  onProjectChange?: (projectId: string, projectName: string) => void
  onProjectNameChange?: (name: string) => void
}

export function BuilderTopBar({
  projectName, projectId, appType, selectedModel, agentUsed, isGenerating,
  hasFiles, deployUrl, credits, autonomousMode, localAIMode,
  buildGraphMode, isImproving,
  onAppTypeChange, onModelChange, onDeploy, onGitHubExport,
  onGitHubImport, onAutonomousModeChange, onLocalAIModeChange, onAnalyzeCodebase,
  onBuildGraphModeChange, onRunBuildGraph, onImprove, onSaveToHub, hubRepoId,
  onPublishToGallery, isPublic, onToggleVisibility,
  onProjectChange, onProjectNameChange,
}: Props) {
  const [githubExportOpen, setGithubExportOpen] = useState(false)
  const [githubImportOpen, setGithubImportOpen] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [importUrl, setImportUrl] = useState('')

  const currentAppType = APP_TYPES.find(t => t.value === appType)
  const currentModel = MODELS.find(m => m.value === selectedModel)

  return (
    <>
      <div className="flex items-center gap-2 px-3 h-12 border-b border-border/50 bg-card/50 shrink-0 overflow-x-auto">
        {/* Logo + Project Switcher */}
        <div className="flex items-center gap-1.5 mr-1 shrink-0">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          {onProjectChange ? (
            <ProjectSwitcher
              currentProjectId={projectId}
              currentProjectName={projectName}
              onProjectChange={onProjectChange}
              onProjectNameChange={onProjectNameChange}
            />
          ) : (
            <span className="text-sm font-semibold truncate max-w-[120px]">{projectName}</span>
          )}
        </div>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* App Type */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0">
              <span>{currentAppType?.emoji}</span>
              <span className="hidden sm:inline">{currentAppType?.label}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {APP_TYPES.map(t => (
              <DropdownMenuItem key={t.value} onClick={() => onAppTypeChange(t.value)}>
                <span className="mr-2">{t.emoji}</span>{t.label}
                {t.value === appType && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Model */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0">
              <Bot className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{currentModel?.label}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {MODELS.map(m => (
              <DropdownMenuItem key={m.value} onClick={() => onModelChange(m.value)}>
                <span className="flex-1">{m.label}</span>
                <Badge variant="outline" className="ml-2 text-[10px]">{m.badge}</Badge>
                {m.value === selectedModel && <span className="ml-2 text-primary">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Agent badge */}
        {agentUsed && (
          <Badge variant="outline" className={`text-[10px] h-5 shrink-0 ${AGENT_COLORS[agentUsed] ?? ''}`}>
            {agentUsed}Agent
          </Badge>
        )}

        <div className="flex-1" />

        {/* Local AI toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground hidden md:inline">Local AI</span>
          <Switch
            checked={localAIMode}
            onCheckedChange={onLocalAIModeChange}
            className="h-4 w-7 data-[state=checked]:bg-amber-500"
          />
        </div>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Autonomous Mode toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground hidden md:inline">Auto</span>
          <Switch
            checked={autonomousMode}
            onCheckedChange={onAutonomousModeChange}
            className="h-4 w-7 data-[state=checked]:bg-purple-500"
          />
        </div>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Credits */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground">{credits === -1 ? '…' : credits === Infinity ? '∞' : credits}</span>
        </div>

        <div className="h-4 w-px bg-border shrink-0" />

        {deployUrl && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 shrink-0" asChild>
            <a href={deployUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Live
            </a>
          </Button>
        )}

        {/* Analyze Codebase */}
        {onAnalyzeCodebase && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 shrink-0"
            onClick={onAnalyzeCodebase}
            disabled={isGenerating}
            title="Codebase Intelligence Graph"
          >
            <GitGraph className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Analyze</span>
          </Button>
        )}

        {/* Build Graph */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 shrink-0"
              disabled={isGenerating || isImproving}
              title="Multi-agent build graph"
            >
              <Zap className="h-3.5 w-3.5 text-violet-500" />
              <span className="hidden sm:inline">Graph</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { onBuildGraphModeChange('fast'); onRunBuildGraph() }}>
              ⚡ Fast Pipeline <span className="ml-auto text-[10px] text-muted-foreground">10 credits</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onBuildGraphModeChange('full'); onRunBuildGraph() }}>
              🏗️ Full Pipeline <span className="ml-auto text-[10px] text-muted-foreground">20 credits</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { onBuildGraphModeChange('saas'); onRunBuildGraph() }}>
              🚀 SaaS Pipeline <span className="ml-auto text-[10px] text-muted-foreground">20 credits</span>
            </DropdownMenuItem>
            {hasFiles && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { onBuildGraphModeChange('maintenance'); onRunBuildGraph() }}>
                  🔧 Maintenance <span className="ml-auto text-[10px] text-muted-foreground">2 credits</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onImprove} disabled={isImproving}>
                  🔄 Auto-Improve <span className="ml-auto text-[10px] text-muted-foreground">2 credits</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* GitHub Import */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 shrink-0"
          onClick={() => setGithubImportOpen(true)}
          disabled={isGenerating}
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Import</span>
        </Button>

        {/* GitHub Export */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 shrink-0"
          disabled={!hasFiles || isGenerating}
          onClick={() => { setRepoName(projectName.toLowerCase().replace(/\s+/g, '-')); setGithubExportOpen(true) }}
        >
          <Github className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>

        {/* Hub */}
        {onSaveToHub && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 shrink-0"
                disabled={!hasFiles || isGenerating}
                title="AI Project Hub"
              >
                <Globe2 className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Hub</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSaveToHub}>
                <BookMarked className="h-3.5 w-3.5 mr-2" />
                {hubRepoId ? 'Update in Hub' : 'Save to Hub'}
              </DropdownMenuItem>
              {hubRepoId && (
                <DropdownMenuItem asChild>
                  <a href={`/hub/${hubRepoId}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    View in Hub
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/hub" target="_blank" rel="noopener noreferrer">
                  <Globe2 className="h-3.5 w-3.5 mr-2" />
                  Browse Hub
                </a>
              </DropdownMenuItem>
              {onPublishToGallery && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onPublishToGallery}>
                    <Share2 className="h-3.5 w-3.5 mr-2 text-primary" />
                    {isPublic ? 'Update Gallery Listing' : 'Publish to Gallery'}
                  </DropdownMenuItem>
                  {isPublic && onToggleVisibility && (
                    <DropdownMenuItem onClick={() => onToggleVisibility(false)}>
                      <Globe2 className="h-3.5 w-3.5 mr-2" />
                      Make Private
                    </DropdownMenuItem>
                  )}
                  {hubRepoId && isPublic && (
                    <DropdownMenuItem asChild>
                      <a href={`/apps/${hubRepoId}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        View in Gallery
                      </a>
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Deploy */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-7 text-xs gap-1 shrink-0" disabled={!hasFiles || isGenerating}>
              <Rocket className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Deploy</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDeploy('vercel')}>▲ Deploy to Vercel</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDeploy('netlify')}>◆ Deploy to Netlify</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* GitHub Export Dialog */}
      <Dialog open={githubExportOpen} onOpenChange={setGithubExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" /> Export to GitHub
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repository name</Label>
              <Input id="repo-name" value={repoName} onChange={e => setRepoName(e.target.value)} placeholder="my-project" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="private-toggle">Private repository</Label>
              <Switch id="private-toggle" checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGithubExportOpen(false)}>Cancel</Button>
            <Button onClick={() => { onGitHubExport(repoName, isPrivate); setGithubExportOpen(false) }} disabled={!repoName.trim()}>
              <Github className="h-4 w-4 mr-2" /> Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GitHub Import Dialog */}
      <Dialog open={githubImportOpen} onOpenChange={setGithubImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" /> Import from GitHub
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="import-url">Repository URL</Label>
              <Input
                id="import-url"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The autonomous pipeline will analyze and improve the imported project. Costs 8 credits.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGithubImportOpen(false)}>Cancel</Button>
            <Button
              onClick={() => { onGitHubImport(importUrl); setGithubImportOpen(false); setImportUrl('') }}
              disabled={!importUrl.trim()}
            >
              <Download className="h-4 w-4 mr-2" /> Import & Improve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
