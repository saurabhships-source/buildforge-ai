import { NextRequest, NextResponse } from 'next/server'
import { scanSystem } from '@/lib/services/self-improve/system-monitor'
import { detectOpportunities } from '@/lib/services/self-improve/opportunity-detector'

export async function GET() {
  try {
    const systemReport = await scanSystem()
    const opportunityReport = detectOpportunities(systemReport)
    return NextResponse.json({ systemReport, opportunityReport })
  } catch (err) {
    console.error('[system/opportunities]', err)
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { systemReport?: Parameters<typeof detectOpportunities>[0] }
    const systemReport = body.systemReport ?? await scanSystem()
    const opportunityReport = detectOpportunities(systemReport)
    return NextResponse.json(opportunityReport)
  } catch (err) {
    console.error('[system/opportunities]', err)
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}
