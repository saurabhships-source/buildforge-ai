'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

const hasClerkKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_') &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('your_clerk')

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function ClerkSignUp() {
  const { SignUp } = require('@clerk/nextjs')
  return (
    <SignUp
      redirectUrl="/auth/redirect"
      appearance={{
        variables: {
          colorPrimary: '#7c3aed',
          colorBackground: '#0d0d18',
          colorText: '#ffffff',
          colorTextSecondary: 'rgba(255,255,255,0.5)',
          colorInputBackground: 'rgba(255,255,255,0.04)',
          colorInputText: '#ffffff',
          borderRadius: '0.75rem',
        },
        elements: {
          rootBox: 'w-full max-w-md',
          card: 'border border-white/[0.08] shadow-2xl bg-[#0d0d18] rounded-2xl',
          headerTitle: 'text-white text-xl font-bold',
          headerSubtitle: 'text-white/50 text-sm',
          socialButtonsBlockButton: 'border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07] transition-colors',
          socialButtonsBlockButtonText: 'text-white/80 font-medium',
          dividerLine: 'bg-white/10',
          dividerText: 'text-white/30 text-xs',
          formFieldLabel: 'text-white/70 text-sm',
          formFieldInput: 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-violet-500 focus:ring-violet-500/20',
          formButtonPrimary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/20',
          footerActionLink: 'text-violet-400 hover:text-violet-300',
          formFieldErrorText: 'text-red-400',
        },
      }}
    />
  )
}

function DevSignupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!email) { setError('Please enter your email address.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d18] p-8 shadow-2xl">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-bold text-white">
          Build<span className="text-violet-400">Forge</span> AI
        </span>
      </Link>

      <h1 className="mt-6 text-xl font-bold text-white">Create your account</h1>
      <p className="mt-1 text-sm text-white/50">Start building AI products for free</p>

      {/* OAuth buttons */}
      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.07] hover:text-white transition-all"
        >
          <GoogleIcon /> Continue with Google
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.07] hover:text-white transition-all"
        >
          <GitHubIcon /> Continue with GitHub
        </button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-xs text-white/30">or sign up with email</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3.5 py-2.5">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">Full name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 transition-all"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : 'Create free account'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-white/30">
        Already have an account?{' '}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
          Sign in
        </Link>
      </p>

      <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-white/20">
        <ShieldCheck className="h-3.5 w-3.5" />
        Your account is protected with secure authentication
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080810] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-violet-600/10 blur-3xl" />
      </div>
      {hasClerkKey ? <ClerkSignUp /> : <DevSignupForm />}
    </div>
  )
}
