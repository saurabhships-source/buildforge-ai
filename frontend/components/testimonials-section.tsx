'use client'

import { Star, Quote } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    quote: "BuildForge AI completely transformed how we approach product development. We launched our AI chatbot in days instead of months. The results have been incredible.",
    author: "Sarah Chen",
    role: "CEO at TechStart",
    initials: "SC",
    gradient: "from-blue-500 to-cyan-500",
    featured: true,
  },
  {
    quote: "The automation features saved our team 20+ hours per week. It's like having an extra developer on the team who never sleeps.",
    author: "Marcus Rodriguez",
    role: "Founder at GrowthLabs",
    initials: "MR",
    gradient: "from-violet-500 to-purple-500",
    featured: false,
  },
  {
    quote: "As a non-technical founder, BuildForge AI gave me the power to build tools I never thought possible. Game changer!",
    author: "Emily Watson",
    role: "Marketing Director",
    initials: "EW",
    gradient: "from-rose-500 to-pink-500",
    featured: false,
  },
  {
    quote: "We've tried other AI builders, but nothing comes close to the quality and speed of BuildForge. Highly recommended.",
    author: "David Park",
    role: "CTO at Innovate Co",
    initials: "DP",
    gradient: "from-amber-500 to-orange-500",
    featured: false,
  },
  {
    quote: "The customer support is phenomenal. They helped us set up our entire AI workflow in a single afternoon.",
    author: "Lisa Thompson",
    role: "Operations Lead",
    initials: "LT",
    gradient: "from-emerald-500 to-teal-500",
    featured: false,
  },
]

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-0 bottom-1/4 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            Customer Stories
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Loved by thousands of builders
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            See what our customers are building and achieving with BuildForge AI.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-border hover:shadow-xl lg:p-8",
                testimonial.featured && "md:col-span-2 lg:col-span-1"
              )}
            >
              {/* Quote icon */}
              <Quote className="absolute right-4 top-4 h-8 w-8 text-muted-foreground/10" />
              
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              {/* Quote */}
              <blockquote className="mb-6 text-foreground leading-relaxed">
                &quot;{testimonial.quote}&quot;
              </blockquote>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className={cn(
                  "h-11 w-11 border-2 border-transparent bg-gradient-to-br p-[2px]",
                  testimonial.gradient.replace("from-", "border-").split(" ")[0]
                )}>
                  <AvatarFallback className={cn(
                    "bg-gradient-to-br text-sm font-semibold text-white",
                    testimonial.gradient
                  )}>
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="mt-16 flex flex-col items-center gap-6 text-center">
          <div className="flex -space-x-3">
            {['SC', 'MR', 'EW', 'DP', 'LT', '+'].map((initials, i) => (
              <Avatar key={i} className="h-10 w-10 border-2 border-background">
                <AvatarFallback className={cn(
                  "text-xs font-medium",
                  i === 5 ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {initials === '+' ? '10k' : initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Join <span className="font-semibold text-foreground">10,000+</span> builders already using BuildForge AI
          </p>
        </div>
      </div>
    </section>
  )
}
