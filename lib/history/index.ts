/**
 * History service for viewing history tracking.
 * Uses the existing Watchlist model, filtering by lastWatchedAt.
 */

import { prisma } from '@/lib/db'
import type { HistoryItem } from './types'

/**
 * Get viewing history for a user.
 * Returns all items with a lastWatchedAt timestamp, ordered by most recent.
 */
export async function getHistory(
  userId: string,
  limit = 50,
): Promise<HistoryItem[]> {
  const watchlist = await prisma.watchlist.findMany({
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

  return watchlist.map((item) => {
    // Determine title and duration based on whether it's an episode or movie
    let title: string
    let subtitle: string | undefined
    let durationSec: number | null

    if (item.episode) {
      title = item.episode.title
      subtitle = item.media.title
      durationSec = item.episode.durationSec
    } else {
      title = item.media.title
      subtitle = undefined
      durationSec = item.media.durationSec
    }

    return {
      id: item.episodeId ?? item.mediaId,
      mediaId: item.mediaId,
      episodeId: item.episodeId,
      title,
      subtitle,
      posterUrl: item.media.images[0]?.url ?? null,
      type: item.media.type,
      progressSeconds: item.progressSeconds,
      durationSec,
      lastWatchedAt: item.lastWatchedAt,
      releaseYear: item.media.releaseYear,
    }
  })
}

/**
 * Clear all viewing history for a user.
 * Deletes all watchlist records.
 */
export async function clearHistory(userId: string): Promise<number> {
  const result = await prisma.watchlist.deleteMany({
    where: {
      userId,
    },
  })

  return result.count
}

/**
 * Remove a single item from viewing history.
 * Deletes the specific watchlist record for the media.
 */
export async function removeFromHistory(
  userId: string,
  mediaId: string,
): Promise<void> {
  await prisma.watchlist
    .delete({
      where: {
        userId_mediaId: {
          userId,
          mediaId,
        },
      },
    })
    .catch(() => {
      // Ignore if not found (idempotent)
    })
}
