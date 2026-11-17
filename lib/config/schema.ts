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

/* -------------------------------------------------------------------------- */
/*                               Storage config                               */
/* -------------------------------------------------------------------------- */

const localStorageSchema = z.object({
  provider: z.literal('local'),
  /** Directory where objects are written, relative or absolute. */
  path: z.string().min(1).default('./uploads'),
  /** App route prefix used to build signed URLs for local objects. */
  baseUrl: z.string().min(1).default('/api/media/file'),
})

const s3StorageSchema = z.object({
  provider: z.literal('s3'),
  bucket: z.string().min(1, 'STORAGE_S3_BUCKET is required'),
  region: z.string().min(1, 'STORAGE_S3_REGION is required'),
  accessKeyId: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  secretAccessKey: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  /** Custom endpoint for S3-compatible services (MinIO, DO Spaces, …). */
  endpoint: z.string().url().optional(),
  /** Use path-style addressing (required by some S3-compatible services). */
  forcePathStyle: z.boolean().optional(),
})

const r2StorageSchema = z.object({
  provider: z.literal('r2'),
  accountId: z.string().min(1, 'STORAGE_R2_ACCOUNT_ID is required'),
  bucket: z.string().min(1, 'STORAGE_R2_BUCKET is required'),
  accessKeyId: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  secretAccessKey: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
})

const gcsStorageSchema = z.object({
  provider: z.literal('gcs'),
  bucket: z.string().min(1, 'STORAGE_GCS_BUCKET is required'),
  projectId: z.string().min(1, 'STORAGE_GCS_PROJECT_ID is required'),
  /** Path to a service-account JSON key file. Optional when using ADC. */
  keyFile: z.string().min(1).optional(),
})

const azureStorageSchema = z.object({
  provider: z.literal('azure'),
  accountName: z.string().min(1, 'STORAGE_AZURE_ACCOUNT_NAME is required'),
  accountKey: z.string().min(1, 'STORAGE_AZURE_ACCOUNT_KEY is required'),
  container: z.string().min(1, 'STORAGE_AZURE_CONTAINER is required'),
})

export const storageConfigSchema = z.discriminatedUnion('provider', [
  localStorageSchema,
  s3StorageSchema,
  r2StorageSchema,
  gcsStorageSchema,
  azureStorageSchema,
])

export type StorageConfig = z.infer<typeof storageConfigSchema>
export type LocalStorageConfig = z.infer<typeof localStorageSchema>
export type S3StorageConfig = z.infer<typeof s3StorageSchema>
export type R2StorageConfig = z.infer<typeof r2StorageSchema>
export type GcsStorageConfig = z.infer<typeof gcsStorageSchema>
export type AzureStorageConfig = z.infer<typeof azureStorageSchema>

/** Parse `STORAGE_FORCE_PATH_STYLE`-style boolean env vars. */
function envBool(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined
  return value === 'true' || value === '1'
}

/**
 * Builds the raw storage config object from environment variables for the
 * selected `STORAGE_PROVIDER`, then validates it.
 *
 * Only the fields relevant to the chosen provider are read, so unrelated
 * provider credentials never need to be set.
 *
 * @throws {Error} if `STORAGE_PROVIDER` is missing/unknown or validation fails
 */
export function validateStorageConfig(): StorageConfig {
  const provider = process.env.STORAGE_PROVIDER ?? 'local'

  let raw: unknown
  switch (provider) {
    case 'local':
      raw = {
        provider,
        path: process.env.STORAGE_LOCAL_PATH,
        baseUrl: process.env.STORAGE_LOCAL_BASE_URL,
      }
      break
    case 's3':
      raw = {
        provider,
        bucket: process.env.STORAGE_S3_BUCKET,
        region: process.env.STORAGE_S3_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        endpoint: process.env.STORAGE_S3_ENDPOINT,
        forcePathStyle: envBool(process.env.STORAGE_S3_FORCE_PATH_STYLE),
      }
      break
    case 'r2':
      raw = {
        provider,
        accountId: process.env.STORAGE_R2_ACCOUNT_ID,
        bucket: process.env.STORAGE_R2_BUCKET,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      }
      break
    case 'gcs':
      raw = {
        provider,
        bucket: process.env.STORAGE_GCS_BUCKET,
        projectId: process.env.STORAGE_GCS_PROJECT_ID,
        keyFile: process.env.STORAGE_GCS_KEY_FILE,
      }
      break
    case 'azure':
      raw = {
        provider,
        accountName: process.env.STORAGE_AZURE_ACCOUNT_NAME,
        accountKey: process.env.STORAGE_AZURE_ACCOUNT_KEY,
        container: process.env.STORAGE_AZURE_CONTAINER,
      }
      break
    default:
      throw new Error(
        `Unknown STORAGE_PROVIDER: "${provider}". ` +
          `Expected one of: local, s3, r2, gcs, azure.`,
      )
  }

  // Strip undefined so Zod `.default()` values apply where env vars are unset.
  const pruned = Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(([, v]) => v !== undefined),
  )

  return storageConfigSchema.parse(pruned)
}

/* -------------------------------------------------------------------------- */
/*                                 Auth config                                */
/* -------------------------------------------------------------------------- */

/** Default session lifetime (days) for the internal cookie-session provider. */
const DEFAULT_SESSION_MAX_AGE_DAYS = 7

