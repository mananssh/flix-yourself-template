import { validateAuthConfig, type AuthConfig } from '@/lib/config/schema'

import type { AuthProvider, Session, SessionUser } from './types'

export type {
  AuthProvider,
  AuthProviderName,
  CredentialsAuthProvider,
  CredentialsInput,
  RegisterInput,
  Session,
  SessionUser,
  AuthErrorCode,
} from './types'
export { AuthError, supportsCredentials } from './types'

/**
 * Instantiates the provider named by a validated auth config. Each provider
 * module (and any SDK it needs) is imported lazily, so only the selected
 * backend — and its dependencies — is ever loaded.
 */
async function createAuth(config: AuthConfig): Promise<AuthProvider> {
  switch (config.provider) {
    case 'none': {
      const { NoneAuthProvider } = await import('./providers/none')
      return new NoneAuthProvider(config)
    }
    case 'internal': {
      const { InternalAuthProvider } = await import('./providers/internal')
      return new InternalAuthProvider(config)
    }
    case 'nextauth': {
      const { NextAuthProvider } = await import('./providers/nextauth')
      return new NextAuthProvider(config)
    }
    default: {
      // Exhaustiveness guard: a new provider in the schema forces a case here.
      const _exhaustive: never = config
      throw new Error(`Unhandled auth provider: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

// Cache the resolved provider across calls within a runtime. In development we
// also cache on globalThis so hot-reloads don't re-instantiate it.
const globalForAuth = globalThis as unknown as {
  auth: Promise<AuthProvider> | undefined
}

/**
 * Returns the configured auth provider, instantiated once and reused.
 *
 * The rest of the app should depend only on this function and the
 * {@link AuthProvider} interface — never on a specific provider or auth library.
 *
 * @example
 * const auth = await getAuth()
 * const session = await auth.getSession()
 * if (!session) redirect('/login')
 */
export function getAuth(): Promise<AuthProvider> {
  if (!globalForAuth.auth) {
    globalForAuth.auth = createAuth(validateAuthConfig())
  }
  return globalForAuth.auth
}

/** Convenience: resolve the current session via the configured provider. */
export async function getSession(): Promise<Session | null> {
  const auth = await getAuth()
  return auth.getSession()
}

/** Convenience: resolve the current user, or `null` if unauthenticated. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  return session?.user ?? null
}
