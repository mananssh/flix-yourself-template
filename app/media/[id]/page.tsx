import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CastList } from '@/components/catalog/detail/CastList'
import { EpisodeList } from '@/components/catalog/detail/EpisodeList'
import { PlaybackActions } from '@/components/catalog/detail/PlaybackActions'
import { getCatalog, type MediaDetail } from '@/lib/catalog'
import {
  formatDuration,
  formatEpisodeCount,
  MEDIA_TYPE_LABEL,
} from '@/lib/format'

// Detail data is read from the database per request.
export const dynamic = 'force-dynamic'

/** Fetch a media item once, shared by metadata and the page render. */
async function fetchMedia(id: string): Promise<MediaDetail | null> {
  const catalog = await getCatalog()
  return catalog.getMediaById(id)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const media = await fetchMedia(id)
  if (!media) return { title: 'Not found · Flix Yourself' }
  return {
    title: `${media.title} · Flix Yourself`,
    description: media.description ?? undefined,
  }
}

/** A single bullet-separated metadata item (year, rating, duration, …). */
function MetaItem({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>
}

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const media = await fetchMedia(id)
  if (!media) notFound()

  const heroUrl = media.backdropUrl ?? media.posterUrl
  const duration = formatDuration(media.durationSec)
  const episodeCount = formatEpisodeCount(media.episodes.length)
  const isSeries = media.type === 'SERIES'
  const canPlay = isSeries
    ? media.episodes.some((episode) => episode.videos.length > 0)
    : media.videos.length > 0

  // Build the bullet-separated meta row, omitting absent values.
  const metaItems = [
    media.releaseYear !== null ? String(media.releaseYear) : null,
    MEDIA_TYPE_LABEL[media.type],
    media.maturityRating,
    isSeries ? episodeCount : duration,
  ].filter((item): item is string => Boolean(item))

  return (
    <main className="min-h-screen pb-16">
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden sm:h-[56vh] lg:h-[64vh]">
          {heroUrl ? (
            <Image
              src={heroUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-white/10 to-transparent" />
          )}
          {/* Fades: bottom into the page background, left for text legibility. */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-transparent" />
        </div>

        <Link
          href="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:left-6 sm:top-6"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>

        {/* Overlapping content */}
        <div className="relative z-10 mx-auto -mt-28 max-w-[1100px] px-4 sm:-mt-36 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {/* Poster */}
            <div className="relative hidden aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg bg-white/5 shadow-2xl ring-1 ring-white/10 sm:block lg:w-52">
              {media.posterUrl ? (
                <Image
                  src={media.posterUrl}
                  alt={`${media.title} poster`}
                  fill
                  sizes="(max-width: 1024px) 160px, 208px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-3 text-center text-sm text-white/50">
                  {media.title}
                </div>
              )}
            </div>

            {/* Title + meta + actions */}
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {media.title}
              </h1>

              {metaItems.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/70">
                  {metaItems.map((item, index) => (
                    <span key={item} className="flex items-center gap-2">
                      {index > 0 && (
                        <span className="text-white/30" aria-hidden>
                          •
                        </span>
                      )}
                      <MetaItem>{item}</MetaItem>
                    </span>
                  ))}
                </div>
              )}

              {media.genres.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Genres">
                  {media.genres.map((genre) => (
                    <li
                      key={genre.id}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                    >
                      {genre.name}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6">
                <PlaybackActions canPlay={canPlay} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto mt-10 max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-10">
            {media.description && (
              <section aria-labelledby="overview-heading">
                <h2
                  id="overview-heading"
                  className="mb-3 text-lg font-semibold text-white"
                >
                  Overview
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                  {media.description}
                </p>
              </section>
            )}

            {isSeries && media.episodes.length > 0 && (
              <section aria-labelledby="episodes-heading">
                <h2
                  id="episodes-heading"
                  className="mb-4 flex items-baseline gap-3 text-lg font-semibold text-white"
                >
                  Episodes
                  {episodeCount && (
                    <span className="text-sm font-normal text-white/50">
                      {episodeCount}
                    </span>
                  )}
                </h2>
                <EpisodeList episodes={media.episodes} />
              </section>
            )}
          </div>

          {media.people.length > 0 && (
            <aside aria-labelledby="credits-heading">
              <h2
                id="credits-heading"
                className="mb-3 text-lg font-semibold text-white"
              >
                Credits
              </h2>
              <CastList people={media.people} />
            </aside>
          )}
        </div>
      </div>
    </main>
  )
}
