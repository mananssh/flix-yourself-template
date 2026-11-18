import { createReadStream, promises as fs } from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'

import type { LocalStorageConfig } from '@/lib/config/schema'

import type {
  ByteRange,
  StorageBody,
  StorageObjectStat,
  StorageProvider,
} from '../types'

/**
 * Local filesystem storage provider.
 *
 * The minimal, zero-dependency default: objects are written under a base
 * directory on local disk. Suitable for development and single-node
 * self-hosting. Not suitable for distributed/serverless deployments (Vercel,
 * Netlify) where the filesystem is ephemeral or read-only.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local' as const

  private readonly root: string
  private readonly baseUrl: string

  constructor(config: LocalStorageConfig) {
    this.root = path.resolve(process.cwd(), config.path)
    // Normalize to a single trailing-slash-free prefix.
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
  }

  /**
   * Resolves a provider key to an absolute path, guarding against traversal
   * outside the storage root (e.g. keys containing `../`).
   */
  private resolveKey(key: string): string {
    const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '')
    const full = path.resolve(this.root, normalized)
    if (full !== this.root && !full.startsWith(this.root + path.sep)) {
      throw new Error(`Invalid storage key (path traversal): "${key}"`)
    }
    return full
  }

  async put(key: string, body: StorageBody): Promise<void> {
    const full = this.resolveKey(key)
    await fs.mkdir(path.dirname(full), { recursive: true })
    await fs.writeFile(full, body)
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolveKey(key))
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolveKey(key))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveKey(key))
      return true
    } catch {
      return false
    }
  }

  /**
   * Returns an app-served URL for the object.
   *
   * Local URLs are not cryptographically signed or time-limited — access
   * control is the responsibility of the serving route.
   */
  async getSignedUrl(key: string): Promise<string> {
    const encoded = key.split('/').map(encodeURIComponent).join('/')
    return `${this.baseUrl}/${encoded}`
  }

  /** Return an object's size without reading its bytes. */
  async stat(key: string): Promise<StorageObjectStat> {
    const stats = await fs.stat(this.resolveKey(key))
    return { size: stats.size }
  }

  /**
   * Stream an object (or a byte range of it) straight off disk as a web
   * {@link ReadableStream}, so the serving route can satisfy HTTP range
   * requests without buffering the whole file in memory.
   */
  async createReadStream(
    key: string,
    range?: ByteRange,
  ): Promise<ReadableStream<Uint8Array>> {
    const full = this.resolveKey(key)
    const nodeStream = createReadStream(
      full,
      range ? { start: range.start, end: range.end } : undefined,
    )
    // Readable.toWeb yields a ReadableStream<Uint8Array> for a byte stream.
    return Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>
  }
}
