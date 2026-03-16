import { NextResponse } from 'next/server'
import { SEED_GALLERY_PROJECTS, sortProjects, filterByTag, type GallerySort, type GalleryTag } from '@/lib/gallery-service'

// GET /api/apps — public gallery feed
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sort = (searchParams.get('sort') ?? 'trending') as GallerySort
  const tag = (searchParams.get('tag') ?? 'all') as GalleryTag
  const q = searchParams.get('q')?.toLowerCase() ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '24', 10)

  let projects = filterByTag(SEED_GALLERY_PROJECTS, tag)

  if (q) {
    projects = projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    )
  }

  projects = sortProjects(projects, sort)

  const total = projects.length
  const start = (page - 1) * limit
  const paginated = projects.slice(start, start + limit)

  return NextResponse.json({
    projects: paginated,
    total,
    page,
    pages: Math.ceil(total / limit),
  }, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  })
}
