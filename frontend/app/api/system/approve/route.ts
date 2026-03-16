import { NextRequest, NextResponse } from 'next/server'
import { patchManager } from '@/lib/services/self-improve/patch-manager'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { id: string; action: 'approve' | 'reject'; reason?: string }
    const { id, action, reason } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 })
    }

    if (action === 'approve') {
      const proposal = patchManager.approvePatch(id)
      if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
      return NextResponse.json({ proposal, message: 'Patch approved — ready to apply' })
    }

    if (action === 'reject') {
      const proposal = patchManager.rejectPatch(id, reason)
      if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
      return NextResponse.json({ proposal, message: 'Patch rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[system/approve]', err)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}

/** Apply an approved patch */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as { id: string }
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const result = patchManager.applyPatch(body.id)
    if (!result) {
      return NextResponse.json({ error: 'Proposal not found or not approved' }, { status: 404 })
    }

    return NextResponse.json({
      files: result.files,
      proposal: result.proposal,
      message: `Patch applied — ${Object.keys(result.files).length} files updated`,
    })
  } catch (err) {
    console.error('[system/approve PUT]', err)
    return NextResponse.json({ error: 'Apply failed' }, { status: 500 })
  }
}
