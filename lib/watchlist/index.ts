/**
 * Watchlist service for tracking watch progress.
 */

import { prisma } from '@/lib/db'
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
