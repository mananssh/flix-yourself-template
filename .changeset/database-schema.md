---
"flix-yourself-template": minor
---

Add Prisma database schema and multi-provider support

Implements a flexible database layer with support for SQLite, PostgreSQL, and CockroachDB:

- **Prisma schema**: Complete data models for Media, Episodes, Collections, Users, and Watchlists
- **Multi-provider support**: Switch between SQLite, PostgreSQL, or CockroachDB via environment variables
- **Database seam**: Singleton Prisma client pattern for connection management
- **Provider examples**: Ready-to-use configuration templates for each database provider
- **Configuration validation**: Zod schema for type-safe environment variable validation
- **Database scripts**: npm scripts for schema generation, migrations, and Prisma Studio

The "seams not forks" approach allows users to choose their preferred database without code changes—just update the `.env` file and restart.

**Setup:**
```bash
cp lib/db/providers/sqlite.example.env .env
npm run db:generate
npm run db:push
```

See `lib/db/providers/README.md` for detailed provider setup instructions.
