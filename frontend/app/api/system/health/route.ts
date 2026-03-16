import { NextResponse } from 'next/server'
import { checkSystemHealth } from '@/lib/services/system/health-check'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await checkSystemHealth()
    return NextResponse.json({ success: true, data: report })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Health check failed' },
      { status: 500 }
    )
  }
}
