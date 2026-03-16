import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/check-admin'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const action = searchParams.get('action') ?? undefined
  const limit = 100

  try {
    const where = action ? { action } : {}
    const [logs, total] = await Promise.all([
      (db as any).adminLog.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      (db as any).adminLog.count({ where }),
    ])
    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ logs: [], total: 0, page, pages: 0 })
  }
}
