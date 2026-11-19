/**
 * Search service using Fuse.js for fuzzy matching.
 *
 * This module creates a search index from catalog data and provides a simple
 * search interface. The index is cached in memory and rebuilt when the
 * underlying catalog changes.
 */

import Fuse from 'fuse.js'

import type { MediaDetail } from '@/lib/catalog'

import {
  SEARCH_CONFIG,
  type SearchDocument,
  type SearchResult,
} from './types'

export type { SearchDocument, SearchResult }

/**
 * Converts a MediaDetail to a flattened SearchDocument for indexing.
 */
function toSearchDocument(media: MediaDetail): SearchDocument {
  const genres = media.genres.map((g) => g.name)
  const people = media.people.map((p) => p.name)

  return {
    id: media.id,
    title: media.title,
    type: media.type,
    releaseYear: media.releaseYear,
    posterUrl: media.posterUrl,
    description: media.description,
    genreNames: genres.join(', '),
    peopleNames: people.join(', '),
    genres,
    people,
  }
}

/**
 * Creates a Fuse.js search index from an array of media items.
 */
export function createSearchIndex(
  media: MediaDetail[],
): Fuse<SearchDocument> {
  const documents = media.map(toSearchDocument)
  return new Fuse(documents, SEARCH_CONFIG.fuseOptions)
}

/**
 * Searches the index and returns results with scores.
 *
 * @param index - Fuse.js search index
 * @param query - Search query string
 * @param limit - Maximum number of results (default from config)
 * @returns Array of search results, ordered by relevance
 */
export function search(
  index: Fuse<SearchDocument>,
  query: string,
  limit: number = SEARCH_CONFIG.defaultLimit,
): SearchResult[] {
  const trimmed = query.trim()

  // Return empty for queries below minimum length
  if (trimmed.length < SEARCH_CONFIG.minQueryLength) {
    return []
  }

  // Cap the limit
  const cappedLimit = Math.min(limit, SEARCH_CONFIG.maxLimit)

  // Perform the search
  const results = index.search(trimmed, { limit: cappedLimit })

  // Map Fuse results to our SearchResult type
  return results.map((result) => ({
    id: result.item.id,
    title: result.item.title,
    type: result.item.type,
    releaseYear: result.item.releaseYear,
    posterUrl: result.item.posterUrl,
    genres: result.item.genres,
    people: result.item.people,
    description: result.item.description,
    score: result.score ?? 1, // Default to 1 (no match) if score is missing
  }))
}

/**
 * Convenience function to convert SearchResults to MediaSummary-compatible shape.
 * Adds the missing fields needed for MediaCard rendering.
 */
export function toMediaSummary(result: SearchResult) {
  return {
    id: result.id,
    title: result.title,
    type: result.type,
    releaseYear: result.releaseYear,
    posterUrl: result.posterUrl,
    backdropUrl: null, // Not needed for cards
    durationSec: null, // Not needed for cards
    maturityRating: null, // Not needed for cards
    genres: result.genres.map((name, idx) => ({ id: `genre-${idx}`, name })),
  }
}
