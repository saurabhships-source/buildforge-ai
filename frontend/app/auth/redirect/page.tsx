import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

// Server component — runs after Clerk sign-in, routes based on role
export default async function AuthRedirectPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })
    if (user?.role === 'admin') redirect('/admin')
  } catch {
    // DB not configured or user not yet provisioned — fall through to dashboard
  }

  redirect('/dashboard')
}
