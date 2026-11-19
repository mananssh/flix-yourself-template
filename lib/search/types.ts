/**
 * Search types and configuration.
 *
 * The search service uses Fuse.js to provide fuzzy, typo-tolerant search over
 * the catalog. Results include relevance scores and can be filtered/limited.
 */

import type { MediaType } from '@prisma/client'

/**
 * A single search result with relevance scoring.
 */
export interface SearchResult {
  id: string
  title: string
  type: MediaType
  releaseYear: number | null
  posterUrl: string | null
  genres: string[]
  /** People (actors, directors, creators) associated with this media. */
  people: string[]
  /** Short description snippet. */
  description: string | null
  /** Fuse.js relevance score (0 = perfect match, 1 = no match). Lower is better. */
  score: number
}

/**
 * Flattened media document for Fuse.js indexing.
 * All searchable text fields are denormalized here.
 */
export interface SearchDocument {
  id: string
  title: string
  type: MediaType
  releaseYear: number | null
  posterUrl: string | null
  description: string | null
  /** Comma-separated genre names for search. */
  genreNames: string
  /** Comma-separated person names for search. */
  peopleNames: string
  /** Array of genre names for filtering/display. */
  genres: string[]
  /** Array of person names for display. */
  people: string[]
}

/**
 * Fuse.js search configuration.
 * Weights control relevance: higher weight = more important field.
 */
export const SEARCH_CONFIG = {
  /** Minimum query length to trigger search. */
  minQueryLength: 2,
  /** Default number of results to return. */
  defaultLimit: 20,
  /** Maximum results (hard cap). */
  maxLimit: 100,
  /** Fuse.js options. */
  fuseOptions: {
    /** Match tolerance: 0 = exact, 1 = match anything. 0.4 is a good balance. */
    threshold: 0.4,
    /** Ignore location in string (allow matches anywhere). */
    ignoreLocation: true,
    /** Minimum consecutive characters to match. */
    minMatchCharLength: 2,
    /** Include relevance score in results. */
    includeScore: true,
    /** Fields to search with weights. */
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'description', weight: 0.2 },
      { name: 'genreNames', weight: 0.15 },
      { name: 'peopleNames', weight: 0.15 },
      { name: 'type', weight: 0.1 },
    ],
  },
}
