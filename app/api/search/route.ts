/**
 * GET /api/search
 *
 * Fuzzy search endpoint using Fuse.js. Returns media matching the query,
 * ordered by relevance.
 *
 * Query parameters:
 *   - q: search query (required, min 2 chars)
 *   - limit: max results (optional, default 20, max 100)
 *
 * Returns:
 *   - 200: { results: SearchResult[], count: number, query: string }
 *   - 400: { error: string } when query is missing or too short
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type Fuse from 'fuse.js'

import { getCatalog } from '@/lib/catalog'
import { createSearchIndex, search, type SearchDocument } from '@/lib/search'
import { SEARCH_CONFIG } from '@/lib/search/types'

// Cache the Fuse.js index across requests in development. In production, this
// persists for the lifetime of the serverless function.
const globalForSearch = globalThis as unknown as {
  searchIndex: Fuse<SearchDocument> | undefined
  searchIndexBuiltAt: number | undefined
}

// Rebuild the index every 5 minutes to pick up new content
const INDEX_TTL_MS = 5 * 60 * 1000

async function getSearchIndex(): Promise<Fuse<SearchDocument>> {
  const now = Date.now()

  // Return cached index if still valid
  if (
    globalForSearch.searchIndex &&
    globalForSearch.searchIndexBuiltAt &&
    now - globalForSearch.searchIndexBuiltAt < INDEX_TTL_MS
  ) {
    return globalForSearch.searchIndex
  }

  // Rebuild the index
  const catalog = await getCatalog()
  
  // Fetch all media with full details (needed for people/genres)
  // In a real production app with many thousands of items, you'd want to:
  // 1. Use a dedicated search service (Algolia, Elasticsearch, etc.)
  // 2. Or maintain a separate denormalized search table
  // For a streaming catalog of hundreds/low thousands of items, this works fine.
  const allMedia = await catalog.listMedia({})
  
  // Fetch full details for each media item to get people/genres
  const mediaDetails = await Promise.all(
    allMedia.map((m) => catalog.getMediaById(m.id))
  )
  
  // Filter out nulls (shouldn't happen, but type-safe)
  const validMedia = mediaDetails.filter(
    (m): m is NonNullable<typeof m> => m !== null
  )

  const index = createSearchIndex(validMedia)
  
  globalForSearch.searchIndex = index
  globalForSearch.searchIndexBuiltAt = now
  
  return index
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')
  const limitParam = searchParams.get('limit')

  // Validate query
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    )
  }

  if (query.trim().length < SEARCH_CONFIG.minQueryLength) {
    return NextResponse.json(
      {
        error: `Query must be at least ${SEARCH_CONFIG.minQueryLength} characters`,
      },
      { status: 400 }
    )
  }

  // Parse limit
  const limit = limitParam
    ? Math.min(parseInt(limitParam, 10), SEARCH_CONFIG.maxLimit)
    : SEARCH_CONFIG.defaultLimit

  try {
    // Get or build the search index
    const index = await getSearchIndex()

    // Perform the search
    const results = search(index, query, limit)

    return NextResponse.json({
      results,
      count: results.length,
      query: query.trim(),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error during search' },
      { status: 500 }
    )
  }
}
