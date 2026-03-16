import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/check-admin'
import { logAdminAction } from '@/lib/admin/audit-log'
import { db } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes
  const admin = adminOrRes
  const { id } = await params

  const body = await req.json()
  const { action, credits, role } = body

  if (action === 'suspend') {
    await db.user.update({ where: { id }, data: { role: 'suspended' } })
    await logAdminAction({ adminId: admin.id, action: 'user_suspend', targetId: id, targetType: 'user' })
    return NextResponse.json({ success: true })
  }

  if (action === 'unsuspend') {
    await db.user.update({ where: { id }, data: { role: 'user' } })
    await logAdminAction({ adminId: admin.id, action: 'user_unsuspend', targetId: id, targetType: 'user' })
    return NextResponse.json({ success: true })
  }

  if (action === 'set_credits' && typeof credits === 'number') {
    await db.subscription.update({ where: { userId: id }, data: { creditsRemaining: credits } })
    await logAdminAction({ adminId: admin.id, action: 'credit_update', targetId: id, targetType: 'user', details: { credits } })
    return NextResponse.json({ success: true })
  }

  if (action === 'set_role' && role) {
    await db.user.update({ where: { id }, data: { role } })
    await logAdminAction({ adminId: admin.id, action: 'role_change', targetId: id, targetType: 'user', details: { role } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes
  const admin = adminOrRes
  const { id } = await params

  await db.user.delete({ where: { id } })
  await logAdminAction({ adminId: admin.id, action: 'user_delete', targetId: id, targetType: 'user' })
  return NextResponse.json({ success: true })
}
