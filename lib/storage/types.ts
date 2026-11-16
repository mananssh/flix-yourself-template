/**
 * Storage seam types.
 *
 * Every storage backend (local filesystem, S3, R2, GCS, Azure) implements the
 * same {@link StorageProvider} interface, so the rest of the app depends only on
 * this contract — never on a specific SDK. Swap providers via the
 * `STORAGE_PROVIDER` environment variable; no code changes required.
 */

export type StorageProviderName = 'local' | 's3' | 'r2' | 'gcs' | 'azure';

/** A binary payload accepted by {@link StorageProvider.put}. */
export type StorageBody = Buffer | Uint8Array;

export interface PutObjectOptions {
  /** MIME type stored with the object (e.g. `video/mp4`). */
  contentType?: string;
  /** Cache-Control header to associate with the object, where supported. */
  cacheControl?: string;
}

export interface SignedUrlOptions {
  /** Seconds until the generated URL expires. Defaults to 3600 (1 hour). */
  expiresIn?: number;
}

/**
 * Contract implemented by every storage backend.
 *
 * Keys are provider-agnostic, forward-slash separated paths (e.g.
 * `media/123/video.mp4`). Implementations normalize these to their native
 * addressing scheme.
 */
export interface StorageProvider {
  /** The provider this instance represents. */
  readonly name: StorageProviderName;

  /** Store (or overwrite) an object at `key`. */
  put(key: string, body: StorageBody, options?: PutObjectOptions): Promise<void>;

  /** Read an object's full contents into memory. Use for small files only. */
  get(key: string): Promise<Buffer>;

  /** Remove an object. No-op if it does not exist. */
  delete(key: string): Promise<void>;

  /** Whether an object exists at `key`. */
  exists(key: string): Promise<boolean>;

  /**
   * A time-limited URL a client can use to fetch the object directly.
   *
   * For cloud providers this is a presigned URL that offloads delivery from the
   * app server — the recommended path for streaming video. For local storage it
   * is an app-served route.
   */
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
}

/** Default expiry (seconds) for generated signed URLs. */
export const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 3600;
