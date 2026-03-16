import { NextResponse } from 'next/server'
import { SEED_GALLERY_PROJECTS } from '@/lib/gallery-service'

// GET /api/apps/[projectId] — project detail
// POST /api/apps/[projectId] — increment view count
export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const project = SEED_GALLERY_PROJECTS.find(p => p.id === projectId || p.shareSlug === projectId)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ project })
}

export async function POST(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  // In production: increment view count in DB
  return NextResponse.json({ success: true, projectId, action: 'view_incremented' })
}
