'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle } from 'lucide-react'

const hasClerkKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_') &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('your_clerk')

function ClerkResetPassword() {
  // Clerk handles the reset password flow via its hosted UI
  // The reset link in the email redirects here with a token Clerk processes automatically
  const { SignIn } = require('@clerk/nextjs')
  return (
    <SignIn
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
          formFieldLabel: 'text-white/70 text-sm',
          formFieldInput: 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-violet-500',
          formButtonPrimary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold',
          footerActionLink: 'text-violet-400 hover:text-violet-300',
        },
      }}
    />
  )
}

function DevResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setDone(true)
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

      {done ? (
        <div className="mt-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Password updated</h1>
          <p className="text-sm text-white/50 mb-6">Your password has been reset successfully.</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="mt-6 text-xl font-bold text-white">Set new password</h1>
          <p className="mt-1 text-sm text-white/50">Choose a strong password for your account.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3.5 py-2.5">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">New password</label>
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

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Confirm password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 transition-all"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : 'Update password'}
            </button>
          </form>
        </>
      )}

      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-white/20">
        <ShieldCheck className="h-3.5 w-3.5" />
        Your account is protected with secure authentication
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080810] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
      </div>
      {hasClerkKey ? <ClerkResetPassword /> : <DevResetPasswordForm />}
    </div>
  )
}
