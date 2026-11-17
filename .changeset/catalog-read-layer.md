---
"flix-yourself-template": minor
---

Add the catalog read layer: service seam, API routes, seed data, and a browse page

Introduces a read-only catalog layer on top of the database so the app can list
and inspect media without any component talking to Prisma directly.

- **Catalog seam** (`lib/catalog/`): a `CatalogService` interface with a factory
  (`getCatalog()`) and a lazily-loaded `prisma` provider, mirroring the db,
  storage, and auth seams. Methods: `listMedia(filters?)` (optional `type` /
  `genre` filters), `getMediaById(id)`, `getCollections()`, and
  `getMediaByCollection(collectionId)`. Results are plain, JSON-serializable DTOs
  (BigInt sizes surfaced as strings; relations flattened), so routes can return
  them directly. The provider indirection lets tests substitute an alternative
  read model without touching callers.
- **API routes** (`app/api/media/`): `GET /api/media` (with `type`/`genre` query
  filters), `GET /api/media/[id]`, `GET /api/media/collections`, and
  `GET /api/media/collections/[id]`, sharing a small JSON response helper
  (`lib/api/responses.ts`) for consistent `{ error }` envelopes and 400/404/500s.
- **Seed data** (`prisma/seed.ts` + `npm run db:seed`): a realistic sample
  catalog — 7 movies, 3 series (with episodes), 4 genres, 6 people, and 2
  collections, each with placeholder poster/backdrop images — so the browse page
  and API look real out of the box. Idempotent (clears catalog tables first) and
  runs via Node's native TypeScript support, no extra tooling required.
- **Browse page** (`app/(browse)/page.tsx`): a Netflix-dark responsive poster
  grid (`components/catalog/`) showing poster, title, and year, with All / Movies
  / Series filter tabs. Adds the root layout and Tailwind globals. No player yet —
  catalog display only.

Following the "seams, not forks" approach, the catalog provider is selected via
the optional `CATALOG_PROVIDER` environment variable (default `prisma`).
