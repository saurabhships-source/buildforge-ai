'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Sparkles, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      scrolled 
        ? "border-b border-border/40 bg-background/80 shadow-sm backdrop-blur-xl" 
        : "bg-transparent"
    )}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Build<span className="text-primary">Forge</span> AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link 
            href="#features" 
            className="group relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
            <span className="absolute inset-x-2 -bottom-px h-px scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform group-hover:scale-x-100" />
          </Link>
          <Link 
            href="#benefits" 
            className="group relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Benefits
            <span className="absolute inset-x-2 -bottom-px h-px scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform group-hover:scale-x-100" />
          </Link>
          <Link 
            href="/pricing" 
            className="group relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
            <span className="absolute inset-x-2 -bottom-px h-px scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform group-hover:scale-x-100" />
          </Link>
          <button className="group relative flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Resources
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            <span className="absolute inset-x-2 -bottom-px h-px scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform group-hover:scale-x-100" />
          </button>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30">
            <Link href="/signup">Start Building</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-background/50 backdrop-blur-sm transition-colors hover:bg-muted md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        "overflow-hidden border-t border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-300 md:hidden",
        isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <nav className="flex flex-col gap-1 px-4 py-4">
          <Link 
            href="#features" 
            className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </Link>
          <Link 
            href="#benefits" 
            className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setIsMenuOpen(false)}
          >
            Benefits
          </Link>
          <Link 
            href="/pricing" 
            className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setIsMenuOpen(false)}
          >
            Pricing
          </Link>
          <div className="my-2 h-px bg-border/40" />
          <div className="flex items-center gap-3 px-4 py-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className="flex-1">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="flex-1 shadow-lg shadow-primary/25">
              <Link href="/signup">Start Building</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
