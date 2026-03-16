import { NextResponse } from 'next/server'
import { detectAvailableRuntimes } from '@/lib/ai-engine/free-stack/free-router'
import { listLocalModels, listLMStudioModels } from '@/lib/ai-engine/free-stack/ollama-manager'
import { serverModelMetrics } from '@/lib/ai-engine/free-stack/model-metrics'
import { MODEL_CATALOG } from '@/lib/ai-engine/free-stack/model-catalog'

// GET /api/models/status — returns runtime availability, installed models, and metrics
export async function GET() {
  const [runtimes, ollamaModels, lmstudioModels] = await Promise.all([
    detectAvailableRuntimes(),
    listLocalModels(),
    listLMStudioModels(),
  ])

  return NextResponse.json({
    runtimes,
    installedModels: {
      ollama: ollamaModels.map(m => m.name),
      lmstudio: lmstudioModels,
    },
    catalog: MODEL_CATALOG,
    metrics: serverModelMetrics.getAll(),
  })
}
