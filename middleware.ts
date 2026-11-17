import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

/**
 * Edge route protection for the auth seam.
 *
 * Middleware runs in the edge runtime, where `node:crypto` and Prisma are
 * unavailable — so it performs a cheap presence check on the session cookie
 * rather than fully verifying it. Full verification (signature, expiry, user
 * lookup) happens server-side in `getSession()` within page/route handlers.
 *
 * Behavior is driven by `AUTH_PROVIDER`:
 * - `none`     → no gate; every route is public.
 * - `internal` → checks the signed `fy_session` cookie.
 * - `nextauth` → checks NextAuth's session cookie.
 */
const AUTH_PROVIDER = process.env.AUTH_PROVIDER ?? 'none'

// Cookies that indicate a (claimed) session, per provider. Presence is a hint;
// it is authoritatively verified server-side.
const SESSION_COOKIE_NAMES = [
  SESSION_COOKIE_NAME, // internal
  'authjs.session-token', // nextauth (http)
  '__Secure-authjs.session-token', // nextauth (https)
]

/** Routes reachable without a session (the sign-in flow itself). */
const PUBLIC_PATHS = ['/login', '/register']

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name))
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export function middleware(request: NextRequest): NextResponse {
  // Single-user mode: nothing is gated.
  if (AUTH_PROVIDER === 'none') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  const authed = hasSessionCookie(request)

  if (isPublicPath(pathname)) {
    // Already signed in? Skip the login/register pages.
    if (authed) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Protected route without a session → send to login, preserving the target.
  if (!authed) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api            (API routes — they enforce auth server-side; this also
     *                   leaves /api/auth/* free for NextAuth)
     * - _next/static   (static assets)
     * - _next/image    (image optimization)
     * - favicon.ico    (favicon)
     * - common static file extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
