import 'dotenv/config'
import { defineConfig } from '@prisma/config'

/**
 * Prisma CLI / Migrate configuration (Prisma 7).
 *
 * In Prisma 7 the datasource URL is no longer declared in `schema.prisma`.
 * CLI commands (migrate, db push, studio, introspect) read the connection
 * string from here; the Prisma Client reads it at runtime via a driver adapter
 * in `lib/db/index.ts`. Both resolve `DATABASE_URL` from the environment.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
