import type {
  ContainerClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'

import type { AzureStorageConfig } from '@/lib/config/schema'

import {
  DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
  type PutObjectOptions,
  type SignedUrlOptions,
  type StorageBody,
  type StorageProvider,
} from '../types'

interface AzureClients {
  container: ContainerClient
  credential: StorageSharedKeyCredential
}

/**
 * Azure Blob Storage provider.
 *
 * Authenticates with a shared account key and issues short-lived SAS URLs for
 * client-side delivery. The SDK is imported lazily so it only loads when this
 * provider is selected.
 */
export class AzureStorageProvider implements StorageProvider {
  readonly name = 'azure' as const

  private readonly config: AzureStorageConfig
  private clientsPromise: Promise<AzureClients> | undefined

  constructor(config: AzureStorageConfig) {
    this.config = config
  }

  private async clients(): Promise<AzureClients> {
    if (!this.clientsPromise) {
      this.clientsPromise = (async () => {
        const { BlobServiceClient, StorageSharedKeyCredential } = await import(
          '@azure/storage-blob'
        )
        const credential = new StorageSharedKeyCredential(
          this.config.accountName,
          this.config.accountKey,
        )
        const service = new BlobServiceClient(
          `https://${this.config.accountName}.blob.core.windows.net`,
          credential,
        )
        const container = service.getContainerClient(this.config.container)
        return { container, credential }
      })()
    }
    return this.clientsPromise
  }

  async put(key: string, body: StorageBody, options?: PutObjectOptions): Promise<void> {
    const { container } = await this.clients()
    const blob = container.getBlockBlobClient(key)
    await blob.uploadData(Buffer.from(body), {
      blobHTTPHeaders: {
        blobContentType: options?.contentType,
        blobCacheControl: options?.cacheControl,
      },
    })
  }

  async get(key: string): Promise<Buffer> {
    const { container } = await this.clients()
    return container.getBlockBlobClient(key).downloadToBuffer()
  }

  async delete(key: string): Promise<void> {
    const { container } = await this.clients()
    await container.getBlockBlobClient(key).deleteIfExists()
  }

  async exists(key: string): Promise<boolean> {
    const { container } = await this.clients()
    return container.getBlockBlobClient(key).exists()
  }

  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const { container, credential } = await this.clients()
    const { generateBlobSASQueryParameters, BlobSASPermissions } = await import(
      '@azure/storage-blob'
    )
    const expiresIn = options?.expiresIn ?? DEFAULT_SIGNED_URL_EXPIRY_SECONDS
    const blob = container.getBlockBlobClient(key)
    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.config.container,
        blobName: key,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(Date.now() - 60 * 1000),
        expiresOn: new Date(Date.now() + expiresIn * 1000),
      },
      credential,
    ).toString()
    return `${blob.url}?${sas}`
  }
}
