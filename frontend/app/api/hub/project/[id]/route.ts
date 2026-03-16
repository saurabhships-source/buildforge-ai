import { NextResponse } from 'next/server'

// GET /api/hub/project/[id] — returns a single project by id
// For seed projects, returns the seed data. For user repos, the client
// reads from localStorage via the repo-service directly.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Seed projects are served from here; user repos are client-side only
  return NextResponse.json({ id, message: 'Use client-side repoService for user repos' }, { status: 200 })
}
