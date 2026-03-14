'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { 
  Send, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles, 
  History, 
  Trash2,
  Globe,
  Wrench,
  Code2,
  Play,
  Download,
  Maximize2,
  X,
  RefreshCw,
  Zap,
  Wand2,
  Rocket,
  ArrowRight,
  Clock,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

type BuildType = 'website' | 'tool' | 'software'

interface HistoryItem {
  id: string
  prompt: string
  response: string
  type: BuildType
  timestamp: Date
}

const BUILD_TYPES = [
  { 
    value: 'website' as BuildType, 
    label: 'Website', 
    icon: Globe,
    description: 'Landing pages, portfolios, marketing sites',
    placeholder: 'Create a modern SaaS landing page for an AI writing assistant with hero section, features, pricing, and testimonials...',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
    borderGradient: 'from-blue-500/50 to-cyan-500/50'
  },
  { 
    value: 'tool' as BuildType, 
    label: 'Tool', 
    icon: Wrench,
    description: 'Calculators, converters, generators',
    placeholder: 'Build a mortgage calculator with monthly payment breakdown, amortization schedule, and comparison charts...',
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-500/10 to-orange-500/10',
    borderGradient: 'from-amber-500/50 to-orange-500/50'
  },
  { 
    value: 'software' as BuildType, 
    label: 'Software', 
    icon: Code2,
    description: 'Full apps, dashboards, admin panels',
    placeholder: 'Create a task management app with projects, due dates, priority levels, and drag-and-drop organization...',
    gradient: 'from-violet-500 to-purple-500',
    bgGradient: 'from-violet-500/10 to-purple-500/10',
    borderGradient: 'from-violet-500/50 to-purple-500/50'
  },
]

const QUICK_TEMPLATES = [
  {
    title: 'SaaS Landing Page',
    description: 'AI email assistant website',
    type: 'website' as BuildType,
    prompt: 'Create a modern SaaS landing page for an AI-powered email assistant. Include a gradient hero with headline, features grid with icons, pricing table with 3 tiers, testimonials carousel, and a footer with newsletter signup.',
    icon: Rocket,
    color: 'text-blue-500'
  },
  {
    title: 'Unit Converter',
    description: 'Multi-unit conversion tool',
    type: 'tool' as BuildType,
    prompt: 'Build a unit converter tool that converts between length, weight, temperature, and volume units. Include dropdown selectors for unit types, input fields, instant conversion, and a clean modern interface.',
    icon: Zap,
    color: 'text-amber-500'
  },
  {
    title: 'Kanban Board',
    description: 'Task management app',
    type: 'software' as BuildType,
    prompt: 'Create a Kanban board app with columns for To Do, In Progress, and Done. Include ability to add tasks with title and description, drag and drop between columns, delete tasks, and save state to localStorage.',
    icon: Star,
    color: 'text-violet-500'
  },
]

