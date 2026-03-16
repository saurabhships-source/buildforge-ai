import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/check-admin'
import { logAdminAction } from '@/lib/admin/audit-log'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  try {
    const where = status ? { status } : {}
    const issues = await (db as any).issue.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 200,
    })
    return NextResponse.json({ issues })
  } catch {
    return NextResponse.json({ issues: [] })
  }
}

export async function POST(req: Request) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes
  const admin = adminOrRes

  const body = await req.json()
  const { type, title, description, severity, userId, projectId, metadata } = body

  const issue = await (db as any).issue.create({
    data: { type, title, description, severity: severity ?? 'medium', userId, projectId, metadata: metadata ?? {} },
  })

  await logAdminAction({ adminId: admin.id, action: 'issue_create', targetId: issue.id, details: { type, title } })
  return NextResponse.json({ issue })
}

export async function PATCH(req: Request) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes
  const admin = adminOrRes

  const { id, status } = await req.json()
  const issue = await (db as any).issue.update({
    where: { id },
    data: {
      status,
      resolvedBy: status === 'resolved' ? admin.id : undefined,
      resolvedAt: status === 'resolved' ? new Date() : undefined,
    },
  })

  if (status === 'resolved') {
    await logAdminAction({ adminId: admin.id, action: 'issue_resolve', targetId: id })
  }

  return NextResponse.json({ issue })
}
