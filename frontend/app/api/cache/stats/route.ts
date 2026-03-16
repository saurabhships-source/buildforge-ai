import { NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/cache/cache-store'
import { safeGetUserId } from '@/lib/safe-auth'

// GET /api/cache/stats — returns cache metrics (admin only)
export async function GET() {
  const userId = await safeGetUserId()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const stats = getCacheStats()
  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
