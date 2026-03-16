'use client'

import { ClerkProviderSafe } from '@/lib/clerk-provider-safe'
import { AuthProvider } from '@/lib/auth-context'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProviderSafe>
      <AuthProvider>
        <SidebarProvider>
          <DashboardSidebar />
          <SidebarInset className="h-svh overflow-hidden">
            <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border/40 px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1" />
              <ThemeToggle />
            </header>
            <div className="flex-1 min-h-0 overflow-hidden">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthProvider>
    </ClerkProviderSafe>
  )
}
