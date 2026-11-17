/**
 * Auth seam types.
 *
 * Every authentication backend (`none`, `internal`, `nextauth`) implements the
 * same {@link AuthProvider} contract, so the rest of the app depends only on
 * this interface — never on a specific auth library. Swap providers via the
 * `AUTH_PROVIDER` environment variable; no code changes required.
 */

export type AuthProviderName = 'none' | 'internal' | 'nextauth'

/** The authenticated user exposed to the app, normalized across providers. */
export interface SessionUser {
  id: string
  email: string | null
  name: string | null
  /** Avatar URL, where the provider supplies one (OAuth). */
  image?: string | null
}

/** An active session resolved from the current request. */
export interface Session {
  user: SessionUser
  /** ISO-8601 timestamp at which this session expires. */
  expires: string
}

/**
 * Contract implemented by every auth backend.
 *
 * Read the current session with {@link AuthProvider.getSession} and end it with
 * {@link AuthProvider.signOut}. Credential-based sign-in and registration are
 * an optional capability — see {@link CredentialsAuthProvider}.
 */
export interface AuthProvider {
  /** The provider this instance represents. */
  readonly name: AuthProviderName

  /**
   * Whether this provider gates the app behind a sign-in. `false` for `none`
   * (single-user mode), `true` for `internal` and `nextauth`. Used by route
   * protection to decide whether to enforce authentication.
   */
  readonly requiresAuth: boolean

  /** Whether users may self-register. Only credential providers can allow it. */
  readonly allowsSignup: boolean

  /** Resolve the current request's session, or `null` if unauthenticated. */
  getSession(): Promise<Session | null>

  /** End the current session (sign out). A no-op for `none`. */
  signOut(): Promise<void>
}

/** Input for registering a new local (internal) account. */
export interface RegisterInput {
  email: string
  password: string
  name?: string
}

/** Credentials for a local (internal) sign-in. */
export interface CredentialsInput {
  email: string
  password: string
}

/**
 * Capability mixin for providers that authenticate email + password locally
 * (the `internal` provider). OAuth (`nextauth`) and `none` do not implement it.
 * Narrow to this type with {@link supportsCredentials} before calling.
 */
export interface CredentialsAuthProvider extends AuthProvider {
  /** Verify credentials and establish a session. */
  signIn(credentials: CredentialsInput): Promise<Session>
  /** Create an account (if signup is allowed) and establish a session. */
  register(input: RegisterInput): Promise<Session>
}

/** Runtime narrowing guard for {@link CredentialsAuthProvider}. */
export function supportsCredentials(
  provider: AuthProvider,
): provider is CredentialsAuthProvider {
  const candidate = provider as Partial<CredentialsAuthProvider>
  return (
    typeof candidate.signIn === 'function' &&
    typeof candidate.register === 'function'
  )
}

/** Machine-readable reasons an auth operation can fail. */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'signup_disabled'
  | 'email_not_verified'
  | 'not_supported'
  | 'invalid_session'

/**
 * Error thrown by auth operations, carrying a stable {@link AuthErrorCode} so
 * callers (API routes, UI) can branch on the reason without string matching.
 */
export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(message: string, code: AuthErrorCode) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}
