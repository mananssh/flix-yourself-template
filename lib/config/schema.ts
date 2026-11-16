import { z } from 'zod'

export const configSchema = z.object({
  database: z.object({
    provider: z.enum(['sqlite', 'postgresql', 'cockroachdb']),
    url: z.string().min(1, 'Database URL is required'),
  }),
  // Additional configuration sections can be added here as the project grows
  // e.g., storage, auth, media processing, etc.
})

export type Config = z.infer<typeof configSchema>

/**
 * Validates environment variables against the config schema
 * @throws {Error} if validation fails
 */
export function validateConfig(): Config {
  const config = {
    database: {
      provider: process.env.DATABASE_PROVIDER,
      url: process.env.DATABASE_URL,
    },
  }

  return configSchema.parse(config)
}
