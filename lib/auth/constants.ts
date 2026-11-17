/**
 * Edge-safe auth constants.
 *
 * This module has no Node.js dependencies, so it can be imported from edge
 * middleware (`middleware.ts`) as well as from Node runtime code
 * (`lib/auth/session.ts`). Keep it free of `node:*` imports.
 */

/** Name of the cookie that stores the internal session token. */
export const SESSION_COOKIE_NAME = 'fy_session'
