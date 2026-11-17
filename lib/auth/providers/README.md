# Authentication Provider Setup Guide

Flix Yourself ships a pluggable **auth seam**: the app talks only to the
`AuthProvider` interface (`lib/auth/types.ts`), and you choose a backend with the
`AUTH_PROVIDER` environment variable. No code changes are needed to switch.

| Provider   | Login?         | External service | Multi-user | Best for                      |
| ---------- | -------------- | ---------------- | ---------- | ----------------------------- |
| `none`     | No             | None             | No         | Personal / gift / single-user |
| `internal` | Email/password | None             | Yes        | Family & friends, self-host   |
| `nextauth` | OAuth          | Google / GitHub  | Yes        | Social login, self-host       |

## Quick Start

Copy the example env for your provider into the project root `.env`:

```bash
cp lib/auth/providers/none.example.env .env       # or internal / nextauth
```

Then fill in the values and restart the app. Only the selected provider's
variables are ever read.

## Using auth in the app

```ts
import { getSession, getCurrentUser, getAuth } from '@/lib/auth'

// In a Server Component, route handler, or server action:
const session = await getSession() // Session | null
const user = await getCurrentUser() // SessionUser | null

// Credential sign-in/registration (internal provider only):
import { getAuth, supportsCredentials } from '@/lib/auth'
const auth = await getAuth()
if (supportsCredentials(auth)) {
  await auth.register({ email, password, name })
  await auth.signIn({ email, password })
}
await auth.signOut()
```

Route protection is handled by `middleware.ts`, which performs a cheap
session-cookie presence check at the edge. **Always** re-check authorization
server-side with `getSession()` in pages and API routes — the middleware check
is a redirect convenience, not a security boundary.

---

## `none` — Single-user, no login

No authentication. A fixed implicit user is always "signed in".

```bash
AUTH_PROVIDER=none
# Optional identity for the implicit user:
AUTH_NONE_USER_ID=single-user
AUTH_NONE_USER_EMAIL=owner@example.com
AUTH_NONE_USER_NAME=Owner
```

**Use when:** single-user deployment, local development, a gift site the
recipient shouldn't have to log into, or when another layer (VPN, Cloudflare
Access) already gates the app.

> ⚠️ All content is effectively public. Don't use `none` for multi-user or
> sensitive deployments.

---

## `internal` — Email/password (bcrypt)

Built-in authentication: passwords are hashed with **bcrypt** and sessions are
**stateless, HMAC-signed cookies** (`lib/auth/session.ts`). No external service
and no Session table — the signed cookie is the session. Users live in the
`User` model (`prisma/schema.prisma`).

```bash
AUTH_PROVIDER=internal

# REQUIRED: secret used to sign session cookies (min 16 chars).
# Generate one with: openssl rand -base64 32
AUTH_SESSION_SECRET=replace-with-a-long-random-string

# Optional:
AUTH_ALLOW_SIGNUP=true               # allow self-registration (default true)
AUTH_REQUIRE_EMAIL_VERIFICATION=false # reserved — see note below (default false)
AUTH_SESSION_MAX_AGE_DAYS=7          # session lifetime in days (default 7)
```

**Provides:** email/password login, bcrypt hashing, signed cookie sessions,
optional self-registration.

**Use when:** you want simple multi-user auth with no external dependencies.

> **Note on `AUTH_REQUIRE_EMAIL_VERIFICATION`:** this flag is validated but not
> yet enforced. Enforcement requires an `emailVerified` column on the `User`
> model, which the default schema does not include. Leave it `false` until the
> schema and a verification flow are added.

---

## `nextauth` — OAuth via NextAuth (Auth.js v5)

Self-hosted OAuth with Google and/or GitHub, using NextAuth's **JWT session
strategy** (no database adapter required, so your `User` table is untouched).
The catch-all route lives at `app/api/auth/[...nextauth]/route.ts`.

```bash
AUTH_PROVIDER=nextauth

# REQUIRED: secret used to sign/encrypt NextAuth JWTs.
# Generate one with: openssl rand -base64 32
NEXTAUTH_SECRET=replace-with-a-long-random-string

# Canonical app URL (used for OAuth callbacks):
NEXTAUTH_URL=http://localhost:3000

# Configure at least ONE provider (both id AND secret required per provider):
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Getting OAuth credentials

**Google** — [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
→ Create OAuth client ID → Web application.
Authorized redirect URI:

```
<NEXTAUTH_URL>/api/auth/callback/google
```

**GitHub** — [GitHub Developer Settings](https://github.com/settings/developers)
→ New OAuth App.
Authorization callback URL:

```
<NEXTAUTH_URL>/api/auth/callback/github
```

**Use when:** you want social login and don't want to manage passwords.

> At least one provider (Google or GitHub) must be fully configured, or startup
> validation fails with a clear error.

---

## Switching providers

1. Stop the app.
2. Set `AUTH_PROVIDER` (and the new provider's variables) in `.env`.
3. Restart.

Because every provider implements the same `AuthProvider` contract, no
application code changes when you switch. See `agent-kit/config-options.md` for
the full option reference and `lib/auth/types.ts` for the interface.

## Troubleshooting

- **`AUTH_SESSION_SECRET must be at least 16 characters`** — set a longer secret
  for the `internal` provider (`openssl rand -base64 32`).
- **`NextAuth requires at least one OAuth provider`** — set both the id and
  secret for Google and/or GitHub.
- **Redirect loop to `/login`** — the app has no `/login` or `/register` page
  yet (the UI is built separately). With `internal`/`nextauth`, create those
  routes or set `AUTH_PROVIDER=none` while developing other features.
- **OAuth `redirect_uri_mismatch`** — the callback URL registered with the
  provider must exactly match `<NEXTAUTH_URL>/api/auth/callback/<provider>`.
