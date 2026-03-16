import { NextResponse } from 'next/server'
import { aiCache } from '@/lib/cache/ai-cache'
import { safeGetUserId } from '@/lib/safe-auth'

// POST /api/cache/invalidate — invalidate a specific prompt cache entry
export async function POST(req: Request) {
  const userId = await safeGetUserId()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { prompt, appType } = await req.json() as { prompt?: string; appType?: string }
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

  await aiCache.invalidate(prompt, appType ?? 'website')
  return NextResponse.json({ success: true, message: 'Cache entry invalidated' })
}
