/**
 * Stateless cookie-session helpers for the `internal` auth provider.
 *
 * A session is an HMAC-signed token — `base64url(payload).base64url(signature)`
 * — stored in an httpOnly cookie. Because the signature authenticates the
 * payload, no server-side Session table is needed: the token itself proves who
 * the user is and when the session expires.
 *
 * These helpers use `node:crypto` and `next/headers`, so they run only in the
 * Node.js runtime (route handlers, server actions) — never in edge middleware.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

import { cookies } from 'next/headers'

import { SESSION_COOKIE_NAME } from './constants'

export { SESSION_COOKIE_NAME } from './constants'

/** Payload encoded inside a session token. */
export interface SessionTokenPayload {
  /** Subject — the authenticated user's id. */
  sub: string
  /** Expiry as a Unix timestamp in seconds. */
  exp: number
}

function toBase64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function hmac(data: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(data).digest()
}

/**
 * Signs a session payload, returning a compact `payload.signature` token.
 */
export function signSessionToken(
  payload: SessionTokenPayload,
  secret: string,
): string {
  const body = toBase64url(JSON.stringify(payload))
  const signature = toBase64url(hmac(body, secret))
  return `${body}.${signature}`
}

/**
 * Verifies a session token's signature and expiry.
 *
 * @returns the decoded payload, or `null` if the token is malformed, has an
 * invalid signature, or has expired.
 */
export function verifySessionToken(
  token: string,
  secret: string,
): SessionTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, signature] = parts
  if (!body || !signature) return null

  const expected = toBase64url(hmac(body, secret))
  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(signature)
  // Constant-time compare; lengths must match for timingSafeEqual.
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return null
  }

  let payload: SessionTokenPayload
  try {
    payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as SessionTokenPayload
  } catch {
    return null
  }

  if (
    typeof payload.sub !== 'string' ||
    typeof payload.exp !== 'number' ||
    payload.exp * 1000 <= Date.now()
  ) {
    return null
  }

  return payload
}

/** Reads the raw session token from the request cookies, if present. */
export async function readSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

/** Writes the session cookie with secure defaults. */
export async function setSessionCookie(
  token: string,
  maxAgeSeconds: number,
): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/',
  })
}

/** Clears the session cookie (sign out). */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
