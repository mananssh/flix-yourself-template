import type { S3Client } from '@aws-sdk/client-s3'

import type { R2StorageConfig, S3StorageConfig } from '@/lib/config/schema'

import {
  DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
  type PutObjectOptions,
  type SignedUrlOptions,
  type StorageBody,
  type StorageProvider,
  type StorageProviderName,
} from '../types'

/** Normalized configuration shared by S3 and S3-compatible backends (R2). */
interface NormalizedS3Config {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string
  forcePathStyle?: boolean
}

/** Maps a Cloudflare R2 config onto the S3-compatible client shape. */
export function r2ToS3Config(config: R2StorageConfig): NormalizedS3Config {
  return {
    bucket: config.bucket,
    region: 'auto',
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
  }
}

/** Maps an S3 config onto the normalized client shape. */
export function s3ToS3Config(config: S3StorageConfig): NormalizedS3Config {
  return {
    bucket: config.bucket,
    region: config.region,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
  }
}

/**
 * S3 (and S3-compatible) storage provider.
 *
 * Backs both the `s3` and `r2` providers — R2 is AWS S3-API compatible, so the
 * only differences are the endpoint and region, normalized away by the config
 * mappers above. The AWS SDK is imported lazily so it is only loaded when this
 * provider is actually selected.
 */
export class S3StorageProvider implements StorageProvider {
  readonly name: StorageProviderName

  private readonly config: NormalizedS3Config
  private clientPromise: Promise<S3Client> | undefined

  constructor(name: Extract<StorageProviderName, 's3' | 'r2'>, config: NormalizedS3Config) {
    this.name = name
    this.config = config
  }

  private async client(): Promise<S3Client> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { S3Client } = await import('@aws-sdk/client-s3')
        return new S3Client({
          region: this.config.region,
          endpoint: this.config.endpoint,
          forcePathStyle: this.config.forcePathStyle,
          credentials: {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
          },
        })
      })()
    }
    return this.clientPromise
  }

  async put(key: string, body: StorageBody, options?: PutObjectOptions): Promise<void> {
    const [client, { PutObjectCommand }] = await Promise.all([
      this.client(),
      import('@aws-sdk/client-s3'),
    ])
    await client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType,
        CacheControl: options?.cacheControl,
      }),
    )
  }

  async get(key: string): Promise<Buffer> {
    const [client, { GetObjectCommand }] = await Promise.all([
      this.client(),
      import('@aws-sdk/client-s3'),
    ])
    const response = await client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
    )
    if (!response.Body) {
      throw new Error(`Empty response body for key: "${key}"`)
    }
    const bytes = await response.Body.transformToByteArray()
    return Buffer.from(bytes)
  }

  async delete(key: string): Promise<void> {
    const [client, { DeleteObjectCommand }] = await Promise.all([
      this.client(),
      import('@aws-sdk/client-s3'),
    ])
    await client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    )
  }

  async exists(key: string): Promise<boolean> {
    const [client, { HeadObjectCommand }] = await Promise.all([
      this.client(),
      import('@aws-sdk/client-s3'),
    ])
    try {
      await client.send(
        new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }),
      )
      return true
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode
      if (status === 404 || (error as { name?: string }).name === 'NotFound') {
        return false
      }
      throw error
    }
  }

  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const [client, { GetObjectCommand }, { getSignedUrl }] = await Promise.all([
      this.client(),
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
    ])
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      { expiresIn: options?.expiresIn ?? DEFAULT_SIGNED_URL_EXPIRY_SECONDS },
    )
  }
}