/**
 * `none` — single-user mode with no login. A fixed implicit identity is always
 * "signed in", so the app can be used without any auth system.
 */
const noneAuthSchema = z.object({
  provider: z.literal('none'),
  /** Stable id used for the implicit single user (and any `userId` relations). */
  userId: z.string().min(1).default('single-user'),
  /** Optional email surfaced for the implicit user. */
  email: z.string().email().optional(),
  /** Display name surfaced for the implicit user. */
  name: z.string().min(1).default('Owner'),
})

/**
 * `internal` — email/password auth with bcrypt hashing and stateless, HMAC-
 * signed cookie sessions (no Session table required).
 */
const internalAuthSchema = z.object({
  provider: z.literal('internal'),
  /** Allow visitors to self-register new accounts. */
  allowSignup: z.boolean().default(true),
  /**
   * Require a verified email before sign-in. Reserved: enforcement needs an
   * `emailVerified` column on `User` (not in the default schema yet), so this
   * currently validates but is not enforced. See lib/auth/providers/README.md.
   */
  requireEmailVerification: z.boolean().default(false),
  /** Secret used to HMAC-sign session cookies. Keep it private and stable. */
  sessionSecret: z
    .string()
    .min(16, 'AUTH_SESSION_SECRET must be at least 16 characters'),
  /** Session lifetime in days. */
  sessionMaxAgeDays: z
    .number()
    .int()
    .positive()
    .default(DEFAULT_SESSION_MAX_AGE_DAYS),
})

/** Client id/secret pair for a single NextAuth OAuth provider. */
const oauthCredentialSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
})

/**
 * `nextauth` — self-hosted OAuth via NextAuth (Auth.js v5) with Google and/or
 * GitHub. Uses stateless JWT sessions, so no database adapter is required.
 */
const nextAuthSchema = z.object({
  provider: z.literal('nextauth'),
  /** Secret used to sign/encrypt NextAuth JWTs. Required. */
  secret: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  /** Canonical app URL for OAuth callbacks (e.g. https://flix.example.com). */
  url: z.string().url().optional(),
  google: oauthCredentialSchema.optional(),
  github: oauthCredentialSchema.optional(),
})

export const authConfigSchema = z.discriminatedUnion('provider', [
  noneAuthSchema,
  internalAuthSchema,
  nextAuthSchema,
])

export type AuthConfig = z.infer<typeof authConfigSchema>
export type NoneAuthConfig = z.infer<typeof noneAuthSchema>
export type InternalAuthConfig = z.infer<typeof internalAuthSchema>
export type NextAuthProviderConfig = z.infer<typeof nextAuthSchema>
export type OAuthCredentialConfig = z.infer<typeof oauthCredentialSchema>

/** Parse an integer env var, returning undefined when unset/invalid. */
function envInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : undefined
}

/** Build an OAuth credential pair only when BOTH id and secret are present. */
function oauthPair(
  clientId: string | undefined,
  clientSecret: string | undefined,
): OAuthCredentialConfig | undefined {
  if (!clientId || !clientSecret) return undefined
  return { clientId, clientSecret }
}

/**
 * Builds the raw auth config from environment variables for the selected
 * `AUTH_PROVIDER` (default `none`), then validates it. Only the fields relevant
 * to the chosen provider are read.
 *
 * @throws {Error} if `AUTH_PROVIDER` is unknown or validation fails
 */
export function validateAuthConfig(): AuthConfig {
  const provider = process.env.AUTH_PROVIDER ?? 'none'

  let raw: unknown
  switch (provider) {
    case 'none':
      raw = {
        provider,
        userId: process.env.AUTH_NONE_USER_ID,
        email: process.env.AUTH_NONE_USER_EMAIL,
        name: process.env.AUTH_NONE_USER_NAME,
      }
      break
    case 'internal':
      raw = {
        provider,
        allowSignup: envBool(process.env.AUTH_ALLOW_SIGNUP),
        requireEmailVerification: envBool(
          process.env.AUTH_REQUIRE_EMAIL_VERIFICATION,
        ),
        sessionSecret: process.env.AUTH_SESSION_SECRET,
        sessionMaxAgeDays: envInt(process.env.AUTH_SESSION_MAX_AGE_DAYS),
      }
      break
    case 'nextauth':
      raw = {
        provider,
        secret: process.env.NEXTAUTH_SECRET,
        url: process.env.NEXTAUTH_URL,
        google: oauthPair(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
        ),
        github: oauthPair(
          process.env.GITHUB_CLIENT_ID,
          process.env.GITHUB_CLIENT_SECRET,
        ),
      }
      break
    default:
      throw new Error(
        `Unknown AUTH_PROVIDER: "${provider}". ` +
          `Expected one of: none, internal, nextauth.`,
      )
  }

  // Strip undefined so Zod `.default()` values apply where env vars are unset.
  const pruned = Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(([, v]) => v !== undefined),
  )

  const config = authConfigSchema.parse(pruned)

  // discriminatedUnion members can't carry `.refine`, so enforce the
  // "at least one OAuth provider" rule for NextAuth here.
  if (config.provider === 'nextauth' && !config.google && !config.github) {
    throw new Error(
      'NextAuth requires at least one OAuth provider. Set GOOGLE_CLIENT_ID + ' +
        'GOOGLE_CLIENT_SECRET and/or GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET.',
    )
  }

  return config
}
