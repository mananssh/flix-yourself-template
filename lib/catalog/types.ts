/**
 * Catalog read-layer types.
 *
 * The catalog seam exposes read access to media, collections, and their
 * relations through a single {@link CatalogService} contract. The rest of the
 * app (API routes, server components) depends only on this interface — never on
 * Prisma or a specific query shape — so the backing implementation can be
 * swapped (e.g. a Prisma provider in production, an in-memory provider in
 * tests) without touching callers.
 *
 * All shapes here are plain, JSON-serializable DTOs: Prisma `BigInt` columns are
 * surfaced as strings and relations are flattened to the fields the UI needs, so
 * a route can `return Response.json(await catalog.listMedia())` directly.
 */

import type {
  EpisodeImageType,
  ImageType,
  MediaType,
  PersonRole,
} from '@prisma/client'

/** Backends that can satisfy the {@link CatalogService} contract. */
export type CatalogProviderName = 'prisma'

/** Optional filters for {@link CatalogService.listMedia}. */
export interface MediaFilters {
  /** Restrict to a single media type (MOVIE, SERIES, CLIP). */
  type?: MediaType
  /**
   * Restrict to media tagged with this genre. Matched case-insensitively
   * against the genre name (e.g. `action`).
   */
  genre?: string
}

/**
 * An image associated with a media item or episode. `type` is an {@link ImageType}
 * for media images (POSTER/BACKDROP/THUMBNAIL) or an {@link EpisodeImageType}
 * (THUMBNAIL/STILL) for episode images.
 */
export interface ImageDTO {
  id: string
  type: ImageType | EpisodeImageType
  storagePath: string
  /** Public/CDN URL when available; otherwise `null` (resolve via storage). */
  url: string | null
  width: number | null
  height: number | null
}

/** A playable video rendition. */
export interface VideoDTO {
  id: string
  storagePath: string
  container: string
  language: string | null
  /** Byte size as a string (BigInt is not JSON-safe), or `null` if unknown. */
  sizeBytes: string | null
}

/** A genre tag. */
export interface GenreDTO {
  id: string
  name: string
}

/** A person credited on a media item, with their role. */
export interface PersonDTO {
  id: string
  name: string
  role: PersonRole
}

/** An episode of a series. */
export interface EpisodeDTO {
  id: string
  title: string
  description: string | null
  episodeNumber: number
  durationSec: number | null
  releaseYear: number | null
  videos: VideoDTO[]
  images: ImageDTO[]
}

/**
 * Lightweight media shape for grids and lists. Carries just enough to render a
 * card — identity, title/year/type, and resolved poster/backdrop URLs — without
 * loading every relation.
 */
export interface MediaSummary {
  id: string
  title: string
  type: MediaType
  releaseYear: number | null
  durationSec: number | null
  maturityRating: string | null
  /** Resolved POSTER image URL, or `null` when none is available. */
  posterUrl: string | null
  /** Resolved BACKDROP image URL, or `null` when none is available. */
  backdropUrl: string | null
  genres: GenreDTO[]
}

/**
 * Full media shape with every relation, for a detail page. Extends
 * {@link MediaSummary} with the complete image/video/people/episode graph.
 */
export interface MediaDetail extends MediaSummary {
  description: string | null
  createdAt: string
  updatedAt: string
  images: ImageDTO[]
  videos: VideoDTO[]
  people: PersonDTO[]
  /** Episodes, ordered by episode number. Empty for non-series media. */
  episodes: EpisodeDTO[]
}

/** A media collection without its items. */
export interface CollectionSummary {
  id: string
  name: string
  description: string | null
  /** Number of media items in the collection. */
  itemCount: number
}

/** A collection together with its ordered media items. */
export interface CollectionWithMedia extends CollectionSummary {
  media: MediaSummary[]
}

/**
 * Read contract for the catalog. Every backend implements this identical
 * surface, so callers depend only on the interface.
 *
 * Methods that look up a single entity by id resolve to `null` when it does not
 * exist, rather than throwing, so callers can map a miss to a 404.
 */
export interface CatalogService {
  /** The provider this instance represents. */
  readonly name: CatalogProviderName

  /** List media, newest first, optionally filtered by type and/or genre. */
  listMedia(filters?: MediaFilters): Promise<MediaSummary[]>

  /** Fetch a single media item with all relations, or `null` if not found. */
  getMediaById(id: string): Promise<MediaDetail | null>

  /** List all collections, alphabetically by name. */
  getCollections(): Promise<CollectionSummary[]>

  /**
   * Fetch a collection and its media (ordered by `sortOrder`, then title), or
   * `null` if the collection does not exist.
   */
  getMediaByCollection(collectionId: string): Promise<CollectionWithMedia | null>
}
