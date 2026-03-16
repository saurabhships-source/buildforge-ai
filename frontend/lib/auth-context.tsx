'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

interface AppUser {
  id: string
  clerkId: string
  name: string
  email: string
  role: string
  plan: 'free' | 'pro' | 'team' | 'enterprise'
  creditsRemaining: number
  creditsTotal: number
  hasGithubToken?: boolean
  isAdmin: boolean
}

interface AuthContextType {
  user: AppUser | null
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const hasClerkKey =
  typeof process !== 'undefined' &&
  (() => {
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
    return (key.startsWith('pk_test_') || key.startsWith('pk_live_')) &&
      !key.includes('your_') &&
      !key.includes('placeholder') &&
      key.length > 20
  })()

// Safe hook that works with or without Clerk
function useClerkUser() {
  if (hasClerkKey) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useUser } = require('@clerk/nextjs')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useUser()
  }
  return { user: null, isLoaded: true }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useClerkUser()
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAppUser = useCallback(async () => {
    // When Clerk isn't configured, still fetch from /api/user/me (returns dev mock)
    if (!hasClerkKey || clerkUser) {
      try {
        const res = await fetch('/api/user/me')
        if (res.ok) {
          const data = await res.json()
          setAppUser({ ...data, isAdmin: data.role === 'admin' })
        }
      } catch (err) {
        console.error('Failed to fetch app user:', err)
      } finally {
        setIsLoading(false)
      }
    } else {
      setAppUser(null)
      setIsLoading(false)
    }
  // clerkUser.id is stable — using the full object causes infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUser?.id])

  useEffect(() => {
    if (isLoaded) {
      fetchAppUser()
    }
  }, [isLoaded, fetchAppUser])

  return (
    <AuthContext.Provider value={{ user: appUser, isLoading, refreshUser: fetchAppUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
