import type { NoneAuthConfig } from '@/lib/config/schema'

import type { AuthProvider, Session, SessionUser } from '../types'

/** One year in milliseconds — the nominal lifetime of the implicit session. */
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

/**
 * No-auth provider: single-user mode.
 *
 * The minimal, zero-dependency default. There is no login — a fixed implicit
 * user is always "signed in", so the app is fully usable without any auth
 * system. Use for personal/single-user deployments or gift sites where the
 * recipient should not need an account.
 *
 * ⚠️ All content is effectively public. Do not use for multi-user or sensitive
 * deployments; choose `internal` or `nextauth` instead.
 */
export class NoneAuthProvider implements AuthProvider {
  readonly name = 'none' as const
  readonly requiresAuth = false
  readonly allowsSignup = false

  private readonly user: SessionUser

  constructor(config: NoneAuthConfig) {
    this.user = {
      id: config.userId,
      email: config.email ?? null,
      name: config.name,
    }
  }

  /** Always returns the implicit single user; the session never expires. */
  async getSession(): Promise<Session> {
    return {
      user: this.user,
      expires: new Date(Date.now() + ONE_YEAR_MS).toISOString(),
    }
  }

  /** No-op: there is no session to clear in single-user mode. */
  async signOut(): Promise<void> {
    // Nothing to do.
  }
}
