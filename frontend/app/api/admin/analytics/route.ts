import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/check-admin'
import { db } from '@/lib/db'

export async function GET() {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes

  try {
    const [totalUsers, totalProjects, totalVersions, recentJobs] = await Promise.all([
      db.user.count(),
      db.project.count(),
      db.version.count(),
      (db as any).job?.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []) ?? [],
    ])

    const activeUsers = await db.user.count({
      where: { projects: { some: { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
    })

    const deployments = await db.project.count({ where: { deployUrl: { not: null } } })
    const creditsUsed = await db.version.aggregate({ _sum: { creditsUsed: true } })

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalProjects,
      totalVersions,
      deployments,
      creditsUsed: creditsUsed._sum.creditsUsed ?? 0,
      recentJobs,
    })
  } catch {
    return NextResponse.json({
      totalUsers: 0, activeUsers: 0, totalProjects: 0,
      totalVersions: 0, deployments: 0, creditsUsed: 0, recentJobs: [],
    })
  }
}
