import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { checkOllamaInstalled } from '@/lib/ai-engine/free-stack/ollama-manager'
import { MODEL_CATALOG } from '@/lib/ai-engine/free-stack/model-catalog'

// POST /api/models/install — triggers ollama pull for a model
// Returns a streaming response with pull progress
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { modelId } = await req.json() as { modelId: string }
  if (!modelId) return NextResponse.json({ error: 'modelId required' }, { status: 400 })

  const modelInfo = MODEL_CATALOG.find(m => m.id === modelId || m.ollamaTag === modelId)
  const ollamaTag = modelInfo?.ollamaTag ?? `${modelId}:latest`

  const ollamaAvailable = await checkOllamaInstalled()
  if (!ollamaAvailable) {
    return NextResponse.json({
      error: 'Ollama is not running. Install from https://ollama.ai and run: ollama serve',
    }, { status: 503 })
  }

  // Stream the pull progress back to the client
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const base = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
        const res = await fetch(`${base}/api/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: ollamaTag, stream: true }),
        })
        if (!res.ok || !res.body) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: res.statusText })}\n\n`))
          controller.close()
          return
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.trim()) continue
            controller.enqueue(encoder.encode(`data: ${line}\n\n`))
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'success', model: ollamaTag })}\n\n`))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Pull failed'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
