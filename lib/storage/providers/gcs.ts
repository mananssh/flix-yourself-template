import type { Storage as GcsStorage } from '@google-cloud/storage'

import type { GcsStorageConfig } from '@/lib/config/schema'

import {
  DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
  type PutObjectOptions,
  type SignedUrlOptions,
  type StorageBody,
  type StorageProvider,
} from '../types'

/**
 * Google Cloud Storage provider.
 *
 * Credentials come from the configured service-account key file, or from
 * Application Default Credentials (ADC) when `keyFile` is omitted. The SDK is
 * imported lazily so it only loads when this provider is selected.
 */
export class GcsStorageProvider implements StorageProvider {
  readonly name = 'gcs' as const

  private readonly config: GcsStorageConfig
  private clientPromise: Promise<GcsStorage> | undefined

  constructor(config: GcsStorageConfig) {
    this.config = config
  }

  private async client(): Promise<GcsStorage> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { Storage } = await import('@google-cloud/storage')
        return new Storage({
          projectId: this.config.projectId,
          keyFilename: this.config.keyFile,
        })
      })()
    }
    return this.clientPromise
  }

  private async file(key: string) {
    const client = await this.client()
    return client.bucket(this.config.bucket).file(key)
  }

  async put(key: string, body: StorageBody, options?: PutObjectOptions): Promise<void> {
    const file = await this.file(key)
    await file.save(Buffer.from(body), {
      contentType: options?.contentType,
      metadata: options?.cacheControl ? { cacheControl: options.cacheControl } : undefined,
    })
  }

  async get(key: string): Promise<Buffer> {
    const file = await this.file(key)
    const [contents] = await file.download()
    return contents
  }

  async delete(key: string): Promise<void> {
    const file = await this.file(key)
    await file.delete({ ignoreNotFound: true })
  }

  async exists(key: string): Promise<boolean> {
    const file = await this.file(key)
    const [exists] = await file.exists()
    return exists
  }

  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const file = await this.file(key)
    const expiresIn = options?.expiresIn ?? DEFAULT_SIGNED_URL_EXPIRY_SECONDS
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    })
    return url
  }
}
