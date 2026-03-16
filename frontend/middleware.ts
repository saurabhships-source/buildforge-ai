import { NextResponse, type NextRequest } from "next/server"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""

const hasRealClerkKey =
  (rawKey.startsWith("pk_test_") || rawKey.startsWith("pk_live_")) &&
  !rawKey.includes("your_") &&
  !rawKey.includes("placeholder") &&
  rawKey.length > 20

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"])
const isAdminRoute = createRouteMatcher(["/admin(.*)"])

// Next.js 16: use default export for middleware
export default async function middleware(req: NextRequest) {
  if (!hasRealClerkKey) {
    // Dev mode passthrough when Clerk not configured
    return NextResponse.next()
  }

  return clerkMiddleware(async (auth) => {
    if (isProtectedRoute(req)) {
      await auth.protect()
    }

    if (isAdminRoute(req)) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.redirect(new URL("/login", req.url))
      }
    }
  })(req)
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
