import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/check-admin'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const adminOrRes = await requireAdmin()
  if (adminOrRes instanceof NextResponse) return adminOrRes

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50

  try {
    const where = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { name: { contains: search, mode: 'insensitive' as const } }] }
      : {}

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: { subscription: true, _count: { select: { projects: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ users: [], total: 0, page, pages: 0 })
  }
}
