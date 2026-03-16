import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AuthProvider } from '@/lib/auth-context'
import { ClerkProviderSafe } from '@/lib/clerk-provider-safe'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'

const hasClerkKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_') &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('your_')

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (hasClerkKey) {
    const { userId } = await auth()
    if (!userId) redirect('/login')

    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user || user.role !== 'admin') redirect('/dashboard')
  }
  // Dev mode: no Clerk keys configured — allow access for local development

  return (
    <ClerkProviderSafe>
      <AuthProvider>
        <SidebarProvider>
          <DashboardSidebar />
          <SidebarInset>
            <header className="flex h-14 items-center gap-4 border-b border-border/40 px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </AuthProvider>
    </ClerkProviderSafe>
  )
}
