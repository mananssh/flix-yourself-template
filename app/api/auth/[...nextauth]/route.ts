/**
 * NextAuth (Auth.js v5) catch-all route.
 *
 * Delegates to the handlers built by the auth seam. When `AUTH_PROVIDER` is not
 * `nextauth`, the handlers respond 404, so this file is inert for the `none`
 * and `internal` providers without any extra configuration.
 */
import { getNextAuthHandlers } from '@/lib/auth/providers/nextauth'

// NextAuth needs the Node.js runtime (not edge).
export const runtime = 'nodejs'

export const { GET, POST } = getNextAuthHandlers()
