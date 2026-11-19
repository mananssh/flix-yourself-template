/**
 * Watchlist service for tracking watch progress.
 */

import { prisma } from '@/lib/db'
import type { MediaSummary } from '@/lib/catalog'
import type { MediaType } from '@prisma/client'

export interface WatchlistItem {
  id: string
  mediaId: string
  episodeId: string | null
  title: string
  subtitle?: string
  posterUrl: string | null
  type: MediaType
  progressSeconds: number
  progressPercent: number
  durationSec: number
  lastWatchedAt: Date
}

export interface UpdateProgressParams {
  userId: string
  mediaId: string
  episodeId?: string
  progressSeconds: number
}

/**
 * Get continue watching items for a user.
 * Returns items that have been started but not finished.
 */
export async function getContinueWatching(
  userId: string,
  limit = 8,
): Promise<WatchlistItem[]> {
  const watchlist = await prisma.watchlist.findMany({
    where: {
      userId,
      progressSeconds: {
        gt: 0,
      },
    },
    include: {
      media: {
        include: {
          images: {
            where: { type: 'POSTER' },
            take: 1,
          },
        },
      },
      episode: {
        include: {
          media: true,
        },
      },
    },
    orderBy: {
      lastWatchedAt: 'desc',
    },
    take: limit,
  })

  // Filter out finished items and map to WatchlistItem
  const items: WatchlistItem[] = []

  for (const item of watchlist) {
    // Determine duration and check if finished
    let durationSec: number
    let title: string
    let subtitle: string | undefined

    if (item.episode) {
      // For episodes, use episode duration
      durationSec = item.episode.durationSec ?? 0
      title = item.episode.title
      subtitle = item.media.title
    } else {
      // For movies, use media duration
      durationSec = item.media.durationSec ?? 0
      title = item.media.title
      subtitle = undefined
    }

    // Skip if no duration or if watched within 60 seconds of end (consider finished)
    if (durationSec === 0 || item.progressSeconds >= durationSec - 60) {
      continue
    }

    const progressPercent = Math.floor(
      (item.progressSeconds / durationSec) * 100,
    )

    items.push({
      id: item.episodeId ?? item.mediaId,
      mediaId: item.mediaId,
      episodeId: item.episodeId,
      title,
      subtitle,
      posterUrl: item.media.images[0]?.url ?? null,
      type: item.media.type,
      progressSeconds: item.progressSeconds,
      progressPercent,
      durationSec,
      lastWatchedAt: item.lastWatchedAt,
    })
  }

  return items
}

/**
 * Update or create a watchlist entry with progress.
 */
export async function updateProgress({
  userId,
  mediaId,
  episodeId,
  progressSeconds,
}: UpdateProgressParams): Promise<void> {
  await prisma.watchlist.upsert({
    where: {
      userId_mediaId: {
        userId,
        mediaId,
      },
    },
    update: {
      episodeId: episodeId ?? null,
      progressSeconds,
      lastWatchedAt: new Date(),
    },
    create: {
      userId,
      mediaId,
      episodeId: episodeId ?? null,
      progressSeconds,
      lastWatchedAt: new Date(),
    },
  })
}

/**
 * Add media to user's watchlist ("My List").
 * Creates a watchlist entry with zero progress if it doesn't exist.
 */
export async function addToWatchlist(
  userId: string,
  mediaId: string,
): Promise<void> {
  await prisma.watchlist.upsert({
    where: {
      userId_mediaId: {
        userId,
        mediaId,
      },
    },
    update: {
      // Already exists, do nothing (idempotent)
    },
    create: {
      userId,
      mediaId,
      episodeId: null,
      progressSeconds: 0,
      lastWatchedAt: new Date(),
    },
  })
}

/**
 * Remove media from user's watchlist ("My List").
 */
export async function removeFromWatchlist(
  userId: string,
  mediaId: string,
): Promise<void> {
  await prisma.watchlist.delete({
    where: {
      userId_mediaId: {
        userId,
        mediaId,
      },
    },
  }).catch(() => {
    // Ignore if not found (idempotent)
  })
}

/**
 * Check if media is in user's watchlist.
 */
export async function isInWatchlist(
  userId: string,
  mediaId: string,
): Promise<boolean> {
  const item = await prisma.watchlist.findUnique({
    where: {
      userId_mediaId: {
        userId,
        mediaId,
      },
    },
  })
  return item !== null
}

/**
 * Get all items in user's watchlist ("My List").
 * Returns items ordered by when they were added (most recent first).
 */
export async function getWatchlist(userId: string): Promise<MediaSummary[]> {
  const items = await prisma.watchlist.findMany({
    where: {
      userId,
    },
    include: {
      media: {
        include: {
          images: {
            where: { type: 'POSTER' },
            take: 1,
          },
          genres: {
            include: {
              genre: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return items.map((item) => ({
    id: item.media.id,
    title: item.media.title,
    type: item.media.type,
    releaseYear: item.media.releaseYear,
    posterUrl: item.media.images[0]?.url ?? null,
    backdropUrl: null, // Not needed for watchlist cards
    durationSec: item.media.durationSec,
    maturityRating: item.media.maturityRating,
    genres: item.media.genres.map((mg) => ({
      id: mg.genre.id,
      name: mg.genre.name,
    })),
  }))
}
