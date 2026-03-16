import { ok } from '@/lib/core/api-helpers'
import { activityFeed } from '@/lib/services/activity-feed'
import { SEED_GALLERY_PROJECTS, sortProjects } from '@/lib/gallery-service'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  return ok({
    recentActivity: activityFeed.getRecent(limit),
    recentApps: sortProjects(SEED_GALLERY_PROJECTS, 'newest').slice(0, 12),
    mostRemixed: sortProjects(SEED_GALLERY_PROJECTS, 'most_remixed').slice(0, 6),
    topCreators: activityFeed.topCreators(10),
  })
}
