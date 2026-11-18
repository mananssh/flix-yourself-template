import { validateStorageConfig, type StorageConfig } from '@/lib/config/schema'

import type { StorageProvider } from './types'

export type {
  ByteRange,
  PutObjectOptions,
  SignedUrlOptions,
  StorageBody,
  StorageObjectStat,
  StorageProvider,
  StorageProviderName,
} from './types'

/**
 * Instantiates the provider named by a validated storage config. Each provider
 * module (and its SDK) is imported lazily, so only the selected backend is ever
 * loaded.
 */
async function createStorage(config: StorageConfig): Promise<StorageProvider> {
  switch (config.provider) {
    case 'local': {
      const { LocalStorageProvider } = await import('./providers/local')
      return new LocalStorageProvider(config)
    }
    case 's3': {
      const { S3StorageProvider, s3ToS3Config } = await import('./providers/s3')
      return new S3StorageProvider('s3', s3ToS3Config(config))
    }
    case 'r2': {
      const { S3StorageProvider, r2ToS3Config } = await import('./providers/s3')
      return new S3StorageProvider('r2', r2ToS3Config(config))
    }
    case 'gcs': {
      const { GcsStorageProvider } = await import('./providers/gcs')
      return new GcsStorageProvider(config)
    }
    case 'azure': {
      const { AzureStorageProvider } = await import('./providers/azure')
      return new AzureStorageProvider(config)
    }
    default: {
      // Exhaustiveness guard: a new provider in the schema forces a case here.
      const _exhaustive: never = config
      throw new Error(
        `Unhandled storage provider: ${JSON.stringify(_exhaustive)}`,
      )
    }
  }
}

// Cache the resolved provider across calls within a runtime. In development we
// also cache on globalThis so hot-reloads don't re-instantiate SDK clients.
const globalForStorage = globalThis as unknown as {
  storage: Promise<StorageProvider> | undefined
}

/**
 * Returns the configured storage provider, instantiated once and reused.
 *
 * The rest of the app should depend only on this function and the
 * {@link StorageProvider} interface — never on a specific provider or SDK.
 *
 * @example
 * const storage = await getStorage()
 * await storage.put('media/123/video.mp4', buffer, { contentType: 'video/mp4' })
 * const url = await storage.getSignedUrl('media/123/video.mp4')
 */
export function getStorage(): Promise<StorageProvider> {
  if (!globalForStorage.storage) {
    globalForStorage.storage = createStorage(validateStorageConfig())
  }
  return globalForStorage.storage
}
