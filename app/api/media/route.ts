import type { NextRequest } from 'next/server'

import { badRequest, ok, serverError } from '@/lib/api/responses'
import { getCatalog, type MediaFilters } from '@/lib/catalog'

/** Media types accepted by the `type` query param (matches the Prisma enum). */
const MEDIA_TYPES = ['MOVIE', 'SERIES', 'CLIP'] as const
type MediaTypeValue = (typeof MEDIA_TYPES)[number]

function isMediaType(value: string): value is MediaTypeValue {
  return (MEDIA_TYPES as readonly string[]).includes(value)
}

/**
 * GET /api/media
 *
 * Lists media, newest first. Optional query params:
 *   - `type`  — one of MOVIE | SERIES | CLIP (case-insensitive)
 *   - `genre` — genre name, matched case-insensitively
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const filters: MediaFilters = {}

    const typeParam = searchParams.get('type')
    if (typeParam) {
      const normalized = typeParam.toUpperCase()
      if (!isMediaType(normalized)) {
        return badRequest(
          `Invalid type "${typeParam}". Expected one of: ${MEDIA_TYPES.join(', ')}.`,
        )
      }
      filters.type = normalized
    }

    const genreParam = searchParams.get('genre')
    if (genreParam) {
      filters.genre = genreParam
    }

    const catalog = await getCatalog()
    const media = await catalog.listMedia(filters)
    return ok(media)
  } catch (error) {
    return serverError('GET /api/media', error)
  }
}
