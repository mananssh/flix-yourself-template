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
