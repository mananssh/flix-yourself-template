/**
 * Prisma-backed implementation of the {@link CatalogService} contract.
 *
 * This module is the single place that knows how catalog data is stored and
 * queried. It depends on the shared Prisma client (`lib/db`) — which is itself
 * database-agnostic via driver adapters — and maps Prisma rows to the plain,
 * JSON-serializable DTOs declared in `../types`.
 */

import type {
  Episode,
  EpisodeImage,
  EpisodeVideo,
  Media,
  MediaCollection,
  MediaImage,
  MediaVideo,
  Prisma,
} from '@prisma/client'

import { prisma } from '@/lib/db'

import type {
  CatalogProviderName,
  CatalogService,
  CollectionSummary,
  CollectionWithMedia,
  EpisodeDTO,
  GenreDTO,
  ImageDTO,
  MediaDetail,
  MediaFilters,
  MediaSummary,
  PersonDTO,
  VideoDTO,
} from '../types'

/* -------------------------------------------------------------------------- */
/*                               Row → DTO mappers                            */
/* -------------------------------------------------------------------------- */

// Media and episode images/videos are distinct Prisma models with identical
// relevant fields. The mappers accept the shared structural shape so a single
// implementation serves both.
type ImageRow = MediaImage | EpisodeImage
type VideoRow = MediaVideo | EpisodeVideo

function toImageDTO(image: ImageRow): ImageDTO {
  return {
    id: image.id,
    type: image.type,
    storagePath: image.storagePath,
    url: image.url,
    width: image.width,
    height: image.height,
  }
}

function toVideoDTO(video: VideoRow): VideoDTO {
  return {
    id: video.id,
    storagePath: video.storagePath,
    container: video.container,
    language: video.language,
    // BigInt is not JSON-serializable — surface it as a string.
    sizeBytes: video.sizeBytes === null ? null : video.sizeBytes.toString(),
  }
}

/**
 * Resolve the public URL of the first image of `type`, preferring an explicit
 * `url`. Returns `null` when no such image exists or it has no URL. (Objects
 * stored without a public URL are resolved through the storage seam elsewhere.)
 */
function resolveImageUrl(
  images: MediaImage[],
  type: MediaImage['type'],
): string | null {
  const match = images.find((image) => image.type === type)
  return match?.url ?? null
}

/** Media with the relations needed to build a {@link MediaSummary}. */
type MediaWithSummaryRelations = Media & {
  images: MediaImage[]
  genres: Array<{ genre: { id: string; name: string } }>
}

function toGenreDTOs(
  genres: Array<{ genre: { id: string; name: string } }>,
): GenreDTO[] {
  return genres.map(({ genre }) => ({ id: genre.id, name: genre.name }))
}

function toMediaSummary(media: MediaWithSummaryRelations): MediaSummary {
  return {
    id: media.id,
    title: media.title,
    type: media.type,
    releaseYear: media.releaseYear,
    durationSec: media.durationSec,
    maturityRating: media.maturityRating,
    posterUrl: resolveImageUrl(media.images, 'POSTER'),
    backdropUrl: resolveImageUrl(media.images, 'BACKDROP'),
    genres: toGenreDTOs(media.genres),
  }
}

/** Episode with the relations needed to build an {@link EpisodeDTO}. */
type EpisodeWithRelations = Episode & {
  videos: EpisodeVideo[]
  images: EpisodeImage[]
}

function toEpisodeDTO(episode: EpisodeWithRelations): EpisodeDTO {
  return {
    id: episode.id,
    title: episode.title,
    description: episode.description,
    episodeNumber: episode.episodeNumber,
    durationSec: episode.durationSec,
    releaseYear: episode.releaseYear,
    videos: episode.videos.map(toVideoDTO),
    images: episode.images.map(toImageDTO),
  }
}

/** Media with the full relation graph needed for a {@link MediaDetail}. */
type MediaWithDetailRelations = MediaWithSummaryRelations & {
  videos: MediaVideo[]
  people: Array<{ role: PersonDTO['role']; person: { id: string; name: string } }>
  episodes: EpisodeWithRelations[]
}

function toMediaDetail(media: MediaWithDetailRelations): MediaDetail {
  return {
    ...toMediaSummary(media),
    description: media.description,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
    images: media.images.map(toImageDTO),
    videos: media.videos.map(toVideoDTO),
    people: media.people.map(
      ({ person, role }): PersonDTO => ({
        id: person.id,
        name: person.name,
        role,
      }),
    ),
    episodes: media.episodes.map(toEpisodeDTO),
  }
}

type CollectionWithCount = MediaCollection & {
  _count: { items: number }
}

function toCollectionSummary(collection: CollectionWithCount): CollectionSummary {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    itemCount: collection._count.items,
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Provider                                   */
/* -------------------------------------------------------------------------- */

/** `include` used wherever a {@link MediaSummary} is built. */
const summaryInclude = {
  images: { where: { type: { in: ['POSTER', 'BACKDROP'] as const } } },
  genres: { include: { genre: true } },
} satisfies Prisma.MediaInclude

export class PrismaCatalogService implements CatalogService {
  readonly name: CatalogProviderName = 'prisma'

  async listMedia(filters: MediaFilters = {}): Promise<MediaSummary[]> {
    const where: Prisma.MediaWhereInput = {}

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.genre) {
      where.genres = {
        some: {
          genre: { name: { equals: filters.genre, mode: 'insensitive' } },
        },
      }
    }

    const media = await prisma.media.findMany({
      where,
      include: summaryInclude,
      orderBy: { createdAt: 'desc' },
    })

    return media.map(toMediaSummary)
  }

  async getMediaById(id: string): Promise<MediaDetail | null> {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        images: true,
        videos: true,
        genres: { include: { genre: true } },
        people: { include: { person: true } },
        episodes: {
          include: { videos: true, images: true },
          orderBy: { episodeNumber: 'asc' },
        },
      },
    })

    return media ? toMediaDetail(media) : null
  }

  async getCollections(): Promise<CollectionSummary[]> {
    const collections = await prisma.mediaCollection.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    })

    return collections.map(toCollectionSummary)
  }

  async getMediaByCollection(
    collectionId: string,
  ): Promise<CollectionWithMedia | null> {
    const collection = await prisma.mediaCollection.findUnique({
      where: { id: collectionId },
      include: {
        _count: { select: { items: true } },
        items: {
          include: { media: { include: summaryInclude } },
          // Explicit order (sortOrder, then title) so the result is stable for
          // items that share or omit a sortOrder.
          orderBy: [
            { sortOrder: { sort: 'asc', nulls: 'last' } },
            { media: { title: 'asc' } },
          ],
        },
      },
    })

    if (!collection) return null

    return {
      ...toCollectionSummary(collection),
      media: collection.items.map((item) => toMediaSummary(item.media)),
    }
  }
}
