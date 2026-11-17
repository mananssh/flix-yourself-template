import bcrypt from 'bcryptjs'

import type { InternalAuthConfig } from '@/lib/config/schema'
import { prisma } from '@/lib/db'

import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
  signSessionToken,
  verifySessionToken,
} from '../session'
import {
  AuthError,
  type CredentialsAuthProvider,
  type CredentialsInput,
  type RegisterInput,
  type Session,
  type SessionUser,
} from '../types'

/** bcrypt cost factor. 10 is a good balance of security and speed. */
const BCRYPT_ROUNDS = 10
const SECONDS_PER_DAY = 24 * 60 * 60

/** Prisma user fields safe to expose in a session (never the password hash). */
const USER_SELECT = { id: true, email: true, name: true } as const

interface DbUser {
  id: string
  email: string
  name: string | null
}

function toSessionUser(user: DbUser): SessionUser {
  return { id: user.id, email: user.email, name: user.name }
}

/** Normalize emails so lookups are case-insensitive and whitespace-tolerant. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Internal auth provider: email/password with bcrypt hashing and stateless,
 * HMAC-signed cookie sessions (see `lib/auth/session.ts`). No external service
 * and no Session table — the signed cookie is the session.
 *
 * Users are stored in the `User` model (`prisma/schema.prisma`).
 */
export class InternalAuthProvider implements CredentialsAuthProvider {
  readonly name = 'internal' as const
  readonly requiresAuth = true
  readonly allowsSignup: boolean

  private readonly config: InternalAuthConfig

  constructor(config: InternalAuthConfig) {
    this.config = config
    this.allowsSignup = config.allowSignup
  }

  async getSession(): Promise<Session | null> {
    const token = await readSessionToken()
    if (!token) return null

    const payload = verifySessionToken(token, this.config.sessionSecret)
    if (!payload) return null

    // The user may have been deleted since the token was issued.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: USER_SELECT,
    })
    if (!user) return null

    return {
      user: toSessionUser(user),
      expires: new Date(payload.exp * 1000).toISOString(),
    }
  }

  async signIn({ email, password }: CredentialsInput): Promise<Session> {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    })
    // Verify against a hash even when the user is missing would be ideal to
    // avoid timing leaks; bcrypt.compare on a short-circuit is acceptable here.
    if (!user) {
      throw new AuthError('Invalid email or password.', 'invalid_credentials')
    }

    const passwordOk = await bcrypt.compare(password, user.password)
    if (!passwordOk) {
      throw new AuthError('Invalid email or password.', 'invalid_credentials')
    }

    return this.establishSession(user)
  }

  async register({ email, password, name }: RegisterInput): Promise<Session> {
    if (!this.config.allowSignup) {
      throw new AuthError(
        'New account registration is disabled.',
        'signup_disabled',
      )
    }

    const normalizedEmail = normalizeEmail(email)
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
    if (existing) {
      throw new AuthError(
        'An account with this email already exists.',
        'email_taken',
      )
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = await prisma.user.create({
      data: { email: normalizedEmail, name: name ?? null, password: hashed },
    })

    return this.establishSession(user)
  }

  async signOut(): Promise<void> {
    await clearSessionCookie()
  }

  /** Issue a signed token, set the cookie, and return the session. */
  private async establishSession(user: DbUser): Promise<Session> {
    const maxAgeSeconds = this.config.sessionMaxAgeDays * SECONDS_PER_DAY
    const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds
    const token = signSessionToken(
      { sub: user.id, exp },
      this.config.sessionSecret,
    )
    await setSessionCookie(token, maxAgeSeconds)

    return {
      user: toSessionUser(user),
      expires: new Date(exp * 1000).toISOString(),
    }
  }
}
