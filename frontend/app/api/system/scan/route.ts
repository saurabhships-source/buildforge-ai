import { NextResponse } from 'next/server'
import { scanSystem } from '@/lib/services/self-improve/system-monitor'

export async function GET() {
  try {
    const report = await scanSystem()
    return NextResponse.json(report)
  } catch (err) {
    console.error('[system/scan]', err)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
