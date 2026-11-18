/**
 * GET /api/media/file/[...key]
 *
 * Streams a stored media object (video, image, subtitle…) through the storage
 * seam. This is the app-served delivery route the **local** storage provider
 * points its signed URLs at; cloud providers (S3/R2/GCS/Azure) hand out direct
 * presigned URLs instead, so they never hit this route.
 *
 * It honours HTTP range requests — essential for `<video>` seeking — by reading
 * only the requested byte range off disk and replying `206 Partial Content`
 * with `Content-Range`. Requests without a `Range` header get the whole object
 * (`200`) plus `Accept-Ranges: bytes` so the client knows it may seek.
 *
 * The object key is provider-agnostic and forward-slash separated (e.g.
 * `samples/sample-video.mp4`); it arrives here as the catch-all path segments,
 * which the local provider resolves (and guards against traversal).
 */

import { getStorage } from '@/lib/storage'

// Streaming reads touch the filesystem per request — never cache the handler.
export const dynamic = 'force-dynamic'

/** One year, in seconds — media objects are immutable once stored. */
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

/** Map a file extension to a MIME type for the `Content-Type` header. */
const CONTENT_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  vtt: 'text/vtt',
  srt: 'application/x-subrip',
}

function contentTypeForKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? ''
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

/**
 * Parse a single-range `Range` header against a known object `size`.
 *
 * Returns the resolved inclusive `[start, end]`, `null` when there is no
 * (parseable, single) range so the caller should serve the whole object, or
 * `'unsatisfiable'` when the range falls outside the object (→ 416).
 */
function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | null | 'unsatisfiable' {
  if (!header) return null

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return null // Multi-range or malformed → serve the whole object.

  const [, rawStart, rawEnd] = match
  if (rawStart === '' && rawEnd === '') return null

  let start: number
  let end: number
  if (rawStart === '') {
    // Suffix range: the final N bytes (`bytes=-500`).
    const suffix = Number(rawEnd)
    if (suffix === 0) return 'unsatisfiable'
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(rawStart)
    end = rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1)
  }

  if (start > end || start >= size) return 'unsatisfiable'
  return { start, end }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params
  // Segments were percent-encoded per path component when the URL was built.
  const key = segments.map((segment) => decodeURIComponent(segment)).join('/')

  try {
    const storage = await getStorage()

    // Fast, memory-efficient path: providers that can stat + stream (local).
    if (storage.stat && storage.createReadStream) {
      let size: number
      try {
        ;({ size } = await storage.stat(key))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return new Response('Not found', { status: 404 })
        }
        throw error
      }

      const contentType = contentTypeForKey(key)
      const range = parseRange(request.headers.get('range'), size)

      if (range === 'unsatisfiable') {
        return new Response('Range Not Satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${size}` },
        })
      }

      const baseHeaders: Record<string, string> = {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': IMMUTABLE_CACHE,
      }

      if (range) {
        const length = range.end - range.start + 1
        const body = await storage.createReadStream(key, range)
        return new Response(body, {
          status: 206,
          headers: {
            ...baseHeaders,
            'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
            'Content-Length': String(length),
          },
        })
      }

      const body = await storage.createReadStream(key)
      return new Response(body, {
        status: 200,
        headers: { ...baseHeaders, 'Content-Length': String(size) },
      })
    }

    // Fallback for providers without streaming (buffers the whole object).
    try {
      const buffer = await storage.get(key)
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': contentTypeForKey(key),
          'Content-Length': String(buffer.byteLength),
          'Cache-Control': IMMUTABLE_CACHE,
        },
      })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return new Response('Not found', { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error(`[api] GET /api/media/file/${key}:`, error)
    return new Response('Internal server error', { status: 500 })
  }
}

/** HEAD mirrors GET's headers (size, type, range support) without a body. */
export async function HEAD(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params
  const key = segments.map((segment) => decodeURIComponent(segment)).join('/')

  try {
    const storage = await getStorage()
    if (!storage.stat) {
      return new Response(null, { status: 200 })
    }
    const { size } = await storage.stat(key)
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': contentTypeForKey(key),
        'Content-Length': String(size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': IMMUTABLE_CACHE,
      },
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new Response(null, { status: 404 })
    }
    console.error(`[api] HEAD /api/media/file/${key}:`, error)
    return new Response(null, { status: 500 })
  }
}