export default function BuilderPage() {
  const [input, setInput] = useState('')
  const [buildType, setBuildType] = useState<BuildType>('website')
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const buildTypeRef = useRef<BuildType>('website')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    buildTypeRef.current = buildType
  }, [buildType])

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/generate',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          type: buildTypeRef.current,
        },
      }),
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    const lastMessage = messages.filter(m => m.role === 'assistant').pop()
    if (lastMessage?.parts) {
      const text = lastMessage.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text)
        .join('')
      
      let code = text
      const htmlMatch = text.match(/```html\n?([\s\S]*?)```/) || text.match(/```\n?([\s\S]*?)```/)
      if (htmlMatch) {
        code = htmlMatch[1]
      } else if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        code = text
      }
      
      if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
        setGeneratedCode(code.trim())
        setShowPreview(true)
      }
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setMessages([])
    setGeneratedCode('')
    setShowPreview(false)

    sendMessage({ text: input })

    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      prompt: input,
      response: '',
      type: buildType,
      timestamp: new Date(),
    }
    setHistory((prev) => [historyItem, ...prev.slice(0, 9)])
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `buildforge-${buildType}-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadFromHistory = (item: HistoryItem) => {
    setInput(item.prompt)
    setBuildType(item.type)
    if (item.response) {
      setGeneratedCode(item.response)
      setShowPreview(true)
    }
  }

  const clearHistory = () => {
    setHistory([])
  }

  const refreshPreview = () => {
    if (iframeRef.current && generatedCode) {
      iframeRef.current.srcdoc = generatedCode
    }
  }

  const useTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setBuildType(template.type)
    setInput(template.prompt)
  }

  const currentBuildType = BUILD_TYPES.find(t => t.value === buildType)

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-border/50 p-8 mb-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,var(--border)_50%,transparent_51%,transparent_100%)] bg-[length:80px_80px] opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
                <Wand2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20">
                AI-Powered
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              AI Builder Studio
            </h1>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Transform your ideas into production-ready websites, tools, and software. Just describe what you want to create.
            </p>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Credits Available</p>
              <p className="text-2xl font-bold text-primary">{user?.credits || 100}</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Projects Built</p>
              <p className="text-2xl font-bold">{history.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        <div className="space-y-8">
          {/* Build Type Selection */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Choose Your Build Type
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {BUILD_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = buildType === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => setBuildType(type.value)}
                    className={`group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                      isSelected
                        ? `border-transparent bg-gradient-to-br ${type.bgGradient} shadow-lg`
                        : 'border-border/50 bg-card/50 hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    {isSelected && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-5`} />
                    )}
                    <div className="relative">
                      <div className={`mb-4 inline-flex p-3 rounded-xl transition-all duration-300 ${
                        isSelected 
                          ? `bg-gradient-to-br ${type.gradient} shadow-lg` 
                          : 'bg-muted group-hover:bg-primary/10'
                      }`}>
                        <Icon className={`h-6 w-6 transition-colors ${
                          isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-primary'
                        }`} />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{type.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>
                      
                      {isSelected && (
                        <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full bg-gradient-to-br ${type.gradient}`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Input Form */}
          <Card className="border-border/50 shadow-xl shadow-black/5 overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${currentBuildType?.gradient || 'from-primary to-accent'}`} />
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="h-5 w-5 text-primary" />
                Describe Your {currentBuildType?.label}
              </CardTitle>
              <CardDescription>
                Be specific about features, design preferences, and functionality you need.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder={currentBuildType?.placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={5}
                    className="resize-none border-border/50 bg-muted/30 focus:bg-background transition-colors pr-4 text-base leading-relaxed"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    {input.length} / 2000
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-primary" />
                    Uses 1 credit per generation
                  </p>
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isLoading} 
                    size="lg"
                    className={`px-6 bg-gradient-to-r ${currentBuildType?.gradient || 'from-primary to-accent'} hover:opacity-90 transition-opacity shadow-lg`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate {currentBuildType?.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Generated Output */}
          {(generatedCode || isLoading) && (
            <Card className={`border-border/50 shadow-xl shadow-black/5 overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : ''}`}>
              <div className={`h-1 bg-gradient-to-r ${currentBuildType?.gradient || 'from-primary to-accent'}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Play className={`h-5 w-5 bg-gradient-to-r ${currentBuildType?.gradient || 'from-primary to-accent'} bg-clip-text text-transparent`} />
                    {isLoading ? 'Creating Your ' : 'Your '}{currentBuildType?.label}
                  </CardTitle>
                  <CardDescription>
                    {isLoading ? 'AI is building your project...' : 'Preview, copy, or download your creation'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refreshPreview} disabled={!generatedCode} className="hover:bg-primary/10 hover:text-primary hover:border-primary/50">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="hover:bg-primary/10 hover:text-primary hover:border-primary/50">
                    {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy} disabled={!generatedCode} className="hover:bg-primary/10 hover:text-primary hover:border-primary/50">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={!generatedCode} className={`hover:bg-gradient-to-r ${currentBuildType?.gradient} hover:text-white hover:border-transparent`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={isFullscreen ? 'flex-1 overflow-hidden' : ''}>
                <Tabs defaultValue="preview" className="h-full">
                  <TabsList className="mb-4 bg-muted/50 p-1">
                    <TabsTrigger value="preview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Play className="h-4 w-4 mr-2" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Code2 className="h-4 w-4 mr-2" />
                      Code
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className={isFullscreen ? 'h-[calc(100%-60px)]' : 'h-[500px]'}>
                    {isLoading && !generatedCode ? (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/50 bg-gradient-to-br from-muted/30 to-muted/10">
                        <div className="text-center">
                          <div className={`mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br ${currentBuildType?.gradient} p-4 shadow-lg animate-pulse`}>
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                          </div>
                          <p className="text-lg font-medium">Building your {buildType}...</p>
                          <p className="mt-1 text-sm text-muted-foreground">This may take a few seconds</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-full rounded-xl overflow-hidden border border-border/50 shadow-inner">
                        <iframe
                          ref={iframeRef}
                          srcDoc={generatedCode}
                          className="h-full w-full bg-white"
                          sandbox="allow-scripts allow-forms"
                          title="Preview"
                        />
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="code" className={isFullscreen ? 'h-[calc(100%-60px)]' : 'h-[500px]'}>
                    <ScrollArea className="h-full rounded-xl border border-border/50 bg-[#0d1117] p-4">
                      <pre className="text-sm font-mono text-[#c9d1d9]">
                        <code>{generatedCode || 'Generating code...'}</code>
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Streaming Content Display */}
          {isLoading && messages.length > 0 && !generatedCode && (
            <Card className="border-border/50 shadow-xl shadow-black/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${currentBuildType?.gradient}`}>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                  Generating Code...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] rounded-xl bg-[#0d1117] p-4">
                  <pre className="text-sm font-mono text-[#c9d1d9] whitespace-pre-wrap">
                    {messages
                      .filter(m => m.role === 'assistant')
                      .map(m => m.parts?.filter((p): p is { type: 'text'; text: string } => p.type === 'text').map(p => p.text).join('') || '')
                      .join('')}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Templates */}
          <Card className="border-border/50 shadow-xl shadow-black/5 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Rocket className="h-5 w-5 text-primary" />
                Quick Templates
              </CardTitle>
              <CardDescription>Start with a pre-built prompt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {QUICK_TEMPLATES.map((template) => {
                const Icon = template.icon
                return (
                  <button
                    key={template.title}
                    onClick={() => useTemplate(template)}
                    className="w-full group rounded-xl border border-border/50 bg-card/50 p-4 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <Icon className={`h-4 w-4 ${template.color} transition-transform group-hover:scale-110`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm">{template.title}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {template.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* History */}
          <Card className="border-border/50 shadow-xl shadow-black/5 sticky top-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <History className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Recent Builds</CardTitle>
                  <CardDescription className="text-xs">{history.length} projects</CardDescription>
                </div>
              </div>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No builds yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Your generated projects will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-[320px]">
                  <div className="space-y-2">
                    {history.map((item) => {
                      const typeConfig = BUILD_TYPES.find(t => t.value === item.type)
                      const TypeIcon = typeConfig?.icon || Code2
                      return (
                        <button
                          key={item.id}
                          onClick={() => loadFromHistory(item)}
                          className="w-full group rounded-xl border border-border/30 bg-card/30 p-3 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-md bg-gradient-to-br ${typeConfig?.gradient} opacity-80`}>
                              <TypeIcon className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground capitalize">{item.type}</span>
                            <span className="text-[10px] text-muted-foreground/60 ml-auto">
                              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2 leading-relaxed">{item.prompt}</p>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
