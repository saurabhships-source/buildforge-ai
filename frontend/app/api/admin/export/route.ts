import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/check-admin'
import { logAdminAction } from '@/lib/admin/audit-log'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes
  const admin = adminOrRes

  const { searchParams } = new URL(req.url)
  const dataset = searchParams.get('dataset') ?? 'users' // users|payments|projects|analytics
  const format = searchParams.get('format') ?? 'csv'     // csv|json

  let rows: Record<string, unknown>[] = []
  let filename = `buildforge-${dataset}`

  if (dataset === 'users') {
    const users = await db.user.findMany({ include: { subscription: true, _count: { select: { projects: true } } } })
    rows = users.map(u => ({
      id: u.id, email: u.email, name: u.name, role: u.role,
      plan: u.subscription?.plan ?? 'free',
      credits: u.subscription?.creditsRemaining ?? 0,
      projects: u._count.projects,
      createdAt: u.createdAt.toISOString(),
    }))
  } else if (dataset === 'projects') {
    const projects = await db.project.findMany({ include: { user: { select: { email: true } }, _count: { select: { versions: true } } } })
    rows = projects.map(p => ({
      id: p.id, name: p.name, appType: p.appType, framework: p.framework,
      userEmail: p.user.email, versions: p._count.versions,
      deployUrl: p.deployUrl ?? '', createdAt: p.createdAt.toISOString(),
    }))
  } else if (dataset === 'payments') {
    const subs = await db.subscription.findMany({ include: { user: { select: { email: true, name: true } } } })
    rows = subs.map(s => ({
      id: s.id, userEmail: s.user.email, userName: s.user.name,
      plan: s.plan, creditsRemaining: s.creditsRemaining, creditsTotal: s.creditsTotal,
      stripeCustomerId: s.stripeCustomerId ?? '', cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      createdAt: s.createdAt.toISOString(),
    }))
  } else if (dataset === 'analytics') {
    const versions = await db.version.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 })
    rows = versions.map(v => ({
      id: v.id, projectId: v.projectId, versionNum: v.versionNum,
      model: v.model, agent: v.agent, creditsUsed: v.creditsUsed,
      createdAt: v.createdAt.toISOString(),
    }))
  }

  await logAdminAction({ adminId: admin.id, action: 'data_export', details: { dataset, format, rows: rows.length } })

  if (format === 'json') {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${filename}.json"` },
    })
  }

  // CSV
  if (rows.length === 0) return new NextResponse('No data', { status: 204 })
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n')

  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}.csv"` },
  })
}
