// Server-side admin guard — use in API routes and server components
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface AdminUser {
  id: string
  clerkId: string
  email: string
  name: string
  role: string
}

/** Returns the admin user or a 403 NextResponse. Use in API routes. */
export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  // Bootstrap: env var allows first admin without DB round-trip
  const adminIds = (process.env.ADMIN_USER_IDS ?? '').split(',').filter(Boolean)
  const isBootstrapAdmin = adminIds.includes(userId)

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new NextResponse('User not found', { status: 404 })

  if (user.role !== 'admin' && !isBootstrapAdmin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Auto-promote bootstrap admin
  if (isBootstrapAdmin && user.role !== 'admin') {
    await db.user.update({ where: { id: user.id }, data: { role: 'admin' } })
  }

  return user as AdminUser
}

/** Returns true if the given clerkId belongs to an admin. */
export async function isAdmin(clerkId: string): Promise<boolean> {
  const adminIds = (process.env.ADMIN_USER_IDS ?? '').split(',').filter(Boolean)
  if (adminIds.includes(clerkId)) return true
  const user = await db.user.findUnique({ where: { clerkId }, select: { role: true } })
  return user?.role === 'admin'
}
