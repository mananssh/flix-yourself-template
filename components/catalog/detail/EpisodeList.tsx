import Image from 'next/image'

import type { EpisodeDTO } from '@/lib/catalog'
import { formatDuration } from '@/lib/format'

/** Resolve an episode's thumbnail/still URL, if any. */
function episodeImageUrl(episode: EpisodeDTO): string | null {
  const image =
    episode.images.find((img) => img.type === 'THUMBNAIL') ??
    episode.images.find((img) => img.type === 'STILL') ??
    episode.images[0]
  return image?.url ?? null
}

/**
 * Ordered episode list for a series detail page. Each row shows the episode
 * number, title, duration, a still/thumbnail (when available), and description.
 * Renders nothing for media without episodes.
 */
export function EpisodeList({ episodes }: { episodes: EpisodeDTO[] }) {
  if (episodes.length === 0) return null

  return (
    <ol className="flex flex-col divide-y divide-white/10">
      {episodes.map((episode) => {
        const duration = formatDuration(episode.durationSec)
        const imageUrl = episodeImageUrl(episode)

        return (
          <li
            key={episode.id}
            className="flex gap-4 py-4 first:pt-0 sm:gap-5"
          >
            <span
              className="mt-0.5 w-6 shrink-0 text-center text-lg font-semibold text-white/40 tabular-nums sm:text-xl"
              aria-hidden
            >
              {episode.episodeNumber}
            </span>

            <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10 sm:w-44">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={`${episode.title} thumbnail`}
                  fill
                  sizes="(max-width: 640px) 128px, 176px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] font-medium text-white/30">
                  No preview
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                  <span className="sr-only">Episode {episode.episodeNumber}: </span>
                  {episode.title}
                </h3>
                {duration && (
                  <span className="shrink-0 text-xs text-white/50 tabular-nums">
                    {duration}
                  </span>
                )}
              </div>
              {episode.description && (
                <p className="mt-1 line-clamp-2 text-xs text-white/60 sm:text-sm">
                  {episode.description}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
