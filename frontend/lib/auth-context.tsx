'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  plan: 'starter' | 'pro' | 'enterprise'
  credits: number
  role: 'user' | 'admin'
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data for demo purposes
const MOCK_USERS: Record<string, User & { password: string }> = {
  'demo@buildforge.ai': {
    id: '1',
    name: 'Demo User',
    email: 'demo@buildforge.ai',
    password: 'demo123',
    plan: 'pro',
    credits: 350,
    role: 'user',
  },
  'admin@buildforge.ai': {
    id: '2',
    name: 'Admin User',
    email: 'admin@buildforge.ai',
    password: 'admin123',
    plan: 'enterprise',
    credits: 9999,
    role: 'admin',
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('buildforge_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockUser = MOCK_USERS[email]
    if (mockUser && mockUser.password === password) {
      const { password: _, ...userData } = mockUser
      setUser(userData)
      localStorage.setItem('buildforge_user', JSON.stringify(userData))
      router.push('/dashboard')
    } else {
      throw new Error('Invalid credentials')
    }
    
    setIsLoading(false)
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (MOCK_USERS[email]) {
      throw new Error('User already exists')
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      plan: 'starter',
      credits: 100,
      role: 'user',
    }
    
    setUser(newUser)
    localStorage.setItem('buildforge_user', JSON.stringify(newUser))
    router.push('/dashboard')
    
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('buildforge_user')
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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
