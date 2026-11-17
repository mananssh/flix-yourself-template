/**
 * Shared JSON response helpers for API route handlers.
 *
 * Keeping the response shapes in one place means every route returns errors in
 * the same envelope (`{ error: string }`) and success in the same way, so
 * clients can rely on a single contract.
 */

import { NextResponse } from 'next/server'

/** 200 with a JSON body. */
export function ok<T>(data: T): NextResponse {
  return NextResponse.json(data)
}

/** 404 with a standard error envelope. */
export function notFound(message = 'Not found'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 })
}

/** 400 with a standard error envelope. */
export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

/**
 * Logs the underlying error server-side and returns a generic 500, so internal
 * details never leak to clients. Use in a route's `catch`.
 */
export function serverError(context: string, error: unknown): NextResponse {
  console.error(`[api] ${context}:`, error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
