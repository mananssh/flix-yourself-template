---
"flix-yourself-template": patch
---

Fix Prisma 7 datasource config so `prisma generate` and `next build` succeed

The schema used `provider = env("DATABASE_PROVIDER")` and `url = env("DATABASE_URL")`
in the datasource, both of which Prisma 7 rejects (error P1012) — so
`prisma generate` failed and the Prisma Client was never produced, breaking type
checking and the build. Completed the Prisma 7 driver-adapter setup (the required
deps were already present):

- `prisma/schema.prisma`: datasource now has a static `provider = "postgresql"`
  and no `url` (Prisma 7 no longer allows `url` in the schema)
- `prisma.config.ts` (new): supplies `DATABASE_URL` to the Prisma CLI / Migrate
- `lib/db/index.ts`: Prisma Client now uses the `@prisma/adapter-pg` driver
  adapter, with the connection string read from `DATABASE_URL` at runtime
- Documented the build-time provider choice and that **SQLite is not supported**
  by the default schema (it uses enums) in `lib/db/providers/README.md`

The provider is a build-time choice (set by the `create-flix-yourself` CLI at
scaffold time, or edited manually); the connection string stays runtime-configurable.
