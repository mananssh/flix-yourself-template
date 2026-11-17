---
"flix-yourself-template": minor
---

Add pluggable authentication layer with multi-provider support

Implements an auth seam so sign-in can be swapped between backends without code
changes — just update `.env` and restart.

- **Providers**: `none` (single-user, no login), `internal` (email/password with
  bcrypt + stateless HMAC-signed cookie sessions), and `nextauth` (self-hosted
  OAuth via NextAuth / Auth.js v5 with Google and/or GitHub)
- **Unified interface**: `getSession`, `signOut`, plus a `CredentialsAuthProvider`
  capability (`signIn`, `register`) for local auth (`lib/auth/types.ts`) — the app
  depends only on this contract, never on a specific auth library
- **Convenience helpers**: `getAuth()`, `getSession()`, `getCurrentUser()` from
  `@/lib/auth`
- **Route protection**: `middleware.ts` gates routes with an edge-safe session
  cookie presence check (full verification happens server-side)
- **Lazy loading**: each provider module is dynamically imported, so only the
  selected backend — and NextAuth's SDK — is ever loaded
- **Config validation**: Zod discriminated union (`authConfigSchema`) with a
  `validateAuthConfig()` helper that reads provider-specific env vars
- **NextAuth route**: `app/api/auth/[...nextauth]/route.ts` (inert 404 unless
  `nextauth` is selected)
- **Provider examples**: ready-to-use `*.example.env` files and a setup guide

Following the "seams, not forks" approach, switch providers via the
`AUTH_PROVIDER` environment variable.

**Setup:**
```bash
cp lib/auth/providers/none.example.env .env   # or internal / nextauth
```

See `lib/auth/providers/README.md` for detailed provider setup instructions.
