import NextAuth, { type NextAuthConfig, type NextAuthResult } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'

import {
  validateAuthConfig,
  type NextAuthProviderConfig,
} from '@/lib/config/schema'

import type { AuthProvider, Session } from '../types'

/**
 * Builds the NextAuth (Auth.js v5) configuration from our validated provider
 * config. Google and/or GitHub are enabled based on which credentials are set.
 *
 * Sessions use the JWT strategy, so NextAuth needs no database adapter — the
 * app's `User` table is untouched by OAuth sign-ins.
 */
function buildNextAuthConfig(config: NextAuthProviderConfig): NextAuthConfig {
  const providers: NextAuthConfig['providers'] = []

  if (config.google) {
    providers.push(
      Google({
        clientId: config.google.clientId,
        clientSecret: config.google.clientSecret,
      }),
    )
  }
  if (config.github) {
    providers.push(
      GitHub({
        clientId: config.github.clientId,
        clientSecret: config.github.clientSecret,
      }),
    )
  }

  return {
    secret: config.secret,
    providers,
    session: { strategy: 'jwt' },
    // Required for self-hosting behind a proxy / custom domain.
    trustHost: true,
  }
}

// Singleton NextAuth instance — initializing more than once per runtime would
// re-create the handlers and break session state across hot reloads.
const globalForNextAuth = globalThis as unknown as {
  nextAuth: NextAuthResult | undefined
}

/** Returns the lazily-initialized NextAuth instance for the given config. */
export function getNextAuth(config: NextAuthProviderConfig): NextAuthResult {
  if (!globalForNextAuth.nextAuth) {
    globalForNextAuth.nextAuth = NextAuth(buildNextAuthConfig(config))
  }
  return globalForNextAuth.nextAuth
}

type RouteHandler = (request: Request) => Promise<Response>

/**
 * Resolves the App Router handlers for `app/api/auth/[...nextauth]/route.ts`.
 *
 * When `nextauth` is not the active provider, the route is made inert (404) so
 * the handler file can always exist without forcing NextAuth to initialize.
 */
export function getNextAuthHandlers(): { GET: RouteHandler; POST: RouteHandler } {
  const config = validateAuthConfig()

  if (config.provider !== 'nextauth') {
    const notConfigured: RouteHandler = async () =>
      new Response('NextAuth is not the configured auth provider.', {
        status: 404,
      })
    return { GET: notConfigured, POST: notConfigured }
  }

  // NextAuth's handler types vary across beta releases; the shape is a
  // GET/POST pair of (Request) => Promise<Response>, which the route re-exports.
  return getNextAuth(config).handlers as unknown as {
    GET: RouteHandler
    POST: RouteHandler
  }
}

/**
 * Auth seam adapter over NextAuth. Normalizes NextAuth's session into the
 * app-wide {@link Session} shape so callers never touch NextAuth directly.
 */
export class NextAuthProvider implements AuthProvider {
  readonly name = 'nextauth' as const
  readonly requiresAuth = true
  // OAuth sign-up/sign-in is handled by the provider's own flow, not our forms.
  readonly allowsSignup = false

  private readonly nextAuth: NextAuthResult

  constructor(config: NextAuthProviderConfig) {
    this.nextAuth = getNextAuth(config)
  }

  async getSession(): Promise<Session | null> {
    const session = await this.nextAuth.auth()
    if (!session?.user) return null

    const { user } = session
    const id =
      (user as { id?: string }).id ?? user.email ?? 'unknown'

    return {
      user: {
        id,
        email: user.email ?? null,
        name: user.name ?? null,
        image: user.image ?? null,
      },
      expires: session.expires,
    }
  }

  async signOut(): Promise<void> {
    await this.nextAuth.signOut({ redirect: false })
  }
}
